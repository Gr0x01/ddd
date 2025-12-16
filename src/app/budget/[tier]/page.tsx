import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';
import { DollarSign } from 'lucide-react';

interface BudgetTierPageProps {
  params: Promise<{ tier: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: BudgetTierPageProps): Promise<Metadata> {
  const { tier } = await params;

  const tierMeta = db.getPriceTierBySlug(tier);
  if (!tierMeta) {
    return {
      title: 'Price Range Not Found | Diners, Drive-ins and Dives',
    };
  }

  const restaurants = await db.getRestaurantsByPriceTier(tier);
  const openCount = restaurants.filter(r => r.status === 'open').length;

  const title = `${restaurants.length} ${tierMeta.label} Restaurants | Diners, Drive-ins and Dives`;
  const description = `Discover ${restaurants.length} ${tierMeta.label.toLowerCase()} restaurants (${tierMeta.tier}) featured on Guy Fieri's Diners, Drive-ins and Dives. ${openCount} still open. ${tierMeta.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/budget/${tier}`,
    },
    openGraph: {
      title: `${tierMeta.label} Restaurants | Diners, Drive-ins and Dives`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tierMeta.label} | Diners, Drive-ins and Dives`,
      description,
    },
  };
}

// Price tier icons (dollar signs)
function PriceTierIcon({ tier, size = 'md' }: { tier: string; size?: 'sm' | 'md' | 'lg' }) {
  const count = tier.length;
  const sizeClass = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <DollarSign
          key={i}
          className={sizeClass}
          style={{ color: 'var(--ddd-yellow)' }}
        />
      ))}
    </div>
  );
}

export default async function BudgetTierPage({ params }: BudgetTierPageProps) {
  const { tier } = await params;

  const tierMeta = db.getPriceTierBySlug(tier);
  if (!tierMeta) {
    notFound();
  }

  const [restaurants, statesData, citiesData, allTiers] = await Promise.all([
    db.getRestaurantsByPriceTier(tier),
    db.getStatesWithCounts(),
    db.getCitiesWithCounts(),
    db.getPriceTiersWithCounts(),
  ]);

  const states = statesData.map((s: { name: string; abbreviation: string; restaurant_count?: number }) => ({
    name: s.name,
    abbreviation: s.abbreviation,
    count: s.restaurant_count ?? 0,
  }));

  const cities = citiesData.map((c: { name: string; state_name: string; restaurant_count?: number }) => ({
    name: c.name,
    state: c.state_name,
    count: c.restaurant_count ?? 0,
  }));

  // Get other price tiers for related links
  const otherTiers = allTiers.filter(t => t.slug !== tier);

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Browse by Budget', url: '/budget' },
    { name: tierMeta.label },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `${tierMeta.label} Restaurants - Diners, Drive-ins and Dives`,
    `/budget/${tier}`
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
          title={tierMeta.label}
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'Budget', href: '/budget' },
            { label: tierMeta.label }
          ]}
        />

        {/* Price Tier Description */}
        <section className="max-w-6xl mx-auto px-4 pt-12">
          <div
            className="p-6 rounded-lg mb-8 flex items-center gap-4"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <PriceTierIcon tier={tierMeta.tier} size="lg" />
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              {tierMeta.description}. Browse all {restaurants.length} restaurants from
              Guy Fieri's Diners, Drive-ins and Dives in this price range.
            </p>
          </div>
        </section>

        {/* Filterable Restaurant List */}
        <FilterableRestaurantList
          restaurants={restaurants}
          states={states}
          cities={cities}
          emptyMessage={`No ${tierMeta.label.toLowerCase()} restaurants found yet.`}
        />

        {/* Other Price Ranges - Internal Linking */}
        {otherTiers.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Explore Other Price Ranges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherTiers.map((t) => (
                <Link
                  key={t.slug}
                  href={`/budget/${t.slug}`}
                  className="p-4 rounded-lg transition-all hover:scale-105 flex items-center gap-3"
                  style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <PriceTierIcon tier={t.tier} size="sm" />
                  <div>
                    <span className="font-ui font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      {t.label}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.count} restaurants
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/budget"
                className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                VIEW ALL PRICE RANGES
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
