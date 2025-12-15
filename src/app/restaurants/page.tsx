import { db, Restaurant, getCachedRestaurantStats } from '@/lib/supabase';
import { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Use efficient stats query - just counts, not full records
    const stats = await getCachedRestaurantStats();

    const title = `All ${stats.total} Diners, Drive-ins and Dives Restaurants | Guy Fieri`;
    const description = `Browse all ${stats.total} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives. ${stats.open} still open. View photos, ratings, and detailed info for every location.`;

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
  let restaurants: Restaurant[] = [];
  let states: Array<{ name: string; abbreviation: string; count: number }> = [];
  let cities: Array<{ name: string; state: string | null; count: number }> = [];

  try {
    const [restaurantsData, statesData, citiesData] = await Promise.all([
      db.getRestaurants(),
      db.getStatesWithCounts(),
      db.getCitiesWithCounts(),
    ]);
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
    console.error('Error fetching restaurants:', error);
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');

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
    'All Diners, Drive-ins and Dives Restaurants',
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
          subtitle="Diners, Drive-ins and Dives Locations"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' },
            { value: citiesCount, label: 'CITIES' }
          ]}
          breadcrumbItems={[
            { label: 'Restaurants' }
          ]}
        />

        <FilterableRestaurantList
          restaurants={restaurants}
          states={states}
          cities={cities}
          emptyMessage="No restaurants found yet. Check back soon!"
        />
      </div>
      <Footer />
    </>
  );
}
