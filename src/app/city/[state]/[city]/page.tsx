import { db, Restaurant } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/lib/schema';

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
}

export default async function CityPage({ params }: CityPageProps) {
  const { state: stateSlug, city: citySlug } = await params;

  // Fetch state first to get state name
  const state = await db.getState(stateSlug);

  if (!state) {
    notFound();
  }

  // Fetch city using state name and city slug
  const city = await db.getCity(state.name, citySlug);

  if (!city) {
    notFound();
  }

  // Fetch restaurants using city name and state abbreviation
  let restaurants: Restaurant[];
  try {
    restaurants = await db.getRestaurantsByCity(city.name, state.abbreviation);
  } catch (error) {
    console.error('Error fetching restaurants for city:', error);
    restaurants = [];
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');
  const closedRestaurants = restaurants.filter(r => r.status === 'closed');

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: state.name, url: `/state/${stateSlug}` },
    { name: city.name },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `DDD Restaurants in ${city.name}, ${state.abbreviation}`,
    `/city/${stateSlug}/${citySlug}`
  );

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="states" />

        <PageHero
          title={`${city.name}, ${city.state_name}`}
          subtitle="DDD Restaurants"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'States', href: '/states' },
            { label: state.name, href: `/state/${stateSlug}` },
            { label: city.name }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">

        {/* Restaurants List */}
        {restaurants.length === 0 ? (
          <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
              No restaurants found in {city.name} yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {openRestaurants.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Open Now ({openRestaurants.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {openRestaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/restaurant/${restaurant.slug}`}
                      className="p-6 rounded-lg block hover:shadow-lg transition-shadow"
                      style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-ui text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {restaurant.name}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'var(--accent-success)', color: 'white' }}>
                          Open
                        </span>
                      </div>
                      <p className="font-ui text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {restaurant.neighborhood || restaurant.city}
                      </p>
                      {restaurant.price_tier && (
                        <span className="font-mono text-sm mr-2" style={{ color: 'var(--text-muted)' }}>
                          {restaurant.price_tier}
                        </span>
                      )}
                      {restaurant.google_rating && (
                        <span className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                          ⭐ {restaurant.google_rating}/5
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {closedRestaurants.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Closed ({closedRestaurants.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4 opacity-60">
                  {closedRestaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/restaurant/${restaurant.slug}`}
                      className="p-6 rounded-lg block"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-ui text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {restaurant.name}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'var(--text-muted)', color: 'white' }}>
                          Closed
                        </span>
                      </div>
                      <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {restaurant.neighborhood || restaurant.city}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        </main>
      </div>
      <Footer />
    </>
  );
}
