import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { DollarSign } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Browse by Budget | Diners, Drive-ins and Dives Restaurants',
  description: 'Find Diners, Drive-ins and Dives restaurants by price range. From budget-friendly eats to fine dining, discover Guy Fieri-approved spots at every price point.',
  alternates: {
    canonical: '/budget',
  },
  openGraph: {
    title: 'Browse Diners, Drive-ins and Dives by Budget',
    description: 'Find restaurants at every price point - from budget-friendly to fine dining.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Diners, Drive-ins and Dives by Budget',
    description: 'Find restaurants at every price point - from budget-friendly to fine dining.',
  },
};

// Price tier icons (dollar signs)
function PriceTierIcon({ tier }: { tier: string }) {
  const count = tier.length; // $ = 1, $$ = 2, etc.
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <DollarSign
          key={i}
          className="w-6 h-6"
          style={{ color: 'var(--ddd-yellow)' }}
        />
      ))}
      {/* Faded remaining dollars */}
      {Array.from({ length: 4 - count }).map((_, i) => (
        <DollarSign
          key={`faded-${i}`}
          className="w-6 h-6 opacity-20"
          style={{ color: 'var(--text-muted)' }}
        />
      ))}
    </div>
  );
}

export default async function BudgetPage() {
  const priceTiers = await db.getPriceTiersWithCounts();

  const totalRestaurants = priceTiers.reduce((sum, t) => sum + t.count, 0);

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Browse by Budget"
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: priceTiers.length, label: 'PRICE RANGES' },
            { value: totalRestaurants, label: 'RESTAURANTS' }
          ]}
        />

        <main id="main-content" className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              Find Guy Fieri-approved restaurants at every price point.
              Whether you're looking for a quick, cheap bite or a special night out.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {priceTiers.map((tier) => (
              <Link
                key={tier.slug}
                href={`/budget/${tier.slug}`}
                className="p-6 rounded-lg block transition-all group hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <PriceTierIcon tier={tier.tier} />
                  <span
                    className="font-mono text-sm px-2 py-1"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    {tier.count}
                  </span>
                </div>
                <h3
                  className="font-display text-2xl font-bold mb-1 group-hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {tier.label}
                </h3>
                <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {tier.description}
                </p>
              </Link>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
