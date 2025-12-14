#!/usr/bin/env tsx

/**
 * Apply Database Migration Script
 *
 * This script applies the initial database migration to your Supabase project.
 *
 * Usage:
 *   npx tsx scripts/db/apply-migration.ts
 *
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   - DATABASE_URL must be set in .env.local
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function applyMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    console.error('Make sure .env.local has DATABASE_URL set');
    console.error('');
    console.error('⚠️  IMPORTANT: Use the direct connection string, NOT the pooler connection');
    console.error('   The direct connection string has service role privileges needed for migrations');
    console.error('   Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres');
    process.exit(1);
  }

  // Validate connection string format
  if (!DATABASE_URL.includes('postgresql://') && !DATABASE_URL.includes('postgres://')) {
    console.error('❌ ERROR: DATABASE_URL does not appear to be a valid PostgreSQL connection string');
    console.error('Expected format: postgresql://...');
    process.exit(1);
  }

  console.log('🗄️  DDD Database Migration Tool');
  console.log('================================\n');

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
  console.log(`📖 Reading migration file: ${migrationPath}`);

  let migrationSQL: string;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);
  } catch (error) {
    console.error('❌ ERROR: Could not read migration file:', error);
    process.exit(1);
  }

  // Connect to database
  console.log('🔌 Connecting to database...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Apply migration
    console.log('🚀 Applying migration...');
    console.log('This will:');
    console.log('  - Enable PostGIS extension');
    console.log('  - Create all tables (restaurants, episodes, cuisines, etc.)');
    console.log('  - Create indexes and triggers');
    console.log('  - Seed states and cuisines');
    console.log('  - Set up RLS policies\n');

    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify tables created
    console.log('🔍 Verifying tables...');

    interface TableRow {
      table_name: string;
    }

    interface CountRow {
      count: string;
    }

    const result = await client.query<TableRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n📊 Created ${result.rows.length} tables:`);
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check data
    console.log('\n🔍 Checking seeded data...');
    const [statesCount, cuisinesCount] = await Promise.all([
      client.query<CountRow>('SELECT COUNT(*) FROM states'),
      client.query<CountRow>('SELECT COUNT(*) FROM cuisines')
    ]);

    console.log(`   - States: ${statesCount.rows[0].count}`);
    console.log(`   - Cuisines: ${cuisinesCount.rows[0].count}`);

    console.log('\n✨ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Start adding restaurant data!\n');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n❌ ERROR applying migration:', errorMessage);

    if (errorMessage.includes('already exists')) {
      console.log('\n⚠️  It looks like some tables already exist.');
      console.log('This might mean the migration was already applied.');
      console.log('To start fresh, you can:');
      console.log('   1. Drop all tables in Supabase Dashboard > SQL Editor');
      console.log('   2. Run this script again\n');
    }

    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run migration
applyMigration().catch(console.error);
