import { Metadata } from 'next';
import Link from 'next/link';
import { getCachedRestaurantsByStatus } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateItemListSchema, safeStringifySchema } from '@/lib/schema';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  // Use cached + filtered query instead of fetching ALL restaurants
  const openRestaurants = await getCachedRestaurantsByStatus('open');

  const title = `${openRestaurants.length} Diners, Drive-ins and Dives Restaurants Still Open | Guy Fieri`;
  const description = `Find ${openRestaurants.length} restaurants from Guy Fieri's Diners, Drive-ins and Dives that are still open and serving. Verified locations with photos, ratings, and directions.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/still-open',
    },
    openGraph: {
      title: `${openRestaurants.length} Diners, Drive-ins and Dives Restaurants Still Open`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${openRestaurants.length} Diners, Drive-ins and Dives Still Open`,
      description,
    },
  };
}

export default async function StillOpenPage() {
  // Use cached + filtered query (same call as metadata, deduplicated by React cache)
  const openRestaurants = await getCachedRestaurantsByStatus('open');

  // Group by state for better organization
  const restaurantsByState = openRestaurants.reduce((acc, restaurant) => {
    const state = restaurant.state || 'Unknown';
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(restaurant);
    return acc;
  }, {} as Record<string, typeof openRestaurants>);

  // Sort states by restaurant count
  const sortedStates = Object.entries(restaurantsByState)
    .sort(([, a], [, b]) => b.length - a.length);

  // Generate structured data for SEO
  const itemListSchema = generateItemListSchema(
    openRestaurants,
    'Diners, Drive-ins and Dives Restaurants Still Open',
    '/still-open'
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(itemListSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Restaurants Still Open"
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: openRestaurants.length, label: 'VERIFIED OPEN' },
            { value: sortedStates.length, label: 'STATES' }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              These restaurants from Guy Fieri's Diners, Drive-ins and Dives have been verified as still open and serving.
              Last verified dates and current status shown for each location.
            </p>
          </div>

          <div className="space-y-12">
            {sortedStates.map(([state, restaurants]) => (
              <section key={state}>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {state}
                  </h2>
                  <Link
                    href={`/state/${state.toLowerCase().replace(/\s+/g, '-')}`}
                    className="font-mono text-sm hover:underline"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    VIEW ALL IN {state.toUpperCase()} →
                  </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {restaurants
                    .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
                    .map((restaurant) => (
                      <RestaurantCardCompact key={restaurant.id} restaurant={restaurant} />
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
