import { db } from '@/lib/supabase';

async function verifyGSCURLs() {
  console.log('🔍 Verifying URLs reported by Google Search Console...\n');

  // 1. Check state slug patterns
  console.log('1️⃣ Checking state slugs...');
  const states = await db.getStates();
  console.table(states.map(s => ({
    name: s.name,
    slug: s.slug,
    abbr: s.abbreviation
  })));

  // 2. Check problematic cities from GSC
  console.log('\n2️⃣ Checking problematic cities...');
  const problemCities = [
    'colorado-springs', 'norwalk', 'fort-lauderdale',
    'jackson', 'mooresville', 'leucadia'
  ];

  const cities = await db.getCities();
  for (const slug of problemCities) {
    const found = cities.find(c => c.slug === slug);
    if (found) {
      console.log(`✅ ${slug}: Found in ${found.state_name}`);
    } else {
      console.log(`❌ ${slug}: NOT FOUND in database`);
    }
  }

  // 3. Check restaurant slug
  console.log('\n3️⃣ Checking restaurant "louie-muellers-barbecue"...');
  const restaurants = await db.getRestaurants();
  const mueller = restaurants.find(r => r.slug === 'louie-muellers-barbecue');
  if (mueller) {
    console.log(`✅ Found: ${mueller.name} in ${mueller.city}, ${mueller.state}`);
  } else {
    console.log(`❌ NOT FOUND. Searching for similar names...`);
    const similar = restaurants.filter(r =>
      r.name.toLowerCase().includes('mueller') ||
      r.name.toLowerCase().includes('louie')
    );
    console.table(similar.map(r => ({
      name: r.name,
      slug: r.slug,
      city: r.city
    })));
  }

  // 4. Count total pages for build timeout assessment
  console.log('\n4️⃣ Counting total pages to pre-render...');
  const [episodeCount, cuisineCount] = await Promise.all([
    db.getEpisodes().then(e => e.length),
    db.getCuisinesWithCounts().then(c => c.length),
  ]);

  // Check if getDishes exists in db object
  let dishCount = 0;
  try {
    if ('getDishes' in db && typeof db.getDishes === 'function') {
      dishCount = await (db.getDishes as any)().then((d: any[]) => d.length);
    } else {
      // Fallback: count from database directly
      const { getSupabaseClient } = await import('@/lib/supabase');
      const client = getSupabaseClient();
      const { count, error } = await client
        .from('dishes')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) {
        dishCount = count;
      }
    }
  } catch (error) {
    console.warn('Could not count dishes, using 0:', error);
  }

  const totalPages = restaurants.length + episodeCount + dishCount + cuisineCount + 23; // +23 for routes and dish categories

  console.log(`
📊 Total Static Pages to Generate:
  - Restaurants: ${restaurants.length}
  - Episodes: ${episodeCount}
  - Dishes: ${dishCount}
  - Cuisines: ${cuisineCount}
  - Routes + Categories: 23
  ---
  TOTAL: ${totalPages} pages

⏱️ Build Time Estimate: ${Math.ceil(totalPages / 100)} minutes (at ~100 pages/min)
⚠️ Current timeout: 60 seconds - may need increase or ISR strategy
  `);
}

verifyGSCURLs().catch(console.error);
