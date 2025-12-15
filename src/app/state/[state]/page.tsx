import { db, Restaurant, City } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateBreadcrumbSchema, generateItemListSchema, generateStateFAQSchema, safeStringifySchema } from '@/lib/schema';

interface StatePageProps {
  params: Promise<{ state: string }>;
}

/**
 * Validate slug parameter to prevent injection attacks
 */
function validateSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    notFound();
  }

  // Slugs should be lowercase alphanumeric with hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    notFound();
  }

  // Prevent DOS via huge parameters
  if (slug.length > 100) {
    notFound();
  }

  return slug;
}

export const revalidate = 3600; // Revalidate every hour

// Pre-render all state pages at build time
export async function generateStaticParams() {
  try {
    const states = await db.getStates();
    return states.map((state) => ({
      state: state.slug,
    }));
  } catch (error) {
    console.error('Error generating state static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;

  try {
    // Validate slug (will throw notFound() if invalid)
    const validatedSlug = validateSlug(stateSlug);

    const state = await db.getState(validatedSlug);
    if (!state) {
      return {
        title: 'State Not Found | Diners, Drive-ins and Dives Locations',
      };
    }

    const [cities, restaurants] = await Promise.all([
      db.getCitiesByState(state.name),
      db.getRestaurantsByState(state.abbreviation)
    ]);

    const openCount = restaurants.filter(r => r.status === 'open').length;

    // Extract popular cuisines for richer description
    const cuisines = new Set<string>();
    restaurants.forEach(r => {
      if ('cuisines' in r && Array.isArray(r.cuisines)) {
        r.cuisines.forEach((c: any) => cuisines.add(c.name));
      }
    });
    const topCuisines = Array.from(cuisines).slice(0, 3).join(', ');

    const title = `${openCount} Diners, Drive-ins and Dives Restaurants in ${state.name} | Guy Fieri`;
    const description = state.meta_description ||
      `Discover ${restaurants.length} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives in ${state.name}. ` +
      `${openCount} still open across ${cities.length} cities. ` +
      (topCuisines ? `Popular cuisines: ${topCuisines}. ` : '') +
      `View photos, ratings, and locations.`;

    return {
      title,
      description,
      openGraph: {
        title: `Diners, Drive-ins and Dives Restaurants in ${state.name}`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Diners, Drive-ins and Dives Restaurants in ${state.name}`,
        description,
      },
    };
  } catch (error) {
    // Re-throw Next.js notFound() errors so they can be handled properly
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('State page metadata generation failed:', error);
    return {
      title: 'State Not Found | Diners, Drive-ins and Dives Locations',
    };
  }
}

export default async function StatePage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;
  const validatedSlug = validateSlug(stateSlug);

  // Fetch state first to get proper state abbreviation
  const state = await db.getState(validatedSlug);

  if (!state) {
    notFound();
  }

  // Fetch cities and restaurants using state name/abbreviation
  let cities: City[];
  let restaurants: Restaurant[];
  try {
    [cities, restaurants] = await Promise.all([
      db.getCitiesByState(state.name),
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

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: state.name },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `Diners, Drive-ins and Dives Restaurants in ${state.name}`,
    `/state/${validatedSlug}`
  );

  const topCities = cities
    .filter(c => (c.restaurant_count ?? 0) > 0)
    .sort((a, b) => (b.restaurant_count ?? 0) - (a.restaurant_count ?? 0))
    .slice(0, 5)
    .map(c => ({ name: c.name, count: c.restaurant_count ?? 0 }));

  const faqSchema = generateStateFAQSchema(
    state.name,
    restaurants.length,
    openRestaurants.length,
    topCities
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(faqSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="states" />

        <PageHero
          title={state.name}
          subtitle="Diners, Drive-ins and Dives Restaurants"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' },
            { value: cities.length, label: 'CITIES' }
          ]}
          breadcrumbItems={[
            { label: 'States', href: '/states' },
            { label: state.name }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">

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
                Cities with Diners, Drive-ins and Dives Restaurants
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {cities
                  .filter(city => (city.restaurant_count ?? 0) > 0)
                  .sort((a, b) => (b.restaurant_count ?? 0) - (a.restaurant_count ?? 0))
                  .map((city) => (
                    <Link
                      key={city.id}
                      href={`/city/${validatedSlug}/${city.slug}`}
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
              <div className="space-y-8">
                {Object.entries(restaurantsByCity)
                  .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
                  .map(([cityName, cityRestaurants]) => (
                    <div key={cityName}>
                      <h3 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {cityName}
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cityRestaurants.map((restaurant, index) => (
                          <RestaurantCardCompact
                            key={restaurant.id}
                            restaurant={restaurant}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
        </main>
      </div>
      <Footer />
    </>
  );
}
