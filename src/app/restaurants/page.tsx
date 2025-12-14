import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';

export default async function RestaurantsPage() {
  const restaurants = await db.getRestaurants();

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="font-display text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              All DDD Restaurants
            </h1>
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              {restaurants.length} restaurants featured on Diners, Drive-ins and Dives
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCardCompact key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          {restaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="font-ui text-lg" style={{ color: 'var(--text-muted)' }}>
                No restaurants found yet. Check back soon!
              </p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
