#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createLLMEnricher } from './enrichment/llm-enricher';
import { createGooglePlacesService } from './enrichment/services/google-places-service';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const enricher = createLLMEnricher(supabase, { model: 'gpt-4o-mini' });

// Optional: Google Places service for photos
const googlePlaces = process.env.GOOGLE_PLACES_API_KEY
  ? createGooglePlacesService({ apiKey: process.env.GOOGLE_PLACES_API_KEY })
  : null;

interface RestaurantRow {
  id: string;
  name: string;
  city: string;
  state: string | null;
  description: string | null;
  status: string;
  enrichment_status: string;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1], 10)
    : 10;
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--all');
  const withPhotos = args.includes('--with-photos');

  console.log('\n🍔 DDD Restaurant Enrichment');
  console.log('━'.repeat(50));
  console.log(`Model: ${enricher.getModelName()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} restaurants`);
  console.log(`Photos: ${withPhotos ? (googlePlaces ? 'YES (Google Places)' : 'SKIPPED (no API key)') : 'NO'}`);
  console.log('');

  // Fetch restaurants that need enrichment WITH episode data
  let query = supabase
    .from('restaurants')
    .select(`
      id, name, city, state, description, status, enrichment_status,
      restaurant_episodes!left (
        episode_id,
        episodes!left (
          id, season, episode_number, title
        )
      )
    `)
    .limit(limit);

  if (!forceAll) {
    query = query.or('description.is.null,enrichment_status.eq.pending');
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ No restaurants need enrichment!');
    process.exit(0);
  }

  console.log(`Found ${restaurants.length} restaurant(s) to enrich\n`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i] as any;
    const num = `[${i + 1}/${restaurants.length}]`;

    // Extract episode data (first episode if multiple)
    const episodeLink = restaurant.restaurant_episodes?.[0];
    const episode = episodeLink?.episodes;

    console.log(`${num} ${restaurant.name} (${restaurant.city}${restaurant.state ? ', ' + restaurant.state : ''})`);
    if (episode) {
      console.log(`      📺 Episode: S${episode.season}E${episode.episode_number} - ${episode.title}`);
    }

    if (dryRun) {
      console.log('      🔍 DRY RUN - Skipping actual enrichment');
      continue;
    }

    try {
      const result = await enricher.enrichRestaurant(
        restaurant.id,
        restaurant.name,
        restaurant.city,
        restaurant.state,
        episode?.title,
        episode?.season,
        episode?.episode_number
      );

      if (result.success) {
        // Update restaurant with enrichment data
        const updateData: any = {
          description: result.description,
          price_tier: result.price_tier,
          guy_quote: result.guy_quote,
          enrichment_status: 'completed',
          last_enriched_at: new Date().toISOString(),
        };

        // Add status and closed_date if present
        if (result.status) {
          updateData.status = result.status;
          if (result.closed_date) {
            // Parse partial dates to PostgreSQL date format
            // "2014" -> "2014-01-01", "2014-10" -> "2014-10-01", "2014-10-15" -> "2014-10-15"
            const dateParts = result.closed_date.split('-');
            if (dateParts.length === 1) {
              // Only year: YYYY -> YYYY-01-01
              updateData.closed_date = `${dateParts[0]}-01-01`;
            } else if (dateParts.length === 2) {
              // Year and month: YYYY-MM -> YYYY-MM-01
              updateData.closed_date = `${dateParts[0]}-${dateParts[1]}-01`;
            } else {
              // Full date: YYYY-MM-DD
              updateData.closed_date = result.closed_date;
            }
          }
        }

        const { error: updateError } = await supabase
          .from('restaurants')
          .update(updateData)
          .eq('id', restaurant.id);

        if (updateError) {
          console.log(`      ❌ Database update failed: ${updateError.message}`);
          failCount++;
        } else {
          // Handle cuisines via junction table
          if (result.cuisines && result.cuisines.length > 0) {
            console.log(`      🏷️  Linking cuisines: ${result.cuisines.join(', ')}`);

            // First, delete existing cuisine links
            await supabase
              .from('restaurant_cuisines')
              .delete()
              .eq('restaurant_id', restaurant.id);

            // Then, create/link cuisines
            for (const cuisineName of result.cuisines) {
              const slug = cuisineName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

              // Upsert cuisine (create if doesn't exist, return existing if exists)
              const { data: cuisine, error: cuisineError } = await supabase
                .from('cuisines')
                .upsert(
                  { name: cuisineName, slug },
                  { onConflict: 'slug' }
                )
                .select('id')
                .single();

              if (cuisineError) {
                console.log(`      ⚠️  Failed to upsert cuisine "${cuisineName}": ${cuisineError.message}`);
                continue;
              }

              if (cuisine) {
                // Link restaurant to cuisine (ignore if already exists)
                const { error: linkError } = await supabase
                  .from('restaurant_cuisines')
                  .insert({
                    restaurant_id: restaurant.id,
                    cuisine_id: cuisine.id,
                  });

                // Ignore duplicate errors (23505 is PostgreSQL unique violation)
                if (linkError && linkError.code !== '23505') {
                  console.log(`      ⚠️  Failed to link cuisine "${cuisineName}": ${linkError.message}`);
                } else if (!linkError) {
                  console.log(`      ✅ Linked cuisine: ${cuisineName}`);
                }
              }
            }
          }

          // Handle dishes (new!)
          if (result.dishes && result.dishes.length > 0) {
            console.log(`      🍽️  Processing ${result.dishes.length} dish(es)...`);

            for (const dish of result.dishes) {
              const slug = dish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

              const { error: dishError } = await supabase
                .from('dishes')
                .upsert({
                  restaurant_id: restaurant.id,
                  episode_id: episode?.id || null,
                  name: dish.name,
                  slug,
                  description: dish.description,
                  guy_reaction: dish.guy_reaction,
                  is_signature_dish: dish.is_signature_dish,
                }, { onConflict: 'restaurant_id,slug' });

              if (dishError && dishError.code !== '23505') {
                console.log(`      ⚠️  Failed to save dish "${dish.name}": ${dishError.message}`);
              }
            }
            console.log(`      ✅ Saved ${result.dishes.length} dish(es)`);
          }

          // Update segment notes (new!)
          if (result.segment_notes && episode?.id) {
            const { error: notesError } = await supabase
              .from('restaurant_episodes')
              .update({ segment_notes: result.segment_notes })
              .eq('restaurant_id', restaurant.id)
              .eq('episode_id', episode.id);

            if (notesError) {
              console.log(`      ⚠️  Failed to update segment notes: ${notesError.message}`);
            } else {
              console.log(`      📝 Updated segment notes`);
            }
          }

          // Save contact info and parse location (new!)
          if (result.address || result.phone || result.website) {
            const { parseAddress } = await import('./enrichment/shared/address-parser');

            const contactUpdate: any = {};
            if (result.address) {
              contactUpdate.address = result.address;

              // Parse city/state from address - enriched data overwrites Wikipedia data
              const { city: parsedCity, state: parsedState } = parseAddress(result.address);
              if (parsedCity) contactUpdate.city = parsedCity;
              if (parsedState) contactUpdate.state = parsedState;

              console.log(`      📍 Parsed location: ${parsedCity}, ${parsedState}`);
            }
            if (result.phone) contactUpdate.phone = result.phone;
            if (result.website) contactUpdate.website_url = result.website;

            const { error: contactError } = await supabase
              .from('restaurants')
              .update(contactUpdate)
              .eq('id', restaurant.id);

            if (contactError) {
              console.log(`      ⚠️  Failed to update contact info: ${contactError.message}`);
            } else {
              const fields = [];
              if (result.address) fields.push('address');
              if (result.phone) fields.push('phone');
              if (result.website) fields.push('website');
              console.log(`      📞 Updated contact info (${fields.join(', ')})`);
            }
          }

          // Fetch photos from Google Places (optional)
          if (withPhotos && googlePlaces) {
            try {
              console.log(`      📸 Fetching photos from Google Places...`);

              const placeResult = await googlePlaces.findPlaceId(
                restaurant.name,
                restaurant.city,
                restaurant.state
              );

              if (placeResult.placeId && placeResult.confidence >= 0.7) {
                console.log(`      ✓ Found place (confidence: ${(placeResult.confidence * 100).toFixed(0)}%)`);

                const details = await googlePlaces.getPlaceDetails(placeResult.placeId);

                if (details && details.photos && details.photos.length > 0) {
                  // Download and upload photos to Supabase Storage
                  const photoUrls: string[] = [];
                  const maxPhotos = Math.min(5, details.photos.length);
                  const restaurantSlug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                  for (let i = 0; i < maxPhotos; i++) {
                    try {
                      // Download photo as buffer
                      const photoBuffer = await googlePlaces.getPhotoBuffer(details.photos[i].name, 800);

                      if (photoBuffer) {
                        // Upload to Supabase Storage
                        const fileName = `${restaurantSlug}-${i + 1}-${Date.now()}.jpg`;
                        const filePath = `${restaurant.id}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from('restaurant-photos')
                          .upload(filePath, photoBuffer, {
                            contentType: 'image/jpeg',
                            cacheControl: '31536000', // 1 year
                            upsert: false,
                          });

                        if (uploadError) {
                          console.log(`      ⚠️  Upload failed for photo ${i + 1}: ${uploadError.message}`);
                        } else {
                          // Get public URL
                          const { data: publicUrlData } = supabase.storage
                            .from('restaurant-photos')
                            .getPublicUrl(filePath);

                          photoUrls.push(publicUrlData.publicUrl);
                        }
                      }
                    } catch (photoErr) {
                      console.log(`      ⚠️  Photo ${i + 1} processing error: ${photoErr instanceof Error ? photoErr.message : String(photoErr)}`);
                    }
                  }

                  if (photoUrls.length > 0) {
                    const { error: photoError } = await supabase
                      .from('restaurants')
                      .update({
                        photos: photoUrls,
                        google_place_id: placeResult.placeId,
                        google_rating: details.rating,
                        google_review_count: details.userRatingsTotal,
                      })
                      .eq('id', restaurant.id);

                    if (photoError) {
                      console.log(`      ⚠️  Failed to save photos: ${photoError.message}`);
                    } else {
                      console.log(`      ✅ Uploaded and saved ${photoUrls.length} photo(s)`);
                    }
                  }
                } else {
                  console.log(`      ⚠️  No photos found on Google Places`);
                }
              } else {
                console.log(`      ⚠️  Place not found or low confidence (${(placeResult.confidence * 100).toFixed(0)}%)`);
              }
            } catch (photoErr) {
              const photoMsg = photoErr instanceof Error ? photoErr.message : String(photoErr);
              console.log(`      ⚠️  Photo fetch error: ${photoMsg}`);
            }
          }

          const statusInfo = result.status === 'closed' && result.closed_date
            ? ` | ⚠️  CLOSED (${result.closed_date})`
            : result.status === 'closed'
              ? ' | ⚠️  CLOSED'
              : '';
          console.log(`      ✅ Enriched: ${result.cuisines?.join(', ')} | ${result.price_tier} | ${result.dishes?.length || 0} dishes${statusInfo}`);
          successCount++;
        }
      } else {
        console.log(`      ⚠️  Enrichment failed: ${result.error}`);
        failCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`      ❌ Error: ${msg}`);
      failCount++;
    }

    // Small delay to avoid rate limits
    if (i < restaurants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const tokens = enricher.getTotalTokensUsed();
  const llmCost = enricher.estimateCost();
  const googlePlacesCost = withPhotos && googlePlaces ? googlePlaces.getTotalCost() : 0;
  const totalCost = llmCost + googlePlacesCost;

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️  Time: ${elapsed}s`);
  console.log(`🪙 Tokens: ${tokens.total.toLocaleString()} (${tokens.prompt.toLocaleString()} in / ${tokens.completion.toLocaleString()} out)`);
  console.log(`💰 LLM Cost: $${llmCost.toFixed(4)}`);
  if (withPhotos && googlePlaces) {
    console.log(`📸 Google Places Cost: $${googlePlacesCost.toFixed(4)}`);
    console.log(`💵 Total Cost: $${totalCost.toFixed(4)}`);
  }
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
