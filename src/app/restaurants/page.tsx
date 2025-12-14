import { db, Restaurant } from '@/lib/supabase';
import { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  try {
    const restaurants = await db.getRestaurants();
    const openCount = restaurants.filter(r => r.status === 'open').length;

    const title = `All ${restaurants.length} Diners, Drive-ins and Dives Restaurants | Guy Fieri`;
    const description = `Browse all ${restaurants.length} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives. ${openCount} still open. View photos, ratings, and detailed info for every location.`;

    return {
      title,
      description,
      openGraph: {
        title: `All Diners, Drive-ins and Dives Restaurants`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `All Diners, Drive-ins and Dives Restaurants`,
        description,
      },
    };
  } catch (error) {
    console.error('Restaurants page metadata generation failed:', error);
    return {
      title: 'All Restaurants | Diners, Drive-ins and Dives Locations',
    };
  }
}

export default async function RestaurantsPage() {
  let restaurants: Restaurant[];
  try {
    restaurants = await db.getRestaurants();
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    restaurants = [];
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');
  const closedRestaurants = restaurants.filter(r => r.status === 'closed');

  // Get unique cities count
  const uniqueCities = new Set(restaurants.map(r => `${r.city}, ${r.state}`));
  const citiesCount = uniqueCities.size;

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'All Restaurants' },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    'All DDD Restaurants',
    '/restaurants'
  );

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(itemListSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="All Restaurants"
          subtitle="DDD Locations"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' },
            { value: citiesCount, label: 'CITIES' }
          ]}
          breadcrumbItems={[
            { label: 'Restaurants' }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          {restaurants.length === 0 ? (
            <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
                No restaurants found yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {openRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Open Now ({openRestaurants.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {openRestaurants.map((restaurant) => (
                      <RestaurantCardCompact key={restaurant.id} restaurant={restaurant} />
                    ))}
                  </div>
                </section>
              )}

              {closedRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Closed ({closedRestaurants.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                    {closedRestaurants.map((restaurant) => (
                      <RestaurantCardCompact key={restaurant.id} restaurant={restaurant} />
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
