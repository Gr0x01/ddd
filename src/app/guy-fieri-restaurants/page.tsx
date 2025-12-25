import { db, Restaurant, getCachedRestaurantStats } from '@/lib/supabase';
import { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getCachedRestaurantStats();

  const title = `Guy Fieri Restaurants | All ${stats.total} Diners, Drive-ins and Dives Locations`;
  const description = `Complete list of ${stats.total} Guy Fieri restaurants from Diners, Drive-ins and Dives. ${stats.open} still open. Find Triple D restaurants near you with our interactive map and road trip planner.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/guy-fieri-restaurants',
    },
    openGraph: {
      title: `Guy Fieri Restaurants | Complete Triple D List`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Guy Fieri Restaurants | All ${stats.total} Locations`,
      description,
    },
  };
}

export default async function GuyFieriRestaurantsPage() {
  let restaurants: Restaurant[] = [];
  let states: Array<{ name: string; abbreviation: string; count: number }> = [];
  let cities: Array<{ name: string; state: string | null; count: number }> = [];
  let countries: Array<{ country: string; count: number }> = [];

  try {
    const [restaurantsData, statesData, citiesData, countriesData] = await Promise.all([
      db.getRestaurants(),
      db.getStatesWithCounts(),
      db.getCitiesWithCounts(),
      db.getCountriesWithCounts(),
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
    countries = countriesData;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');
  const uniqueStates = new Set(restaurants.map(r => r.state).filter(Boolean));

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guy Fieri Restaurants' },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    'Guy Fieri Restaurants from Diners, Drive-ins and Dives',
    '/guy-fieri-restaurants'
  );

  // FAQ schema targeting "guy fieri restaurants" queries
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How many Guy Fieri restaurants are there?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Guy Fieri has featured ${restaurants.length} restaurants on Diners, Drive-ins and Dives since 2006. Of these, ${openRestaurants.length} are still open and serving customers.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Where can I find Guy Fieri restaurants near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Guy Fieri has featured restaurants in ${uniqueStates.size} states across the US. Use our Road Trip Planner to find Triple D restaurants along any route, or browse by state, city, or cuisine type.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Are Guy Fieri restaurants expensive?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most restaurants featured on Diners, Drive-ins and Dives are affordable diners and casual eateries. Guy Fieri specifically seeks out "dive" restaurants that serve great food at reasonable prices.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Guy Fieri own all the restaurants on Triple D?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, Guy Fieri does not own the restaurants featured on Diners, Drive-ins and Dives. He visits independently-owned restaurants across America and showcases their signature dishes on the show.',
        },
      },
    ],
  };

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
        <Header currentPage="restaurants" />

        <PageHero
          title="Guy Fieri Restaurants"
          subtitle="Every Restaurant from Diners, Drive-ins and Dives"
          description={`Since 2006, Guy Fieri has featured ${restaurants.length} restaurants on Triple D. ${openRestaurants.length} are verified open and serving the dishes that made them famous.`}
          stats={[
            { value: restaurants.length, label: 'FEATURED' },
            { value: openRestaurants.length, label: 'STILL OPEN' },
            { value: uniqueStates.size, label: 'STATES' }
          ]}
          breadcrumbItems={[
            { label: 'Guy Fieri Restaurants' }
          ]}
        />

        <FilterableRestaurantList
          restaurants={restaurants}
          states={states}
          cities={cities}
          countries={countries}
          emptyMessage="No restaurants found yet. Check back soon!"
        />
      </div>
      <Footer />
    </>
  );
}
