import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import { REGIONS } from '@/lib/constants/regions';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const title = `US Regions | Diners, Drive-ins and Dives by Region`;
  const description = `Explore Guy Fieri's Diners, Drive-ins and Dives restaurants by US region. Browse West Coast, East Coast, Midwest, South, and Southwest Triple D locations.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/region',
    },
    openGraph: {
      title: `Triple D Restaurants by Region`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Diners, Drive-ins and Dives by Region`,
      description,
    },
  };
}

export default async function RegionsPage() {
  // Get all restaurants to calculate region counts
  const restaurants = await db.getRestaurants();

  // Calculate counts per region
  const regionCounts = REGIONS.map((region) => {
    const regionRestaurants = restaurants.filter(
      (r) => r.state && region.states.includes(r.state)
    );
    const openCount = regionRestaurants.filter((r) => r.status === 'open').length;
    return {
      ...region,
      totalCount: regionRestaurants.length,
      openCount,
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  const totalRestaurants = restaurants.length;
  const openRestaurants = restaurants.filter((r) => r.status === 'open').length;

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Regions' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Browse by Region"
          subtitle="Diners, Drive-ins and Dives"
          description="Explore Triple D restaurants organized by US region. Each region has its own food culture and Guy Fieri favorites."
          stats={[
            { value: totalRestaurants, label: 'RESTAURANTS' },
            { value: openRestaurants, label: 'STILL OPEN' },
            { value: REGIONS.length, label: 'REGIONS' },
          ]}
          breadcrumbItems={[{ label: 'Regions' }]}
        />

        <main className="max-w-6xl mx-auto px-4 py-12">
          {/* Region Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regionCounts.map((region) => (
              <Link
                key={region.slug}
                href={`/region/${region.slug}`}
                className="block p-6 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: 'var(--bg-secondary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h2
                  className="font-display text-2xl font-bold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {region.name}
                </h2>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-mono text-2xl font-bold" style={{ color: 'var(--ddd-yellow)' }}>
                      {region.totalCount}
                    </span>
                    <span className="font-mono text-xs block uppercase" style={{ color: 'var(--text-muted)' }}>
                      total
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {region.openCount}
                    </span>
                    <span className="font-mono text-xs block uppercase" style={{ color: 'var(--text-muted)' }}>
                      open
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {region.states.length}
                    </span>
                    <span className="font-mono text-xs block uppercase" style={{ color: 'var(--text-muted)' }}>
                      states
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
