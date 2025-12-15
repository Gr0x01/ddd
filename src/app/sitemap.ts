import { MetadataRoute } from 'next';
import { db } from '@/lib/supabase';

/**
 * Dynamic sitemap generation for all pages
 * This helps search engines discover and index all restaurant, city, state pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tripledmap.com';

  try {
    // Fetch all data in parallel
    const [restaurants, states, cities, cuisines, routes] = await Promise.all([
      db.getRestaurants(),
      db.getStates(),
      db.getCities(),
      db.getCuisines(),
      db.getCuratedRoutes(),
    ]);

    // Create a map of state_name -> state_slug for building city URLs
    const stateSlugMap = new Map<string, string>();
    states.forEach(state => {
      stateSlugMap.set(state.name, state.slug);
    });

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/restaurants`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/states`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/cuisines`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/still-open`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/closed`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/roadtrip`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ];

    // Restaurant pages - highest priority for individual content
    const restaurantPages: MetadataRoute.Sitemap = restaurants.map((restaurant) => ({
      url: `${baseUrl}/restaurant/${restaurant.slug}`,
      lastModified: restaurant.updated_at ? new Date(restaurant.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // State pages - important geographic landing pages
    const statePages: MetadataRoute.Sitemap = states.map((state) => ({
      url: `${baseUrl}/state/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // City pages - important for local SEO
    // Filter out cities without a valid state mapping
    const cityPages: MetadataRoute.Sitemap = cities
      .filter(city => stateSlugMap.has(city.state_name))
      .map((city) => ({
        url: `${baseUrl}/city/${stateSlugMap.get(city.state_name)}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    // Cuisine pages - important for topical SEO
    const cuisinePages: MetadataRoute.Sitemap = cuisines.map((cuisine) => ({
      url: `${baseUrl}/cuisines/${cuisine.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Curated route pages - road trip content
    const routePages: MetadataRoute.Sitemap = routes
      .filter(route => route.slug) // Only include routes with slugs
      .map((route) => ({
        url: `${baseUrl}/route/${route.slug}`,
        lastModified: route.created_at ? new Date(route.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    return [...staticPages, ...restaurantPages, ...statePages, ...cityPages, ...cuisinePages, ...routePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return minimal sitemap on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
