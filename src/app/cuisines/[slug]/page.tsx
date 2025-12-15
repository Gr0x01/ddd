import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

export async function generateMetadata({ params }: CuisinePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Use cached functions - deduplicated with page component
    const cuisine = await getCachedCuisine(slug);
    const restaurants = await getCachedRestaurantsByCuisine(slug);
    const openCount = restaurants.filter(r => r.status === 'open').length;

    const title = `${restaurants.length} ${cuisine.name} Restaurants | Diners, Drive-ins and Dives`;
    const description = cuisine.meta_description ||
      `Discover ${restaurants.length} ${cuisine.name.toLowerCase()} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives. ${openCount} still open. View photos, ratings, and locations.`;

    return {
      title,
      description,
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

  try {
    // Use cached functions - same calls as metadata, deduplicated by React cache
    const [cuisineData, restaurantsData, statesData, citiesData] = await Promise.all([
      getCachedCuisine(slug),
      getCachedRestaurantsByCuisine(slug),
      db.getStatesWithCounts(),
      db.getCitiesWithCounts(),
    ]);
    cuisine = cuisineData;
    restaurants = restaurantsData;
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

        {/* Filterable Restaurant List */}
        <FilterableRestaurantList
          restaurants={restaurants}
          states={states}
          cities={cities}
          emptyMessage={`No ${cuisine.name.toLowerCase()} restaurants found yet. Check back soon!`}
        />
      </div>
      <Footer />
    </>
  );
}
