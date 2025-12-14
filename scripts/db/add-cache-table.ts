#!/usr/bin/env tsx

/**
 * Add Cache Table to Database
 *
 * Adds the cache table for storing external API responses (Wikipedia, Google Places, etc.)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function addCacheTable() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🗄️  Adding Cache Table');
  console.log('=======================\n');

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '002_add_cache_table.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Connect to database
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database\n');

    console.log('🚀 Creating cache table...');
    await client.query(migrationSQL);

    console.log('✅ Cache table created successfully!\n');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'cache'
      ORDER BY ordinal_position
    `);

    console.log(`📊 Cache table columns (${result.rows.length}):`);
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✨ Ready to cache Wikipedia data!');
    console.log('Run: npx tsx scripts/ingestion/cache-wikipedia.ts\n');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n❌ ERROR:', errorMessage);

    if (errorMessage.includes('already exists')) {
      console.log('\n✓ Cache table already exists - you\'re all set!\n');
    } else {
      process.exit(1);
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

addCacheTable().catch(console.error);
