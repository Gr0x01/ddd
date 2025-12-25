import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, getCachedCuisine, getCachedRestaurantsByCuisine } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';

interface CuisinePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

// Pre-render all cuisine pages at build time
export async function generateStaticParams() {
  try {
    const cuisines = await db.getCuisineSlugs();
    console.log(`✓ Generating ${cuisines.length} cuisine pages`);
    return cuisines.map((cuisine) => ({
      slug: cuisine.slug,
    }));
  } catch (error) {
    console.error('✗ Error generating cuisine static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CuisinePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Use cached functions - deduplicated with page component
    const cuisine = await getCachedCuisine(slug);
    if (!cuisine) {
      return {
        title: 'Cuisine Not Found | Diners, Drive-ins and Dives',
      };
    }

    const restaurants = await getCachedRestaurantsByCuisine(slug);
    const openCount = restaurants.filter(r => r.status === 'open').length;

    const title = `${restaurants.length} ${cuisine.name} Restaurants | Diners, Drive-ins and Dives`;
    const description = cuisine.meta_description ||
      `Discover ${restaurants.length} ${cuisine.name.toLowerCase()} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives. ${openCount} still open. View photos, ratings, and locations.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/cuisines/${slug}`,
      },
      openGraph: {
        title: `${cuisine.name} Restaurants | Diners, Drive-ins and Dives`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cuisine.name} | Diners, Drive-ins and Dives`,
        description,
      },
    };
  } catch (error) {
    console.error('Cuisine page metadata generation failed:', error);
    return {
      title: 'Cuisine Not Found | Diners, Drive-ins and Dives',
    };
  }
}

export default async function CuisinePage({ params }: CuisinePageProps) {
  const { slug } = await params;

  let cuisine;
  let restaurants;
  let states: Array<{ name: string; abbreviation: string; count: number }> = [];
  let cities: Array<{ name: string; state: string | null; count: number }> = [];
  let relatedCuisines: Array<{ id: string; name: string; slug: string; restaurantCount: number }> = [];
  let topCitiesForCuisine: Array<{ city: string; state: string; citySlug: string; stateSlug: string; count: number }> = [];

  try {
    // Use cached functions - same calls as metadata, deduplicated by React cache
    const [cuisineData, restaurantsData, statesData, citiesData, allCuisines, topCities] = await Promise.all([
      getCachedCuisine(slug),
      getCachedRestaurantsByCuisine(slug),
      db.getStatesWithCounts(),
      db.getCitiesWithCounts(),
      db.getCuisinesWithCounts(),
      db.getTopCitiesForCuisine(slug, 8),
    ]);

    if (!cuisineData) {
      notFound();
    }

    cuisine = cuisineData;
    restaurants = restaurantsData;
    topCitiesForCuisine = topCities;
    states = statesData.map((s: { name: string; abbreviation: string; restaurant_count?: number }) => ({
      name: s.name,
      abbreviation: s.abbreviation,
      count: s.restaurant_count ?? 0,
    }));
    cities = citiesData.map((c: { name: string; state_name: string; restaurant_count?: number }) => ({
      name: c.name,
      state: c.state_name,
      count: c.restaurant_count ?? 0,
    }));
    // Get related cuisines (exclude current, sort by count, take top 6)
    relatedCuisines = allCuisines
      .filter(c => c.slug !== slug)
      .sort((a, b) => b.restaurantCount - a.restaurantCount)
      .slice(0, 6);
  } catch (error) {
    console.error('Error loading cuisine page:', error);
    notFound();
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cuisines', url: '/cuisines' },
    { name: cuisine.name },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `${cuisine.name} Restaurants - Diners, Drive-ins and Dives`,
    `/cuisines/${slug}`
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
          title={cuisine.name}
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'Cuisines', href: '/cuisines' },
            { label: cuisine.name }
          ]}
        />

        {/* Cuisine Description */}
        {cuisine.description && (
          <section className="max-w-6xl mx-auto px-4 pt-12">
            <div className="p-6 rounded-lg mb-8" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
                {cuisine.description}
              </p>
            </div>
          </section>
        )}

        {/* Top Cities for this Cuisine - Internal Linking */}
        {topCitiesForCuisine.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Top Cities for {cuisine.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {topCitiesForCuisine.map((c) => (
                <Link
                  key={`${c.city}-${c.state}`}
                  href={`/city/${c.stateSlug}/${c.citySlug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  {c.city}, {c.state} <span style={{ color: 'var(--text-muted)' }}>({c.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filterable Restaurant List */}
        <FilterableRestaurantList
          restaurants={restaurants}
          states={states}
          cities={cities}
          emptyMessage={`No ${cuisine.name.toLowerCase()} restaurants found yet. Check back soon!`}
        />

        {/* Related Cuisines - Internal Linking */}
        {relatedCuisines.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Explore Other Cuisines
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedCuisines.map((c) => (
                <Link
                  key={c.id}
                  href={`/cuisines/${c.slug}`}
                  className="p-4 rounded-lg text-center transition-all hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <span className="font-ui font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                    {c.name}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {c.restaurantCount} restaurants
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/cuisines"
                className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                VIEW ALL CUISINES
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
