#!/usr/bin/env tsx

/**
 * Populate Cities Table from Restaurant Data
 *
 * Extracts all unique (city, state) combinations from restaurants and
 * populates the cities table. Idempotent - safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/db/populate-cities.ts              # Run for real
 *   npx tsx scripts/db/populate-cities.ts --dry-run    # Preview only
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Restaurants must exist in database
 *   - States table must be populated (should already be seeded)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Generate URL-friendly slug from city name
 */
function generateSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error(`Invalid city name for slug generation: ${name}`);
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens

  if (!slug) {
    throw new Error(`Generated empty slug for city: ${name}`);
  }

  return slug;
}

/**
 * Normalize state name to handle DC variants and inconsistencies
 */
function normalizeStateName(state: string | null): string | null {
  if (!state) return null;

  const normalized = state.trim();

  // Handle DC variants
  const dcVariants = ['DC', 'D.C.', 'Washington, D.C.', 'District of Columbia'];
  if (dcVariants.includes(normalized)) {
    return 'District of Columbia';
  }

  return normalized;
}

/**
 * Main function to populate cities table
 */
async function populateCities(dryRun = false) {
  console.log('🏙️  DDD City Population Tool');
  console.log('===========================\n');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing required environment variables');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Check your .env.local file\n');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Fetch all states for mapping
    console.log('📋 Step 1: Fetching states...');
    const { data: states, error: statesError } = await supabase
      .from('states')
      .select('id, name, abbreviation, slug');

    if (statesError) {
      throw new Error(`Failed to fetch states: ${statesError.message}`);
    }

    if (!states || states.length === 0) {
      throw new Error('No states found in database. Run migration first.');
    }

    console.log(`✅ Found ${states.length} states\n`);

    // Create lookup maps
    const stateByName = new Map(states.map(s => [s.name, s]));
    const stateByAbbr = new Map(states.map(s => [s.abbreviation, s]));

    // Step 2: Get all restaurants with city/state data
    console.log('🍔 Step 2: Fetching restaurants...');
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('city, state')
      .eq('is_public', true);

    if (restaurantsError) {
      throw new Error(`Failed to fetch restaurants: ${restaurantsError.message}`);
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('⚠️  No restaurants found. Import restaurants first.\n');
      process.exit(0);
    }

    console.log(`✅ Found ${restaurants.length} restaurants\n`);

    // Step 3: Build unique city list with state mapping
    console.log('🗺️  Step 3: Extracting unique cities...');
    const cityMap = new Map<string, any>();
    const warnings: string[] = [];

    restaurants.forEach(r => {
      // Skip restaurants without city data
      if (!r.city) {
        return;
      }

      const normalizedState = normalizeStateName(r.state);
      if (!normalizedState) {
        return;
      }

      // Create unique key for city/state combination
      const key = `${r.city}|||${normalizedState}`;
      if (cityMap.has(key)) {
        return; // Already processed this city
      }

      // Try to match state by full name first, then abbreviation
      let stateObj = stateByName.get(normalizedState) || stateByAbbr.get(normalizedState);

      if (stateObj) {
        cityMap.set(key, {
          slug: generateSlug(r.city),
          name: r.city,
          state_id: stateObj.id,
          state_name: stateObj.name,
          restaurant_count: 0, // Will be auto-populated by trigger
          meta_description: null,
        });
      } else {
        warnings.push(`No state match: ${r.city}, ${r.state}`);
      }
    });

    const cityRecords = Array.from(cityMap.values());
    console.log(`✅ Found ${cityRecords.length} unique cities\n`);

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.slice(0, 10).forEach(w => console.log(`   - ${w}`));
      if (warnings.length > 10) {
        console.log(`   ... and ${warnings.length - 10} more\n`);
      } else {
        console.log('');
      }
    }

    // Dry run mode - just preview
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - Preview of first 10 cities:\n');
      cityRecords.slice(0, 10).forEach((city, i) => {
        console.log(`${i + 1}. ${city.name}, ${city.state_name}`);
        console.log(`   Slug: ${city.slug}`);
        console.log(`   State ID: ${city.state_id}\n`);
      });
      console.log(`💡 Run without --dry-run to populate ${cityRecords.length} cities\n`);
      return;
    }

    // Step 4: Batch upsert cities
    console.log('💾 Step 4: Upserting cities to database...');
    const BATCH_SIZE = 500;
    let processedCount = 0;

    for (let i = 0; i < cityRecords.length; i += BATCH_SIZE) {
      const batch = cityRecords.slice(i, i + BATCH_SIZE);

      const { error: upsertError } = await supabase
        .from('cities')
        .upsert(batch, {
          onConflict: 'slug,state_name',
        });

      if (upsertError) {
        throw new Error(`Failed to upsert batch ${i / BATCH_SIZE + 1}: ${upsertError.message}`);
      }

      processedCount += batch.length;
      console.log(`   Processed ${processedCount}/${cityRecords.length} cities`);
    }

    console.log('✅ All cities upserted\n');

    // Step 5: Sync restaurant counts
    console.log('🔄 Step 5: Syncing restaurant counts...');
    const { error: syncError } = await supabase.rpc('sync_city_counts');

    if (syncError) {
      console.error('⚠️  Warning: Failed to sync city counts:', syncError.message);
      console.log('   You can manually run: SELECT sync_city_counts();\n');
    } else {
      console.log('✅ Restaurant counts synced\n');
    }

    // Step 6: Verify results
    console.log('🔍 Step 6: Verifying results...');
    const { data: citiesWithCounts, error: verifyError } = await supabase
      .from('cities')
      .select('name, state_name, restaurant_count')
      .gt('restaurant_count', 0)
      .order('restaurant_count', { ascending: false })
      .limit(10);

    if (verifyError) {
      console.error('⚠️  Warning: Failed to verify:', verifyError.message);
    } else if (citiesWithCounts && citiesWithCounts.length > 0) {
      console.log('\n📊 Top 10 cities by restaurant count:');
      citiesWithCounts.forEach((city, i) => {
        console.log(`   ${i + 1}. ${city.name}, ${city.state_name} - ${city.restaurant_count} restaurants`);
      });
    }

    console.log('\n✨ City population complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Visit city pages: http://localhost:3000/city/california/san-francisco');
    console.log('   2. Run build to pre-render: npm run build');
    console.log('   3. Check sitemap includes cities: http://localhost:3000/sitemap.xml\n');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n❌ ERROR:', errorMessage);
    process.exit(1);
  }
}

// Check for dry-run flag
const dryRun = process.argv.includes('--dry-run');

// Run the script
populateCities(dryRun).catch(console.error);
