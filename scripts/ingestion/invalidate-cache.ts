#!/usr/bin/env tsx
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const name = process.argv[2];

  if (!name) {
    console.log('Usage: npx tsx invalidate-cache.ts "Restaurant Name"');
    process.exit(1);
  }

  const { data, error } = await supabase
    .from('cache')
    .delete()
    .ilike('entity_name', `%${name}%`)
    .select('id, entity_name, query');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`✅ Invalidated ${data.length} cache entries for "${name}"`);
  data.forEach(row => {
    console.log(`   - ${row.entity_name}: ${row.query.substring(0, 60)}...`);
  });
}

main().catch(console.error);
