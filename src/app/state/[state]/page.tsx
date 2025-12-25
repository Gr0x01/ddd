import { db, Restaurant, City } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
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

    const title = `${state.name} Diners | Triple D Restaurants Map`;
    const description = state.meta_description ||
      `All ${restaurants.length} Triple D restaurants in ${state.name}. Browse ${cities.length} cities, see which ${openCount} are still open, and plan your Guy Fieri food tour.` +
      (topCuisines ? ` Popular: ${topCuisines}.` : '');

    return {
      title,
      description,
      alternates: {
        canonical: `/state/${validatedSlug}`,
      },
      openGraph: {
        title: `${state.name} Diners | Triple D Restaurants`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${state.name} Diners | Triple D Restaurants`,
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

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  // Get top cuisines for intro text
  const cuisineCount = new Map<string, number>();
  restaurants.forEach(r => {
    if ('cuisines' in r && Array.isArray(r.cuisines)) {
      r.cuisines.forEach((c: { name: string }) => {
        cuisineCount.set(c.name, (cuisineCount.get(c.name) || 0) + 1);
      });
    }
  });
  const topCuisines = Array.from(cuisineCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  // Prepare cities for filter dropdown (only cities in this state)
  const citiesForFilter = cities
    .filter(c => (c.restaurant_count ?? 0) > 0)
    .map(c => ({
      name: c.name,
      state: state.abbreviation,
      count: c.restaurant_count ?? 0,
    }));

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
          description={
            <>
              {state.name} is home to {restaurants.length} restaurants featured on Guy Fieri&apos;s Triple D
              {topCuisines.length > 0 ? `, from ${topCuisines.slice(0, 2).join(' to ')}${topCuisines.length > 2 ? ` and more` : ''}` : ''}.
              {' '}{openRestaurants.length} are still open. Use our{' '}
              <Link href="/roadtrip">road trip planner</Link> to visit multiple spots.
            </>
          }
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

        {/* Filterable Restaurant List */}
        <FilterableRestaurantList
          restaurants={restaurants}
          cities={citiesForFilter}
          hideLocationDropdown={true}
          emptyMessage={`No restaurants found in ${state.name} yet. Check back soon!`}
        />

        {/* Cities List - After restaurants for better UX flow */}
        {cities.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Browse {state.name} by City
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities
                .filter(city => (city.restaurant_count ?? 0) > 0)
                .sort((a, b) => (b.restaurant_count ?? 0) - (a.restaurant_count ?? 0))
                .map((city) => (
                  <Link
                    key={city.id}
                    href={`/city/${validatedSlug}/${city.slug}`}
                    className="p-4 rounded-lg block hover:scale-105 transition-transform"
                    style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <span className="font-ui font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                      {city.name}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {city.restaurant_count} {city.restaurant_count === 1 ? 'spot' : 'spots'}
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
