import { db, Restaurant, City } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export default async function StatePage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;

  // Fetch state first to get proper state abbreviation
  const state = await db.getState(stateSlug);

  if (!state) {
    notFound();
  }

  // Fetch cities and restaurants using state abbreviation
  let cities: City[];
  let restaurants: Restaurant[];
  try {
    [cities, restaurants] = await Promise.all([
      db.getCitiesByState(stateSlug),
      db.getRestaurantsByState(state.abbreviation)
    ]);
  } catch (error) {
    console.error('Error fetching state data:', error);
    cities = [];
    restaurants = [];
  }

  // Group restaurants by city
  const restaurantsByCity = restaurants.reduce((acc, restaurant) => {
    const city = restaurant.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(restaurant);
    return acc;
  }, {} as Record<string, typeof restaurants>);

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  return (
    <main className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/" className="font-ui" style={{ color: 'var(--text-muted)' }}>
            Home
          </Link>
          <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="font-ui" style={{ color: 'var(--text-primary)' }}>{state.name}</span>
        </nav>

        {/* State Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            DDD Restaurants in {state.name}
          </h1>
          <div className="flex gap-6 flex-wrap">
            <div className="font-ui">
              <span className="font-bold text-2xl" style={{ color: 'var(--accent-primary)' }}>{restaurants.length}</span>
              <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Total Restaurants</span>
            </div>
            <div className="font-ui">
              <span className="font-bold text-2xl" style={{ color: 'var(--accent-success)' }}>{openRestaurants.length}</span>
              <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Currently Open</span>
            </div>
            <div className="font-ui">
              <span className="font-bold text-2xl" style={{ color: 'var(--accent-primary)' }}>{cities.length}</span>
              <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Cities</span>
            </div>
          </div>
        </div>

        {/* Cities List */}
        {cities.length === 0 ? (
          <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
              No restaurants found in {state.name} yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Cities with DDD Restaurants
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {cities
                  .filter(city => city.restaurant_count > 0)
                  .sort((a, b) => b.restaurant_count - a.restaurant_count)
                  .map((city) => (
                    <Link
                      key={city.id}
                      href={`/city/${stateSlug}/${city.slug}`}
                      className="p-6 rounded-lg block hover:shadow-lg transition-shadow"
                      style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <h3 className="font-ui text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {city.name}
                      </h3>
                      <p className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                        {city.restaurant_count} {city.restaurant_count === 1 ? 'restaurant' : 'restaurants'}
                      </p>
                    </Link>
                  ))}
              </div>
            </section>

            {/* All Restaurants by City */}
            <section>
              <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                All Restaurants
              </h2>
              <div className="space-y-6">
                {Object.entries(restaurantsByCity)
                  .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
                  .map(([cityName, cityRestaurants]) => (
                    <div key={cityName}>
                      <h3 className="font-display text-2xl font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {cityName}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {cityRestaurants.map((restaurant) => (
                          <Link
                            key={restaurant.id}
                            href={`/restaurant/${restaurant.slug}`}
                            className="p-4 rounded-lg block hover:shadow-md transition-shadow"
                            style={{
                              background: restaurant.status === 'open' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                              boxShadow: 'var(--shadow-sm)',
                              opacity: restaurant.status === 'closed' ? 0.6 : 1
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-ui text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                  {restaurant.name}
                                </h4>
                                <div className="flex gap-2 items-center">
                                  {restaurant.price_tier && (
                                    <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                                      {restaurant.price_tier}
                                    </span>
                                  )}
                                  {restaurant.google_rating && (
                                    <span className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                                      ⭐ {restaurant.google_rating}/5
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  background: restaurant.status === 'open' ? 'var(--accent-success)' : 'var(--text-muted)',
                                  color: 'white'
                                }}
                              >
                                {restaurant.status === 'open' ? 'Open' : 'Closed'}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
