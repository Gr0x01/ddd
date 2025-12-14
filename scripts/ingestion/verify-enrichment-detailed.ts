#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, description, price_tier, guy_quote, address, phone, website_url, enrichment_status')
    .limit(3);

  for (const r of restaurants || []) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 ${r.name}`);
    console.log(`Status: ${r.enrichment_status}`);
    console.log(`Price: ${r.price_tier || '(not set)'}`);
    console.log(`Description: ${r.description ? r.description.substring(0, 120) + '...' : '(not set)'}`);
    console.log(`Quote: ${r.guy_quote ? r.guy_quote.substring(0, 80) + '...' : '(not set)'}`);
    console.log(`Contact: Address=${r.address ? 'Yes' : 'No'} | Phone=${r.phone ? 'Yes' : 'No'} | Website=${r.website_url ? 'Yes' : 'No'}`);

    const { data: dishes } = await supabase
      .from('dishes')
      .select('name, guy_reaction, is_signature_dish')
      .eq('restaurant_id', r.id);

    console.log(`Dishes: ${dishes?.length || 0}`);
    if (dishes && dishes.length > 0) {
      dishes.forEach(d => console.log(`  • ${d.name}${d.is_signature_dish ? ' ⭐' : ''}`));
    }

    const { data: notes } = await supabase
      .from('restaurant_episodes')
      .select('segment_notes')
      .eq('restaurant_id', r.id)
      .limit(1)
      .single();

    if (notes?.segment_notes) {
      console.log(`Segment Notes: ${notes.segment_notes.substring(0, 80)}...`);
    }
  }
}

verify().catch(console.error);
