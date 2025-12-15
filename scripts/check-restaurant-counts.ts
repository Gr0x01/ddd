#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabase as getSupabaseClient } from '../src/lib/supabase';

async function checkCounts() {
  const supabase = getSupabaseClient();

  // Total restaurants
  const { count: totalCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true });

  // Open restaurants
  const { count: openCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  // Open + public
  const { count: openPublicCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('is_public', true);

  // Open + public + geocoded
  const { count: openPublicGeocodedCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('is_public', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Open but not public
  const { count: openNotPublicCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('is_public', false);

  // Open but missing coordinates
  const { data: missingCoords } = await supabase
    .from('restaurants')
    .select('id, name, city, state, latitude, longitude')
    .eq('status', 'open')
    .or('latitude.is.null,longitude.is.null')
    .limit(10);

  console.log('🔍 RESTAURANT COUNT BREAKDOWN:\n');
  console.log(`Total restaurants: ${totalCount}`);
  console.log(`Open restaurants: ${openCount}`);
  console.log(`Open + public: ${openPublicCount}`);
  console.log(`Open + public + geocoded: ${openPublicGeocodedCount}`);
  console.log(`Open but NOT public: ${openNotPublicCount}`);
  console.log();

  const missingCoordsCount = openCount! - openPublicGeocodedCount!;
  console.log(`⚠️  Open restaurants missing coordinates: ${missingCoordsCount}`);

  if (missingCoords && missingCoords.length > 0) {
    console.log('\nSample restaurants without coordinates:');
    missingCoords.forEach(r => {
      console.log(`  • ${r.name} (${r.city}, ${r.state}) - lat: ${r.latitude}, lng: ${r.longitude}`);
    });
  }

  console.log('\n📊 FILTER IMPACT:');
  console.log(`✅ Query used in research script: ${openPublicGeocodedCount} restaurants`);
  console.log(`❌ Filtered out ${openCount! - openPublicGeocodedCount!} open restaurants due to missing coords or not public`);
}

checkCounts().catch(console.error);
