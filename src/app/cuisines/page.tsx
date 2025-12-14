import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Browse by Cuisine | Diners, Drive-ins and Dives Restaurants',
  description: 'Explore Diners, Drive-ins and Dives restaurants by cuisine type. Find BBQ joints, burger spots, Mexican restaurants, diners, and more featured by Guy Fieri.',
  openGraph: {
    title: 'Browse Diners, Drive-ins and Dives by Cuisine',
    description: 'Explore restaurants by cuisine type - BBQ, burgers, Mexican, Italian, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Diners, Drive-ins and Dives by Cuisine',
    description: 'Explore restaurants by cuisine type - BBQ, burgers, Mexican, Italian, and more.',
  },
};

export default async function CuisinesPage() {
  // Efficiently get cuisines with counts at database level (no N+1 query)
  const cuisineWithCounts = await db.getCuisinesWithCounts();

  // Sort by restaurant count descending
  cuisineWithCounts.sort((a, b) => b.restaurantCount - a.restaurantCount);

  const stats = await db.getStats();
  const totalRestaurants = stats.restaurants;

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Browse by Cuisine"
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: cuisineWithCounts.length, label: 'CUISINES' },
            { value: totalRestaurants, label: 'RESTAURANTS' }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              Browse restaurants from Guy Fieri's Diners, Drive-ins and Dives by cuisine type.
              From classic American diners to authentic ethnic eateries.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cuisineWithCounts.map((cuisine) => (
              <Link
                key={cuisine.id}
                href={`/cuisines/${cuisine.slug}`}
                className="p-6 rounded-lg block hover:shadow-lg transition-shadow group"
                style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display text-2xl font-bold group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                    {cuisine.name}
                  </h3>
                  <span
                    className="font-mono text-xs px-2 py-1 flex-shrink-0 ml-2"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    {cuisine.restaurantCount}
                  </span>
                </div>
                {cuisine.description && (
                  <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {cuisine.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
