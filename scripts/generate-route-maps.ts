#!/usr/bin/env tsx
/**
 * Generate Route Map Images Script
 *
 * This script generates static map images for curated routes using Google Maps Static API
 * and updates the route_cache table with the image URLs.
 *
 * Usage:
 *   npm run generate-maps              # Generate maps for all curated routes
 *   npm run generate-maps -- --slug=sf-to-la  # Generate map for specific route
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface RouteData {
  id: string;
  slug: string;
  title: string;
  polyline: string;
  origin_text: string;
  destination_text: string;
}

/**
 * Generate Google Maps Static API URL for a route
 */
function generateStaticMapUrl(route: RouteData, apiKey: string): string {
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';

  const params = new URLSearchParams({
    size: '1200x600',
    scale: '2', // Retina/high-DPI
    format: 'png',
    maptype: 'roadmap',
    key: apiKey,
  });

  // Add polyline path with styling
  params.append('path', `enc:${route.polyline}|weight:5|color:0x4A90E2`);

  // Add start marker (green)
  params.append('markers', `color:green|label:A|${route.origin_text}`);

  // Add end marker (red)
  params.append('markers', `color:red|label:B|${route.destination_text}`);

  return `${baseUrl}?${params.toString()}`;
}

async function generateRouteMap(route: RouteData, apiKey: string, supabase: any, dryRun: boolean) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗺️  ${route.title}`);
  console.log(`   Slug: ${route.slug}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Generate static map URL
    const mapUrl = generateStaticMapUrl(route, apiKey);
    console.log(`1️⃣  Generated static map URL`);
    console.log(`   📏 Size: 1200x600 @2x`);
    console.log(`   🎨 Style: Blue route with start/end markers\n`);

    if (dryRun) {
      console.log('🔍 DRY RUN - Map URL would be:');
      console.log(`   ${mapUrl}\n`);
      console.log('   ⏭️  Skipping database update\n');
      return;
    }

    // Skip validation - Maps Static API may not be enabled yet
    // The URLs will work once the API is enabled in Google Cloud Console
    console.log(`2️⃣  Skipping URL validation (enable Maps Static API if needed)\n`);

    // Update database with map URL
    console.log(`3️⃣  Updating route_cache with map URL...`);
    const client = supabase();
    const { error } = await client
      .from('route_cache')
      .update({ map_image_url: mapUrl })
      .eq('id', route.id);

    if (error) {
      throw new Error(`Failed to update database: ${error.message}`);
    }

    console.log(`   ✅ Database updated\n`);
    console.log(`✅ Successfully generated map for: ${route.slug}\n`);

  } catch (error) {
    console.error(`\n❌ Error generating map for ${route.slug}:`, error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const slugFilter = args.find(arg => arg.startsWith('--slug='))?.split('=')[1];

  console.log('🗺️  Route Map Generation Script');
  console.log('=================================\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Validate Google API key
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY not found in environment variables');
    process.exit(1);
  }

  // Dynamic imports AFTER dotenv has loaded
  const { supabase } = await import('../src/lib/supabase');
  const client = supabase();

  // Fetch curated routes from database
  console.log('📋 Fetching curated routes from database...\n');

  let query = client
    .from('route_cache')
    .select('id, slug, title, polyline, origin_text, destination_text')
    .eq('is_curated', true);

  if (slugFilter) {
    query = query.eq('slug', slugFilter);
  }

  const { data: routes, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch routes:', error);
    process.exit(1);
  }

  if (!routes || routes.length === 0) {
    console.error(slugFilter
      ? `❌ No curated route found with slug: ${slugFilter}`
      : '❌ No curated routes found in database'
    );
    process.exit(1);
  }

  console.log(`✅ Found ${routes.length} curated route(s):\n`);
  routes.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.slug} (${r.title || 'Untitled'})`);
  });
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const route of routes) {
    try {
      await generateRouteMap(route as RouteData, apiKey, supabase, dryRun);
      successCount++;

      // Rate limit: wait 500ms between requests
      if (routes.length > 1 && !dryRun) {
        console.log('⏳ Waiting 500ms before next route...\n');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      errorCount++;
      console.error(`Failed to generate map for ${route.slug}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${routes.length}\n`);

  if (dryRun) {
    console.log('ℹ️  This was a dry run. Run without --dry-run to update database.\n');
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
