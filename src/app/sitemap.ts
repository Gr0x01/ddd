import { MetadataRoute } from 'next';
import { db } from '@/lib/supabase';

// Cache sitemap for 1 hour to avoid expensive queries on every request
export const revalidate = 3600;

/**
 * Dynamic sitemap generation for all pages
 * This helps search engines discover and index all restaurant, city, state pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tripledmap.com';

  try {
    // Fetch all data in parallel
    const [restaurants, states, cities, cuisines, routes, seasons, priceTiers, dishes] = await Promise.all([
      db.getRestaurants(),
      db.getStates(),
      db.getCities(),
      db.getCuisines(),
      db.getAllRoutesWithSlugs(), // Get ALL routes with slugs for SEO
      db.getSeasonsWithCounts(),
      db.getPriceTiersWithCounts(),
      db.getDishesWithCounts(false), // All dishes
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
      // New SEO hub pages
      {
        url: `${baseUrl}/seasons`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/budget`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/dishes`,
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

    // Route pages - curated get higher priority, user-generated get lower
    const routePages: MetadataRoute.Sitemap = routes
      .filter(route => route.slug) // Only include routes with slugs
      .map((route) => ({
        url: `${baseUrl}/route/${route.slug}`,
        lastModified: route.created_at ? new Date(route.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: route.is_curated ? 0.7 : 0.5, // Curated routes get higher priority
      }));

    // Season pages
    const seasonPages: MetadataRoute.Sitemap = seasons.map((season) => ({
      url: `${baseUrl}/season/${season.season}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    // Budget/price tier pages
    const budgetPages: MetadataRoute.Sitemap = priceTiers.map((tier) => ({
      url: `${baseUrl}/budget/${tier.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Dish pages - limit to dishes served at multiple restaurants or signature dishes
    const dishPages: MetadataRoute.Sitemap = dishes
      .filter(dish => dish.restaurantCount > 0) // Only dishes with restaurants
      .slice(0, 500) // Limit to top 500 dishes by popularity
      .map((dish) => ({
        url: `${baseUrl}/dish/${dish.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: dish.is_signature_dish ? 0.6 : 0.5,
      }));

    return [
      ...staticPages,
      ...restaurantPages,
      ...statePages,
      ...cityPages,
      ...cuisinePages,
      ...routePages,
      ...seasonPages,
      ...budgetPages,
      ...dishPages,
    ];
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
