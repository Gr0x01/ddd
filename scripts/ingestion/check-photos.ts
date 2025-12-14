#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase
    .from('restaurants')
    .select('name, photos, google_place_id, google_rating, google_review_count')
    .ilike('name', '%Brint%')
    .single();

  console.log('\n📍', data.name);
  console.log('Photos:', data.photos?.length || 0, 'URLs');
  console.log('Google Place ID:', data.google_place_id || '(not set)');
  console.log('Google Rating:', data.google_rating || '(not set)');
  console.log('Google Reviews:', data.google_review_count || '(not set)');

  if (data.photos && data.photos.length > 0) {
    console.log('\n📸 Photo URLs:');
    data.photos.forEach((url: string, i: number) => {
      console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
    });
  }
}

check().catch(console.error);
