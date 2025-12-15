#!/usr/bin/env tsx
/**
 * Data Cleanup Script for Restaurants
 *
 * Fixes common data quality issues that prevent successful geocoding:
 * - Duplicate city/state in addresses
 * - Malformed state codes (dates, zip codes)
 * - Malformed cities (dates, zip codes)
 * - Duplicate restaurant entries
 *
 * Usage:
 *   npm run tsx scripts/cleanup-restaurant-data.ts
 *   npm run tsx scripts/cleanup-restaurant-data.ts -- --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface CleanupAction {
  id: string;
  name: string;
  issue: string;
  oldValue: string;
  newValue: string;
  field: string;
}

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
  // Canadian provinces
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
]);

function extractStateFromAddress(address: string): string | null {
  // Try to find a state code in the address
  const stateMatch = address.match(/\b([A-Z]{2})\b/g);
  if (stateMatch) {
    for (const potentialState of stateMatch) {
      if (US_STATES.has(potentialState)) {
        return potentialState;
      }
    }
  }
  return null;
}

function extractCityFromAddress(address: string): string | null {
  // Common pattern: "123 Street, City, ST 12345"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Second-to-last part is often the city
    const cityCandidate = parts[parts.length - 2];
    // Make sure it's not a state code
    if (cityCandidate.length > 2 && !US_STATES.has(cityCandidate)) {
      return cityCandidate;
    }
  }
  return null;
}

function cleanAddress(address: string, city: string, state: string): string {
  let cleaned = address;

  // Remove duplicate city names (case insensitive)
  const cityRegex = new RegExp(`,\\s*${city}`, 'gi');
  const matches = address.match(cityRegex);
  if (matches && matches.length > 1) {
    // Keep only the first occurrence
    let found = false;
    cleaned = address.replace(cityRegex, (match) => {
      if (!found) {
        found = true;
        return match;
      }
      return '';
    });
  }

  // Remove duplicate state codes
  const stateRegex = new RegExp(`\\b${state}\\b`, 'gi');
  const stateMatches = cleaned.match(stateRegex);
  if (stateMatches && stateMatches.length > 1) {
    let found = false;
    cleaned = cleaned.replace(stateRegex, (match) => {
      if (!found) {
        found = true;
        return match;
      }
      return '';
    });
  }

  // Clean up extra commas and spaces
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('\n🧹 RESTAURANT DATA CLEANUP\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  // Fetch all restaurants missing coordinates
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, address, city, state, zip, latitude, longitude')
    .eq('status', 'open')
    .or('latitude.is.null,longitude.is.null')
    .order('state')
    .order('city');

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ No restaurants need cleanup!');
    process.exit(0);
  }

  console.log(`📊 Found ${restaurants.length} restaurants to check\n`);

  const actions: CleanupAction[] = [];
  const duplicates: Map<string, Restaurant[]> = new Map();

  // Find duplicates by name+city
  for (const restaurant of restaurants) {
    const key = `${restaurant.name}|${restaurant.city}`.toLowerCase();
    if (!duplicates.has(key)) {
      duplicates.set(key, []);
    }
    duplicates.get(key)!.push(restaurant);
  }

  // Process each restaurant
  for (const restaurant of restaurants) {
    // Check 1: Malformed state code
    if (restaurant.state && (!US_STATES.has(restaurant.state.toUpperCase()) || restaurant.state.length !== 2)) {
      // Try to extract from address
      if (restaurant.address) {
        const extractedState = extractStateFromAddress(restaurant.address);
        if (extractedState) {
          actions.push({
            id: restaurant.id,
            name: restaurant.name,
            issue: 'Invalid state code',
            oldValue: restaurant.state,
            newValue: extractedState,
            field: 'state'
          });
        }
      }
    }

    // Check 2: Malformed city (dates, zip codes)
    if (restaurant.city && /^[0-9]/.test(restaurant.city)) {
      // Try to extract from address
      if (restaurant.address) {
        const extractedCity = extractCityFromAddress(restaurant.address);
        if (extractedCity) {
          actions.push({
            id: restaurant.id,
            name: restaurant.name,
            issue: 'Invalid city name',
            oldValue: restaurant.city,
            newValue: extractedCity,
            field: 'city'
          });
        }
      }
    }

    // Check 3: Duplicate city/state in address
    if (restaurant.address && restaurant.city && restaurant.state) {
      const cleaned = cleanAddress(restaurant.address, restaurant.city, restaurant.state);
      if (cleaned !== restaurant.address) {
        actions.push({
          id: restaurant.id,
          name: restaurant.name,
          issue: 'Duplicate city/state in address',
          oldValue: restaurant.address,
          newValue: cleaned,
          field: 'address'
        });
      }
    }
  }

  // Report duplicates
  const trueDuplicates = Array.from(duplicates.entries())
    .filter(([_, items]) => items.length > 1);

  if (trueDuplicates.length > 0) {
    console.log('🔍 DUPLICATE RESTAURANTS FOUND:\n');
    for (const [key, items] of trueDuplicates) {
      console.log(`📍 ${items[0].name} (${items[0].city}):`);
      items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ID: ${item.id}`);
        console.log(`      Address: ${item.address || 'N/A'}`);
        console.log(`      State: ${item.state || 'N/A'}`);
      });
      console.log('');
    }
    console.log(`⚠️  Found ${trueDuplicates.length} duplicate restaurant(s)\n`);
  }

  // Report and apply cleanup actions
  if (actions.length === 0) {
    console.log('✅ No data quality issues found!');
  } else {
    console.log(`🔧 CLEANUP ACTIONS (${actions.length} total):\n`);

    // Group by issue type
    const byIssue: Record<string, CleanupAction[]> = {};
    actions.forEach(action => {
      if (!byIssue[action.issue]) {
        byIssue[action.issue] = [];
      }
      byIssue[action.issue].push(action);
    });

    for (const [issue, issueActions] of Object.entries(byIssue)) {
      console.log(`\n${issue} (${issueActions.length} restaurants):`);
      issueActions.slice(0, 5).forEach(action => {
        console.log(`  • ${action.name}`);
        console.log(`    ${action.field}: "${action.oldValue}" → "${action.newValue}"`);
      });
      if (issueActions.length > 5) {
        console.log(`  ... and ${issueActions.length - 5} more`);
      }
    }

    if (!dryRun) {
      console.log('\n\n🚀 Applying fixes...\n');

      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          const updateData: any = {};
          updateData[action.field] = action.newValue;

          const { error } = await supabase
            .from('restaurants')
            .update(updateData)
            .eq('id', action.id);

          if (error) {
            console.log(`❌ Failed to update ${action.name}: ${error.message}`);
            failCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`❌ Error updating ${action.name}: ${err}`);
          failCount++;
        }
      }

      console.log(`\n✅ Applied ${successCount} fixes`);
      if (failCount > 0) {
        console.log(`❌ Failed ${failCount} fixes`);
      }
    } else {
      console.log('\n\n🔍 DRY RUN - Run without --dry-run to apply these fixes');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY\n');
  console.log(`Total restaurants checked: ${restaurants.length}`);
  console.log(`Data quality issues found: ${actions.length}`);
  console.log(`Duplicate restaurants: ${trueDuplicates.length}`);

  if (trueDuplicates.length > 0) {
    console.log('\n💡 TIP: Review duplicate restaurants manually and merge/delete as needed');
  }
}

main().catch(console.error);
