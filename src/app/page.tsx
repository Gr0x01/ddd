import { Metadata } from 'next';
import { db } from '@/lib/supabase';
import HomePage from './HomePage';
import fs from 'fs/promises';
import path from 'path';
import type { City } from '@/lib/cityMatcher';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const stats = await db.getStats();

  const description = `Discover ${stats.restaurants} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives across ${stats.cities} cities. Plan road trips, find restaurants near you, and explore Diners, Drive-ins and Dives locations.`;
  const shortDescription = `Find ${stats.restaurants} Guy Fieri restaurants. Plan road trips & discover Diners, Drive-ins and Dives locations.`;

  return {
    title: 'Diners, Drive-ins and Dives Locations | Plan Your Guy Fieri Road Trip',
    description,
    openGraph: {
      title: 'Plan Your Diners, Drive-ins and Dives Road Trip | Guy Fieri Restaurant Map',
      description: shortDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Diners, Drive-ins and Dives Road Trip Planner | Guy Fieri Restaurants',
      description: shortDescription,
    },
  };
}

// Load cities data from JSON file
async function loadCities(): Promise<City[]> {
  try {
    const citiesPath = path.join(process.cwd(), 'public', 'data', 'us-cities.min.json');
    const citiesData = await fs.readFile(citiesPath, 'utf-8');
    return JSON.parse(citiesData);
  } catch (error) {
    console.error('Failed to load cities data:', error);
    return [];
  }
}

export default async function Page() {
  const [stats, featuredRestaurants, recentEpisodes, cities, curatedRoutes] = await Promise.all([
    db.getStats(),
    db.getFeaturedRestaurants(20),
    db.getRecentEpisodes(10),
    loadCities(),
    db.getCuratedRoutes(),
  ]);

  // Iconic: hand-picked or highest-rated restaurants
  const iconicRestaurants = featuredRestaurants.slice(0, 10);

  return (
    <HomePage
      iconicRestaurants={iconicRestaurants}
      stats={stats}
      recentEpisodes={recentEpisodes}
      cities={cities}
      curatedRoutes={curatedRoutes}
    />
  );
}
