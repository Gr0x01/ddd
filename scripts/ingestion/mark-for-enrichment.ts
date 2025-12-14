#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const name = process.argv[2] || 'Brint';

  // Find restaurant and mark it for re-enrichment
  const { data } = await supabase
    .from('restaurants')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .single();

  if (data) {
    await supabase
      .from('restaurants')
      .update({ enrichment_status: 'pending' })
      .eq('id', data.id);
    console.log('✅ Marked for re-enrichment:', data.name);
  } else {
    console.log('❌ Restaurant not found');
  }
}

main().catch(console.error);
