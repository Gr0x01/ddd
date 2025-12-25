import { Metadata } from 'next';
import { db } from '@/lib/supabase';
import HomePage from './HomePage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const stats = await db.getStats();

  const openCount = stats.openRestaurants?.toLocaleString() || '1,000+';
  const description = `Find ${openCount} verified open Triple D restaurants. Browse Guy Fieri's picks by city, cuisine, or plan a road trip. Updated Dec 2025.`;
  const shortDescription = `${openCount} verified open Triple D restaurants. Plan your Guy Fieri road trip.`;

  return {
    title: 'Guy Fieri Restaurants | Diners, Drive-ins and Dives Map',
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: 'Guy Fieri Restaurants | Diners, Drive-ins and Dives Map',
      description: shortDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Guy Fieri Restaurants | Diners, Drive-ins and Dives Map',
      description: shortDescription,
    },
  };
}

export default async function Page() {
  const [stats, featuredRestaurants, recentEpisodes, curatedRoutes] = await Promise.all([
    db.getStats(),
    db.getFeaturedRestaurants(20),
    db.getRecentEpisodes(10),
    db.getCuratedRoutesWithCounts(),
  ]);

  // Iconic: hand-picked or highest-rated restaurants
  const iconicRestaurants = featuredRestaurants.slice(0, 10);

  return (
    <HomePage
      iconicRestaurants={iconicRestaurants}
      stats={stats}
      recentEpisodes={recentEpisodes}
      curatedRoutes={curatedRoutes}
    />
  );
}
