#!/usr/bin/env tsx
/**
 * Populate Curated Routes Script
 *
 * This script populates the 6 popular routes from the homepage into the database
 * with proper metadata for SEO-optimized route pages.
 *
 * Usage:
 *   npm run populate-routes           # Populate all routes
 *   npm run populate-routes -- --slug=la-to-las-vegas  # Populate specific route
 *   npm run populate-routes -- --dry-run  # Test without making changes
 */

// Load environment variables FIRST before any ES module imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface PopularRoute {
  slug: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  restaurants: number;
  highlight: string;
  description: string;
  color: 'red' | 'yellow' | 'cream';
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    slug: 'sf-to-la',
    from: 'San Francisco, CA',
    to: 'Los Angeles, CA',
    fromCoords: { lat: 37.7749, lng: -122.4194 },
    toCoords: { lat: 34.0522, lng: -118.2437 },
    restaurants: 42,
    highlight: 'Pacific Coast classics',
    description: 'Cruise down the iconic Pacific Coast Highway from San Francisco to Los Angeles. This legendary California road trip features over 40 Diners, Drive-ins & Dives restaurants, from Bay Area burger joints to LA\'s taco stands and everything in between.',
    color: 'red',
  },
  {
    slug: 'nyc-to-boston',
    from: 'New York, NY',
    to: 'Boston, MA',
    fromCoords: { lat: 40.7128, lng: -74.0060 },
    toCoords: { lat: 42.3601, lng: -71.0589 },
    restaurants: 28,
    highlight: 'Northeast food tour',
    description: 'Journey through the Northeast corridor from New York City to Boston. Experience nearly 30 Guy Fieri-approved restaurants serving everything from New Haven pizza to Connecticut diners to Boston\'s seafood shacks and Italian joints.',
    color: 'yellow',
  },
  {
    slug: 'chicago-to-indianapolis',
    from: 'Chicago, IL',
    to: 'Indianapolis, IN',
    fromCoords: { lat: 41.8781, lng: -87.6298 },
    toCoords: { lat: 39.7684, lng: -86.1581 },
    restaurants: 15,
    highlight: 'Midwest comfort food',
    description: 'The heartland food tour from Chicago to Indianapolis. This Midwest road trip connects 15 Diners, Drive-ins & Dives restaurants featuring Chicago deep-dish pizza, legendary Italian beef sandwiches, and Indiana comfort food classics.',
    color: 'cream',
  },
  {
    slug: 'austin-to-san-antonio',
    from: 'Austin, TX',
    to: 'San Antonio, TX',
    fromCoords: { lat: 30.2672, lng: -97.7431 },
    toCoords: { lat: 29.4241, lng: -98.4936 },
    restaurants: 12,
    highlight: 'Texas BBQ heaven',
    description: 'The ultimate Texas BBQ and Tex-Mex pilgrimage from Austin to San Antonio. This route connects a dozen legendary Diners, Drive-ins & Dives restaurants serving award-winning brisket, breakfast tacos, and authentic Mexican cuisine.',
    color: 'red',
  },
  {
    slug: 'nashville-to-cincinnati',
    from: 'Nashville, TN',
    to: 'Cincinnati, OH',
    fromCoords: { lat: 36.1627, lng: -86.7816 },
    toCoords: { lat: 39.1031, lng: -84.5120 },
    restaurants: 18,
    highlight: 'Southern soul to Midwest',
    description: 'From Music City to the Queen City, this route serves up 18 Diners, Drive-ins & Dives restaurants. Experience Nashville hot chicken and Southern BBQ, then roll into Cincinnati for legendary chili parlors and German-inspired comfort food.',
    color: 'yellow',
  },
  {
    slug: 'la-to-las-vegas',
    from: 'Los Angeles, CA',
    to: 'Las Vegas, NV',
    fromCoords: { lat: 34.0522, lng: -118.2437 },
    toCoords: { lat: 36.1699, lng: -115.1398 },
    restaurants: 19,
    highlight: 'Desert road trip classics',
    description: 'The ultimate desert road trip from Los Angeles to Las Vegas. Hit 19 Diners, Drive-ins & Dives restaurants along this iconic Route 66-adjacent corridor, from LA taco trucks and burger joints to Vegas steakhouses and off-Strip gems.',
    color: 'cream',
  },
];

