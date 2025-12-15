import { db, Restaurant } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateBreadcrumbSchema, generateItemListSchema, generateCityBusinessSchema, safeStringifySchema } from '@/lib/schema';

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
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

// Pre-render all city pages at build time
export async function generateStaticParams() {
  try {
    const [states, cities] = await Promise.all([
      db.getStates(),
      db.getCities(),
    ]);

    // Map state names to slugs
    const stateSlugMap = new Map(
      states.map(state => [state.name, state.slug])
    );

    // Map cities to route params
    return cities
      .filter(city => stateSlugMap.has(city.state_name))
      .map((city) => ({
        state: stateSlugMap.get(city.state_name)!,
        city: city.slug,
      }));
  } catch (error) {
    console.error('Error generating city static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;

  try {
    // Validate slugs (will throw notFound() if invalid)
    const validatedStateSlug = validateSlug(stateSlug);
    const validatedCitySlug = validateSlug(citySlug);

    const state = await db.getState(validatedStateSlug);
    if (!state) {
      return {
        title: 'City Not Found | Diners, Drive-ins and Dives Locations',
      };
    }

    const city = await db.getCity(state.name, validatedCitySlug);
    if (!city) {
      return {
        title: 'City Not Found | Diners, Drive-ins and Dives Locations',
      };
    }

    const restaurants = await db.getRestaurantsByCity(city.name, state.abbreviation);
    const openCount = restaurants.filter(r => r.status === 'open').length;

    // Mention top-rated restaurants for richer description
    const topRated = restaurants
      .filter(r => r.google_rating && r.google_rating >= 4.5)
      .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
      .slice(0, 2);

    const topRatedText = topRated.length > 0
      ? ` Top picks: ${topRated.map(r => r.name).join(', ')}.`
      : '';

    const title = `${openCount} Diners, Drive-ins and Dives Restaurants in ${city.name}, ${state.abbreviation} | Guy Fieri`;
    const description = city.meta_description ||
      `Discover ${restaurants.length} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives in ${city.name}, ${state.name}. ` +
      `${openCount} still open.${topRatedText} View photos, ratings, and detailed info.`;

    return {
      title,
      description,
      openGraph: {
        title: `Diners, Drive-ins and Dives Restaurants in ${city.name}, ${state.abbreviation}`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Diners, Drive-ins and Dives Restaurants in ${city.name}, ${state.abbreviation}`,
        description,
      },
    };
  } catch (error) {
    // Re-throw Next.js notFound() errors so they can be handled properly
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('City page metadata generation failed:', error);
    return {
      title: 'City Not Found | Diners, Drive-ins and Dives Locations',
    };
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const { state: stateSlug, city: citySlug } = await params;
  const validatedStateSlug = validateSlug(stateSlug);
  const validatedCitySlug = validateSlug(citySlug);

  // Fetch state first to get state name
  const state = await db.getState(validatedStateSlug);

  if (!state) {
    notFound();
  }

  // Fetch city using state name and city slug
  const city = await db.getCity(state.name, validatedCitySlug);

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
    { name: state.name, url: `/state/${validatedStateSlug}` },
    { name: city.name },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `Diners, Drive-ins and Dives Restaurants in ${city.name}, ${state.abbreviation}`,
    `/city/${validatedStateSlug}/${validatedCitySlug}`
  );

  const cityBusinessSchema = generateCityBusinessSchema(
    city.name,
    state.name,
    state.abbreviation,
    restaurants
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
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(cityBusinessSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="states" />

        <PageHero
          title={`${city.name}, ${city.state_name}`}
          subtitle="Diners, Drive-ins and Dives Restaurants"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'States', href: '/states' },
            { label: state.name, href: `/state/${validatedStateSlug}` },
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
          <div className="space-y-8">
            {openRestaurants.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                  Open Now ({openRestaurants.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {openRestaurants.map((restaurant, index) => (
                    <RestaurantCardCompact
                      key={restaurant.id}
                      restaurant={restaurant}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            )}

            {closedRestaurants.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                  Closed ({closedRestaurants.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closedRestaurants.map((restaurant, index) => (
                    <RestaurantCardCompact
                      key={restaurant.id}
                      restaurant={restaurant}
                      index={index}
                    />
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
