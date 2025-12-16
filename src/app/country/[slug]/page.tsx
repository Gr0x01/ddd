import { db, Restaurant } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';

interface CountryPageProps {
  params: Promise<{ slug: string }>;
}

// Map slugs to country names in database
const COUNTRY_SLUGS: Record<string, string> = {
  'spain': 'Spain',
  'united-kingdom': 'United Kingdom',
  'india': 'India',
  'italy': 'Italy',
  'canada': 'Canada',
};

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

// Pre-render country pages at build time
export async function generateStaticParams() {
  return Object.keys(COUNTRY_SLUGS).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const validatedSlug = validateSlug(slug);
    const countryName = COUNTRY_SLUGS[validatedSlug];

    if (!countryName) {
      return {
        title: 'Country Not Found | Diners, Drive-ins and Dives Locations',
      };
    }

    const restaurants = await db.getRestaurantsByCountry(countryName);
    const openCount = restaurants.filter(r => r.status === 'open').length;

    // Get unique cities
    const cities = new Set(restaurants.map(r => r.city));

    const title = `${restaurants.length} Diners, Drive-ins and Dives Restaurants in ${countryName} | Guy Fieri`;
    const description = `Discover ${restaurants.length} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives in ${countryName}. ` +
      `${openCount} still open across ${cities.size} ${cities.size === 1 ? 'city' : 'cities'}. ` +
      `View photos, ratings, and locations.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/country/${validatedSlug}`,
      },
      openGraph: {
        title: `Diners, Drive-ins and Dives Restaurants in ${countryName}`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Diners, Drive-ins and Dives Restaurants in ${countryName}`,
        description,
      },
    };
  } catch (error) {
    // Re-throw Next.js notFound() errors so they can be handled properly
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('Country page metadata generation failed:', error);
    return {
      title: 'Country Not Found | Diners, Drive-ins and Dives Locations',
    };
  }
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const validatedSlug = validateSlug(slug);

  const countryName = COUNTRY_SLUGS[validatedSlug];
  if (!countryName) {
    notFound();
  }

  let restaurants: Restaurant[];
  try {
    restaurants = await db.getRestaurantsByCountry(countryName);
  } catch (error) {
    console.error('Error fetching country data:', error);
    restaurants = [];
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  // Get unique cities for stats
  const uniqueCities = new Set(restaurants.map(r => r.city));

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: countryName },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `Diners, Drive-ins and Dives Restaurants in ${countryName}`,
    `/country/${validatedSlug}`
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
        <Header currentPage="states" />

        <PageHero
          title={countryName}
          subtitle="Diners, Drive-ins and Dives Restaurants"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' },
            { value: uniqueCities.size, label: 'CITIES' }
          ]}
          breadcrumbItems={[
            { label: 'States', href: '/states' },
            { label: countryName }
          ]}
        />

        {/* Filterable Restaurant List */}
        <FilterableRestaurantList
          restaurants={restaurants}
          hideLocationDropdown={true}
          emptyMessage={`No restaurants found in ${countryName} yet. Check back soon!`}
        />
      </div>
      <Footer />
    </>
  );
}
