import { Metadata } from 'next';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { CategoryCard } from '@/components/ui/CategoryCard';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Browse by Cuisine | Diners, Drive-ins and Dives Restaurants',
  description: 'Explore Diners, Drive-ins and Dives restaurants by cuisine type. Find BBQ joints, burger spots, Mexican restaurants, diners, and more featured by Guy Fieri.',
  alternates: {
    canonical: '/cuisines',
  },
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
              <CategoryCard
                key={cuisine.id}
                href={`/cuisines/${cuisine.slug}`}
                title={cuisine.name}
                count={cuisine.restaurantCount}
                subtitle={cuisine.description || undefined}
              />
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
