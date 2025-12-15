import { Metadata } from 'next';
import Link from 'next/link';
import { getCachedRestaurantsByStatus } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  // Use cached + filtered query instead of fetching ALL restaurants
  const closedRestaurants = await getCachedRestaurantsByStatus('closed');

  const title = `${closedRestaurants.length} Closed Diners, Drive-ins and Dives Restaurants | Guy Fieri`;
  const description = `Discover which restaurants from Guy Fieri's Diners, Drive-ins and Dives have closed. ${closedRestaurants.length} locations that are no longer open, with closure dates when known.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/closed',
    },
    openGraph: {
      title: `${closedRestaurants.length} Closed Diners, Drive-ins and Dives Restaurants`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Closed Diners, Drive-ins and Dives Restaurants`,
      description,
    },
  };
}

export default async function ClosedPage() {
  // Use cached + filtered query (same call as metadata, deduplicated by React cache)
  const closedRestaurants = await getCachedRestaurantsByStatus('closed');

  // Group by state
  const restaurantsByState = closedRestaurants.reduce((acc, restaurant) => {
    const state = restaurant.state || 'Unknown';
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(restaurant);
    return acc;
  }, {} as Record<string, typeof closedRestaurants>);

  // Sort states by restaurant count
  const sortedStates = Object.entries(restaurantsByState)
    .sort(([, a], [, b]) => b.length - a.length);

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Closed Restaurants"
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: closedRestaurants.length, label: 'CLOSED' },
            { value: sortedStates.length, label: 'STATES' }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8 p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}>
            <p className="font-ui text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
              These restaurants from Guy Fieri's Diners, Drive-ins and Dives are no longer open.
              Closure dates are shown when known. Many left lasting legacies in their communities.
            </p>
            <Link
              href="/still-open"
              className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-4 py-2"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              VIEW RESTAURANTS STILL OPEN →
            </Link>
          </div>

          <div className="space-y-12">
            {sortedStates.map(([state, restaurants]) => (
              <section key={state}>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {state}
                  </h2>
                  <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                    {restaurants.length} CLOSED
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {restaurants
                    .sort((a, b) => {
                      // Sort by closed_date if available, otherwise by name
                      if (a.closed_date && b.closed_date) {
                        return new Date(b.closed_date).getTime() - new Date(a.closed_date).getTime();
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((restaurant) => (
                      <Link
                        key={restaurant.id}
                        href={`/restaurant/${restaurant.slug}`}
                        className="p-6 rounded-lg block opacity-70 hover:opacity-100 transition-opacity"
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-ui text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {restaurant.name}
                          </h3>
                          <span
                            className="px-2 py-1 rounded text-sm font-semibold flex-shrink-0 ml-2"
                            style={{ background: 'var(--text-muted)', color: 'white' }}
                          >
                            CLOSED
                          </span>
                        </div>
                        <p className="font-ui text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                          {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}
                        </p>
                        {restaurant.closed_date && (
                          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                            Closed: {new Date(restaurant.closed_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: restaurant.closed_date.length > 7 ? 'numeric' : undefined
                            })}
                          </p>
                        )}
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
