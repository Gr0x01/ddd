import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map full state names to abbreviations
const stateMapping: Record<string, string> = {
  // US States
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  'D.C.': 'DC',
  'Puerto Rico': 'PR',

  // Canadian Provinces
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Ontario': 'ON',
};

// Special cases that need manual review
const specialCases: Record<string, { city: string; state: string; country: string }> = {
  'Los Angeles': { city: 'Los Angeles', state: 'CA', country: 'USA' },
  'Messina': { city: 'Messina', state: 'Sicily', country: 'Italy' },
};

async function main() {
  console.log('🔍 Finding restaurants with full state names...\n');

  let fixed = 0;
  let specialCaseCount = 0;

  // Fix standard state name mappings
  for (const [fullName, abbr] of Object.entries(stateMapping)) {
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, state')
      .eq('state', fullName);

    if (fetchError) {
      console.error(`Error fetching restaurants for ${fullName}:`, fetchError);
      continue;
    }

    if (restaurants && restaurants.length > 0) {
      console.log(`📝 Converting "${fullName}" to "${abbr}" (${restaurants.length} restaurants)`);

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ state: abbr })
        .eq('state', fullName);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated ${restaurants.length} restaurants\n`);
        fixed += restaurants.length;
      }
    }
  }

  // Fix special cases
  for (const [badState, correction] of Object.entries(specialCases)) {
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, city, state')
      .eq('state', badState);

    if (fetchError) {
      console.error(`Error fetching restaurants for ${badState}:`, fetchError);
      continue;
    }

    if (restaurants && restaurants.length > 0) {
      console.log(`⚠️  Special case: "${badState}" (${restaurants.length} restaurants)`);

      for (const restaurant of restaurants) {
        console.log(`   Fixing: ${restaurant.name}`);
        console.log(`     Old: ${restaurant.city}, ${restaurant.state}`);
        console.log(`     New: ${correction.city}, ${correction.state}, ${correction.country}`);

        const { error: updateError } = await supabase
          .from('restaurants')
          .update({
            city: correction.city,
            state: correction.state,
            country: correction.country
          })
          .eq('id', restaurant.id);

        if (updateError) {
          console.error(`   ❌ Error updating: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated successfully\n`);
          specialCaseCount++;
        }
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Standard conversions: ${fixed}`);
  console.log(`   Special cases: ${specialCaseCount}`);
  console.log(`   Total fixed: ${fixed + specialCaseCount}`);
}

main();