async function populateRoute(route: PopularRoute, dryRun: boolean, db: any, getDirections: any, supabase: any) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📍 ${route.from} → ${route.to}`);
  console.log(`   Slug: ${route.slug}`);
  console.log(`${'='.repeat(60)}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Check if route already exists
    console.log('1️⃣  Checking if route already exists...');
    const existing = await db.getRouteBySlug(route.slug);

    if (existing) {
      console.log(`   ✅ Route already exists (ID: ${existing.id})`);
      console.log(`   📊 Current stats:`);
      console.log(`      - View count: ${existing.view_count || 0}`);
      console.log(`      - Is curated: ${existing.is_curated || false}`);
      console.log(`      - Has map image: ${existing.map_image_url ? 'Yes' : 'No'}`);

      if (!dryRun && !existing.is_curated) {
        console.log('\n   🔄 Updating metadata for existing route...');
        await updateRouteMetadata(existing.id, route, supabase);
        console.log('   ✅ Metadata updated');
      }

      return existing.id;
    }

    console.log('   📝 Route not found, will create new one\n');

    // Step 2: Get route from Google Directions API
    console.log('2️⃣  Fetching route from Google Directions API...');
    if (dryRun) {
      console.log('   ⏭️  Skipped (dry run)');
      return null;
    }

    const directionsResponse = await getDirections({
      origin: route.from,
      destination: route.to,
    });

    console.log('   ✅ Route fetched from Google');
    console.log(`   📏 Distance: ${Math.round(directionsResponse.distanceMeters / 1609.34)} miles`);
    console.log(`   ⏱️  Duration: ${Math.round(directionsResponse.durationSeconds / 3600 * 10) / 10} hours\n`);

    // Step 3: Save route to cache
    console.log('3️⃣  Saving route to database...');
    const routeId = await db.saveRoute(route.from, route.to, directionsResponse);
    console.log(`   ✅ Route saved (ID: ${routeId})\n`);

    // Step 4: Update route with curated metadata
    console.log('4️⃣  Adding curated route metadata...');
    await updateRouteMetadata(routeId, route, supabase);
    console.log('   ✅ Metadata added\n');

    // Step 5: Get restaurant count (for verification)
    console.log('5️⃣  Checking restaurant count...');
    const restaurants = await db.getRestaurantsNearRoute(routeId, 10);
    console.log(`   ✅ Found ${restaurants.length} restaurants within 10 miles\n`);

    if (restaurants.length === 0) {
      console.warn('   ⚠️  WARNING: No restaurants found! Route may need adjustment.');
    } else if (Math.abs(restaurants.length - route.restaurants) > 5) {
      console.warn(`   ⚠️  WARNING: Expected ~${route.restaurants} restaurants, found ${restaurants.length}`);
    }

    console.log(`✅ Successfully populated route: ${route.slug}\n`);
    return routeId;

  } catch (error) {
    console.error(`\n❌ Error populating route ${route.slug}:`, error);
    throw error;
  }
}

async function updateRouteMetadata(routeId: string, route: PopularRoute, supabase: any) {
  const client = supabase();

  const title = `${route.from.split(',')[0]} to ${route.to.split(',')[0]}`;

  const { error } = await client
    .from('route_cache')
    .update({
      slug: route.slug,
      is_curated: true,
      title,
      description: route.description,
      // map_image_url will be populated by separate script
    })
    .eq('id', routeId);

  if (error) {
    throw new Error(`Failed to update route metadata: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const slugFilter = args.find(arg => arg.startsWith('--slug='))?.split('=')[1];

  console.log('🚗 Curated Routes Population Script');
  console.log('=====================================\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const routesToPopulate = slugFilter
    ? POPULAR_ROUTES.filter(r => r.slug === slugFilter)
    : POPULAR_ROUTES;

  if (routesToPopulate.length === 0) {
    console.error(`❌ No routes found matching slug: ${slugFilter}`);
    process.exit(1);
  }

  console.log(`📋 Will process ${routesToPopulate.length} route(s):\n`);
  routesToPopulate.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.slug} (${r.from} → ${r.to})`);
  });
  console.log('');

  // Dynamic imports AFTER dotenv has loaded
  const { db } = await import('../src/lib/supabase');
  const { getDirections } = await import('../src/lib/server/google-directions');
  const { supabase } = await import('../src/lib/supabase');

  let successCount = 0;
  let errorCount = 0;

  for (const route of routesToPopulate) {
    try {
      await populateRoute(route, dryRun, db, getDirections, supabase);
      successCount++;

      // Rate limit: wait 1 second between routes to avoid hitting Google API limits
      if (routesToPopulate.length > 1 && !dryRun) {
        console.log('⏳ Waiting 1 second before next route...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      errorCount++;
      console.error(`Failed to populate ${route.slug}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${routesToPopulate.length}\n`);

  if (dryRun) {
    console.log('ℹ️  This was a dry run. Run without --dry-run to make changes.\n');
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
