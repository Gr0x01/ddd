#!/usr/bin/env tsx
/**
 * Geocode Restaurants Using Nominatim
 *
 * Uses OpenStreetMap's Nominatim API to geocode restaurants missing coordinates.
 * Respects Nominatim's usage policy: max 1 request per second, single-threaded.
 *
 * Usage:
 *   npm run geocode              # Geocode all missing restaurants
 *   npm run geocode -- --limit=10  # Test with first 10 restaurants
 *   npm run geocode -- --dry-run   # Preview without saving
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabase as getSupabaseClient } from '../src/lib/supabase';

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const RATE_LIMIT_MS = 1000; // 1 request per second
const USER_AGENT = 'DDD-RoadTrip-App/1.0'; // Required by Nominatim

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(restaurant: Restaurant): Promise<{ lat: number; lng: number } | null> {
  // Strategy 1: Use full address if available (it often contains everything)
  let query = restaurant.address;

  // Strategy 2: Build from parts if no full address
  if (!query) {
    const parts: string[] = [];
    if (restaurant.city) parts.push(restaurant.city);
    if (restaurant.state) parts.push(restaurant.state);
    if (restaurant.zip) parts.push(restaurant.zip);
    if (restaurant.country && restaurant.country !== 'US') parts.push(restaurant.country);
    query = parts.join(', ');
  }

  if (!query) {
    console.error(`  ❌ No address data for ${restaurant.name}`);
    return null;
  }

  try {
    const url = new URL('/search', NOMINATIM_BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error(`  ❌ Nominatim API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      console.warn(`  ⚠️  No results found for: ${query}`);
      return null;
    }

    const result = results[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    console.error(`  ❌ Geocoding error:`, error);
    return null;
  }
}

async function updateRestaurantCoordinates(
  restaurantId: string,
  lat: number,
  lng: number
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('restaurants')
    .update({
      latitude: lat,
      longitude: lng,
    })
    .eq('id', restaurantId);

  if (error) {
    console.error(`  ❌ Database update error:`, error);
    return false;
  }

  return true;
}

async function getRestaurantsMissingCoordinates(limit?: number): Promise<Restaurant[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('restaurants')
    .select('id, name, address, city, state, zip, country, latitude, longitude')
    .eq('status', 'open')
    .or('latitude.is.null,longitude.is.null')
    .order('state', { ascending: true })
    .order('city', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Restaurant[];
}

interface GeocodeStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  startTime: Date;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  console.log('🗺️  GEOCODING RESTAURANTS WITH NOMINATIM\n');
  console.log('📋 Configuration:');
  console.log(`   Rate limit: 1 request per second`);
  console.log(`   User agent: ${USER_AGENT}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no saves)' : 'LIVE'}`);
  if (limit) console.log(`   Limit: ${limit} restaurants`);
  console.log();

  const restaurants = await getRestaurantsMissingCoordinates(limit);

  console.log(`📊 Found ${restaurants.length} restaurants missing coordinates\n`);

  if (restaurants.length === 0) {
    console.log('✅ All restaurants already have coordinates!');
    return;
  }

  const estimatedMinutes = Math.ceil(restaurants.length / 60);
  console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes (1 request per second)\n`);

  if (!dryRun) {
    console.log('Press Ctrl+C to cancel...\n');
    await sleep(3000);
  }

  const stats: GeocodeStats = {
    total: restaurants.length,
    success: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    const progress = `[${i + 1}/${restaurants.length}]`;

    console.log(`${progress} ${restaurant.name} (${restaurant.city}, ${restaurant.state})`);

    // Geocode the restaurant
    const coords = await geocodeAddress(restaurant);

    if (!coords) {
      console.log(`  ⚠️  Failed to geocode\n`);
      stats.failed++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    console.log(`  ✅ Found: ${coords.lat}, ${coords.lng}`);

    // Save to database (unless dry run)
    if (!dryRun) {
      const saved = await updateRestaurantCoordinates(restaurant.id, coords.lat, coords.lng);
      if (saved) {
        console.log(`  💾 Saved to database`);
        stats.success++;
      } else {
        console.log(`  ❌ Failed to save`);
        stats.failed++;
      }
    } else {
      console.log(`  🔍 DRY RUN - would save`);
      stats.success++;
    }

    console.log();

    // Rate limit: wait 1 second between requests
    if (i < restaurants.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Final stats
  const elapsed = Date.now() - stats.startTime.getTime();
  const elapsedMinutes = Math.floor(elapsed / 60000);
  const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

  console.log('=' .repeat(80));
  console.log('📊 GEOCODING COMPLETE\n');
  console.log(`Total processed: ${stats.total}`);
  console.log(`✅ Success: ${stats.success}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏱️  Time elapsed: ${elapsedMinutes}m ${elapsedSeconds}s`);

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes were saved to the database');
    console.log('   Run without --dry-run to save results');
  } else {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    console.log(`\n✨ Success rate: ${successRate}%`);
  }
}

main().catch(console.error);
