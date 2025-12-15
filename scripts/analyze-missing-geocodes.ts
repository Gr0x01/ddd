#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabase as getSupabaseClient } from '../src/lib/supabase';

async function main() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, address, city, state, zip, country, latitude, longitude, enrichment_status, last_enriched_at, google_place_id')
    .eq('status', 'open')
    .or('latitude.is.null,longitude.is.null')
    .order('state')
    .order('city')
    .order('name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`\n🔍 Found ${data.length} restaurants missing coordinates\n`);

  const byEnrichmentStatus: Record<string, any[]> = {
    completed: [],
    failed: [],
    pending: [],
    null: []
  };

  console.log('State | City | Name | Address | Enrichment | Google Place');
  console.log('='.repeat(120));

  data.forEach(r => {
    const status = r.enrichment_status || 'null';
    if (!byEnrichmentStatus[status]) {
      byEnrichmentStatus[status] = [];
    }
    byEnrichmentStatus[status].push(r);

    const addr = r.address ? r.address.substring(0, 30) : 'N/A';
    const state = r.state || '??';
    console.log(`${state.padEnd(5)} | ${r.city.padEnd(20).substring(0, 20)} | ${r.name.padEnd(30).substring(0, 30)} | ${addr.padEnd(30)} | ${(status).padEnd(10)} | ${r.google_place_id ? 'YES' : 'NO'}`);
  });

  console.log('\n\n📊 BREAKDOWN BY ENRICHMENT STATUS:\n');
  Object.entries(byEnrichmentStatus).forEach(([status, restaurants]) => {
    if (restaurants.length > 0) {
      console.log(`  ${status.padEnd(15)}: ${restaurants.length} restaurants`);

      // Show a few examples
      if (restaurants.length > 0 && restaurants.length <= 5) {
        restaurants.forEach(r => {
          console.log(`    - ${r.name} (${r.city}, ${r.state})`);
        });
      } else if (restaurants.length > 5) {
        restaurants.slice(0, 3).forEach(r => {
          console.log(`    - ${r.name} (${r.city}, ${r.state})`);
        });
        console.log(`    ... and ${restaurants.length - 3} more`);
      }
      console.log('');
    }
  });

  // Analyze by state
  const byState: Record<string, any[]> = {};
  data.forEach(r => {
    const state = r.state || 'Unknown';
    if (!byState[state]) {
      byState[state] = [];
    }
    byState[state].push(r);
  });

  console.log('\n📍 BREAKDOWN BY STATE:\n');
  Object.entries(byState)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([state, restaurants]) => {
      console.log(`  ${state}: ${restaurants.length} restaurants`);
    });
}

main().catch(console.error);
