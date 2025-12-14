/**
 * Fix Restaurant State Data
 *
 * Fixes restaurants where the state field contains years or invalid data
 * by setting them to NULL so they can be re-enriched properly.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Valid US state abbreviations
const VALID_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC' // Washington D.C.
]);

// Valid US state full names
const VALID_STATE_NAMES = new Set([
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
  'D.C.', 'Washington, D.C.'
]);

async function fixStates() {
  console.log('🔍 Finding restaurants with invalid state data...\n');

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, state, city, location');

  if (error) {
    console.error('Error fetching restaurants:', error);
    return;
  }

  console.log(`Total restaurants: ${restaurants.length}\n`);

  const invalidRestaurants = restaurants.filter(r => {
    if (!r.state) return false;

    // Check if it's a valid state abbreviation or name
    if (VALID_STATES.has(r.state) || VALID_STATE_NAMES.has(r.state)) {
      return false;
    }

    return true;
  });

  console.log(`Found ${invalidRestaurants.length} restaurants with invalid states:\n`);

  // Group by invalid state value
  const byState = invalidRestaurants.reduce((acc, r) => {
    if (!acc[r.state]) acc[r.state] = [];
    acc[r.state].push(r);
    return acc;
  }, {} as Record<string, typeof invalidRestaurants>);

  Object.entries(byState).forEach(([state, restaurants]) => {
    console.log(`  ${state}: ${restaurants.length} restaurants`);
  });

  console.log('\n🔧 Fixing invalid state data...\n');

  let fixed = 0;
  for (const restaurant of invalidRestaurants) {
    const { error } = await supabase
      .from('restaurants')
      .update({
        state: null,
        // Set enrichment status to pending so they get re-processed
        enrichment_status: 'pending'
      })
      .eq('id', restaurant.id);

    if (error) {
      console.error(`  ❌ Failed to fix ${restaurant.name}:`, error);
    } else {
      fixed++;
      console.log(`  ✅ Fixed: ${restaurant.name} (was: ${restaurant.state})`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} restaurants`);
  console.log('\nThese restaurants can now be re-enriched with correct state data.');
}

fixStates();
