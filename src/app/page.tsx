import { Metadata } from 'next';
import { db } from '@/lib/supabase';
import HomePage from './HomePage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const stats = await db.getStats();

  const description = `Discover ${stats.restaurants} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives across ${stats.cities} cities. Interactive map with photos, ratings, and detailed restaurant profiles.`;
  const shortDescription = `Discover ${stats.restaurants} restaurants featured on Diners, Drive-ins and Dives with Guy Fieri.`;

  return {
    title: 'DDD Restaurant Map | Find Diners, Drive-ins and Dives Locations',
    description,
    openGraph: {
      title: 'DDD Restaurant Map | Diners, Drive-ins and Dives',
      description: shortDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'DDD Restaurant Map',
      description: shortDescription,
    },
  };
}

export default async function Page() {
  const [stats, featuredRestaurants, recentEpisodes] = await Promise.all([
    db.getStats(),
    db.getFeaturedRestaurants(12),
    db.getRecentEpisodes(10)
  ]);

  return (
    <HomePage
      initialRestaurants={featuredRestaurants}
      stats={stats}
      recentEpisodes={recentEpisodes}
    />
  );
}
