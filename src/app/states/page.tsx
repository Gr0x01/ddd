import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { db } from '@/lib/supabase';
import Link from 'next/link';

export const metadata = {
  title: 'Browse Restaurants by State | Triple D Map',
  description: 'Explore Diners, Drive-ins and Dives restaurants across all US states. Find Guy Fieri-featured locations near you.',
};

export const revalidate = 3600; // Revalidate every hour

export default async function StatesPage() {
  // Fetch all restaurants to count by state
  const allRestaurants = await db.getRestaurants();
  const totalRestaurants = allRestaurants.length;

  // Count restaurants by state abbreviation
  const restaurantCountByState: Record<string, number> = {};
  allRestaurants.forEach((restaurant) => {
    const state = restaurant.state || '';
    restaurantCountByState[state] = (restaurantCountByState[state] || 0) + 1;
  });

  // Get unique states from restaurants and create state list
  const uniqueStateAbbreviations = Object.keys(restaurantCountByState);

  // Fetch state details for states that have restaurants
  const statesWithRestaurants = await Promise.all(
    uniqueStateAbbreviations
      .filter(abbr => abbr) // Filter out empty strings
      .map(async (abbr) => {
        try {
          const stateSlug = abbr.toLowerCase();
          const state = await db.getState(stateSlug);
          return {
            ...state,
            restaurantCount: restaurantCountByState[abbr]
          };
        } catch {
          // If state not found in states table, create minimal object
          return {
            id: abbr,
            name: abbr,
            abbreviation: abbr,
            slug: abbr.toLowerCase(),
            restaurantCount: restaurantCountByState[abbr]
          };
        }
      })
  );

  // Sort by name
  statesWithRestaurants.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="states" />
        <PageHero
          title="Browse by State"
          subtitle="Explore DDD restaurants across the United States"
          stats={[
            { value: statesWithRestaurants.length, label: 'STATES' },
            { value: totalRestaurants || 0, label: 'RESTAURANTS' }
          ]}
          breadcrumbItems={[{ label: 'States' }]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statesWithRestaurants.map((state) => (
              <Link
                key={state.id}
                href={`/state/${state.slug}`}
                className="block p-6 rounded-lg border transition-all hover:shadow-md"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {state.name}
                  </h2>
                  <span
                    className="font-mono text-xs font-semibold px-2 py-1 rounded"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    {state.abbreviation}
                  </span>
                </div>
                <p className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                  {state.restaurantCount} {state.restaurantCount === 1 ? 'restaurant' : 'restaurants'}
                </p>
              </Link>
            ))}
          </div>

          {statesWithRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="font-ui text-lg" style={{ color: 'var(--text-muted)' }}>
                No states with restaurants found.
              </p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
