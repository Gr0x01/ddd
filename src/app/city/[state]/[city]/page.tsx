import { db, Restaurant } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
}

export default async function CityPage({ params }: CityPageProps) {
  const { state: stateSlug, city: citySlug } = await params;

  // Fetch city first to get proper city and state names
  const city = await db.getCity(citySlug, stateSlug);

  if (!city) {
    notFound();
  }

  // Fetch restaurants using actual city and state names from database
  let restaurants: Restaurant[];
  try {
    restaurants = await db.getRestaurantsByCity(city.name, city.state_name);
  } catch (error) {
    console.error('Error fetching restaurants for city:', error);
    restaurants = [];
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');
  const closedRestaurants = restaurants.filter(r => r.status === 'closed');

  return (
    <main className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/" className="font-ui" style={{ color: 'var(--text-muted)' }}>
            Home
          </Link>
          <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
          <Link href={`/state/${stateSlug}`} className="font-ui" style={{ color: 'var(--text-muted)' }}>
            {city.state_name}
          </Link>
          <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="font-ui" style={{ color: 'var(--text-primary)' }}>{city.name}</span>
        </nav>

        {/* City Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            DDD Restaurants in {city.name}, {city.state_name}
          </h1>
          <div className="flex gap-6">
            <div className="font-ui">
              <span className="font-bold text-2xl" style={{ color: 'var(--accent-primary)' }}>{restaurants.length}</span>
              <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Total Restaurants</span>
            </div>
            <div className="font-ui">
              <span className="font-bold text-2xl" style={{ color: 'var(--accent-success)' }}>{openRestaurants.length}</span>
              <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Currently Open</span>
            </div>
          </div>
        </div>

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
      </div>
    </main>
  );
}
