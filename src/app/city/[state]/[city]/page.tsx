import { db, Restaurant, City } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
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

    const title = `${city.name} Diners | Triple D Restaurants in ${state.abbreviation}`;

    // Build description with length guard
    const baseDesc = `Find the best diners in ${city.name} from Guy Fieri's Triple D. ${openCount} of ${restaurants.length} still open.`;
    const fullDesc = baseDesc + topRatedText;
    const description = city.meta_description || (fullDesc.length > 160 ? baseDesc : fullDesc);

    return {
      title,
      description,
      alternates: {
        canonical: `/city/${validatedStateSlug}/${validatedCitySlug}`,
      },
      openGraph: {
        title: `${city.name} Diners | Triple D Restaurants`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${city.name} Diners | Triple D Restaurants`,
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

  // Fetch restaurants and other cities in state
  let restaurants: Restaurant[];
  let otherCitiesInState: City[] = [];
  try {
    const [restaurantsData, citiesData] = await Promise.all([
      db.getRestaurantsByCity(city.name, state.abbreviation),
      db.getCitiesByState(state.name),
    ]);
    restaurants = restaurantsData;
    // Get other cities in state (exclude current, sort by count, take top 6)
    otherCitiesInState = citiesData
      .filter((c: City) => c.slug !== validatedCitySlug && (c.restaurant_count ?? 0) > 0)
      .sort((a: City, b: City) => (b.restaurant_count ?? 0) - (a.restaurant_count ?? 0))
      .slice(0, 6);
  } catch (error) {
    console.error('Error fetching restaurants for city:', error);
    restaurants = [];
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');

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

        <FilterableRestaurantList
          restaurants={restaurants}
          hideLocationDropdown={true}
          emptyMessage={`No restaurants found in ${city.name} yet. Check back soon!`}
        />

        {/* Other Cities in State - Internal Linking */}
        {otherCitiesInState.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              More Cities in {state.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {otherCitiesInState.map((c) => (
                <Link
                  key={c.id}
                  href={`/city/${validatedStateSlug}/${c.slug}`}
                  className="p-4 rounded-lg text-center transition-all hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <span className="font-ui font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                    {c.name}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {c.restaurant_count} restaurants
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href={`/state/${validatedStateSlug}`}
                className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                VIEW ALL {state.name.toUpperCase()} CITIES
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
