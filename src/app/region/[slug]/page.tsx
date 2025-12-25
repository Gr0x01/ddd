import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';
import { REGIONS, getRegionBySlug, getRegionSlugs } from '@/lib/constants/regions';

export const revalidate = 3600; // Revalidate every hour

interface RegionPageProps {
  params: Promise<{ slug: string }>;
}

// Validate slug format
function validateSlug(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  if (slug.length > 50) notFound();
  return slug;
}

// Generate static params for all regions
export async function generateStaticParams() {
  return getRegionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const validatedSlug = validateSlug(slug);
  const region = getRegionBySlug(validatedSlug);

  if (!region) {
    return { title: 'Region Not Found' };
  }

  // Get restaurant count for this region
  const restaurants = await db.getRestaurants();
  const regionRestaurants = restaurants.filter((r) => r.state && region.states.includes(r.state));
  const openCount = regionRestaurants.filter((r) => r.status === 'open').length;

  const title = `${region.title} | ${regionRestaurants.length} Diners, Drive-ins and Dives Restaurants`;
  const description = `Find ${regionRestaurants.length} Guy Fieri restaurants in the ${region.name}. ${openCount} Triple D spots still open across ${region.states.length} states. ${region.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/region/${region.slug}`,
    },
    openGraph: {
      title: `${region.title} | Triple D Restaurants`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${region.title} | Diners, Drive-ins and Dives`,
      description,
    },
  };
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { slug } = await params;
  const validatedSlug = validateSlug(slug);
  const region = getRegionBySlug(validatedSlug);

  if (!region) {
    notFound();
  }

  // Fetch restaurants and filter by region states
  const [allRestaurants, allStates, allCities] = await Promise.all([
    db.getRestaurants(),
    db.getStatesWithCounts(),
    db.getCitiesWithCounts(),
  ]);

  const restaurants = allRestaurants.filter((r) => r.state && region.states.includes(r.state));
  const openRestaurants = restaurants.filter((r) => r.status === 'open');

  // Filter states to only those in this region
  const states = allStates
    .filter((s) => region.states.includes(s.abbreviation))
    .map((s) => ({
      name: s.name,
      abbreviation: s.abbreviation,
      count: s.restaurant_count ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Filter cities to only those in region states
  const regionStateNames = new Set(states.map((s) => s.name));
  const cities = allCities
    .filter((c) => regionStateNames.has(c.state_name))
    .map((c) => ({
      name: c.name,
      state: c.state_name,
      count: c.restaurant_count ?? 0,
    }));

  // Get unique cities count
  const uniqueCities = new Set(restaurants.map((r) => `${r.city}, ${r.state}`));

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Regions', url: '/region' },
    { name: region.name },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `${region.title} - Diners, Drive-ins and Dives`,
    `/region/${region.slug}`
  );

  // FAQ schema for regional queries
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many Diners, Drive-ins and Dives restaurants are on the ${region.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are ${restaurants.length} restaurants featured on Guy Fieri's show in the ${region.name} region. ${openRestaurants.length} are still open across ${states.length} states.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which ${region.name} states have the most Triple D restaurants?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The top states for Diners, Drive-ins and Dives in the ${region.name} are: ${states
            .slice(0, 3)
            .map((s) => `${s.name} (${s.count} restaurants)`)
            .join(', ')}.`,
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
          title={region.title}
          subtitle="Diners, Drive-ins and Dives"
          description={region.description}
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'STILL OPEN' },
            { value: uniqueCities.size, label: 'CITIES' },
          ]}
          breadcrumbItems={[
            { label: 'Regions', href: '/region' },
            { label: region.name }
          ]}
        />

        {/* Restaurant List */}
        <FilterableRestaurantList
          restaurants={restaurants}
          states={states}
          cities={cities}
          hideLocationDropdown={false}
          emptyMessage={`No restaurants found in the ${region.name}. Check back soon!`}
        />

        {/* Other Regions */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Explore Other Regions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {REGIONS.filter((r) => r.slug !== region.slug).map((otherRegion) => (
              <Link
                key={otherRegion.slug}
                href={`/region/${otherRegion.slug}`}
                className="p-4 rounded-lg text-center transition-all hover:scale-105"
                style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
              >
                <span className="font-ui font-semibold block" style={{ color: 'var(--text-primary)' }}>
                  {otherRegion.name}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {otherRegion.states.length} states
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
