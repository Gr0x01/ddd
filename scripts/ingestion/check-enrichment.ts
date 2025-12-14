#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get enriched restaurant with cuisines
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      city,
      state,
      description,
      price_tier,
      guy_quote,
      enrichment_status,
      restaurant_cuisines (
        cuisines (
          name
        )
      )
    `)
    .eq('enrichment_status', 'completed')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('\n✅ Enriched Restaurant:\n');
  console.log('Name:', restaurant.name);
  console.log('Location:', `${restaurant.city}, ${restaurant.state}`);
  console.log('Price:', restaurant.price_tier);
  console.log('Cuisines:', restaurant.restaurant_cuisines.map((rc: any) => rc.cuisines.name).join(', '));
  console.log('\nDescription:');
  console.log(restaurant.description);
  if (restaurant.guy_quote) {
    console.log('\nGuy Quote:');
    console.log(`"${restaurant.guy_quote}"`);
  }
  console.log('');
}

main();
