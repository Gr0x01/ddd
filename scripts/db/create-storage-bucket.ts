#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createBucket() {
  console.log('📦 Creating restaurant-photos storage bucket...\n');

  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === 'restaurant-photos');

  if (exists) {
    console.log('✅ Bucket already exists');
    return;
  }

  // Create bucket
  const { data, error } = await supabase.storage.createBucket('restaurant-photos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  });

  if (error) {
    console.error('❌ Failed to create bucket:', error);
    process.exit(1);
  }

  console.log('✅ Bucket created:', data);

  // Note: RLS policies are automatically set up for public buckets
  // Public buckets allow anyone to read, and service role can write
}

createBucket().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
