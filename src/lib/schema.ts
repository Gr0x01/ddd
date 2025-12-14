/**
 * Schema.org Structured Data Utilities for SEO
 *
 * Generates JSON-LD structured data for various page types to help
 * search engines understand our content better.
 */

import { Restaurant, Episode } from './supabase';

const SITE_NAME = 'Triple D Map';
const SITE_URL = 'https://trimpdmap.com';
const SITE_DESCRIPTION = 'Find every restaurant featured on Guy Fieri\'s Diners, Drive-ins and Dives. Interactive map, photos, ratings, and detailed info.';

/**
 * Organization schema for the site itself
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      // Add social media URLs when available
    ],
  };
}

/**
 * WebSite schema with SearchAction for search functionality
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Restaurant/LocalBusiness schema for individual restaurant pages
 */
export function generateRestaurantSchema(restaurant: Restaurant) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'LocalBusiness'],
    name: restaurant.name,
    description: restaurant.description || `${restaurant.name} - Featured on Diners, Drive-ins and Dives`,
    url: `${SITE_URL}/restaurant/${restaurant.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address || '',
      addressLocality: restaurant.city || '',
      addressRegion: restaurant.state || '',
      postalCode: restaurant.zip || '',
      addressCountry: restaurant.country || 'US',
    },
  };

  // Add coordinates if available
  if (restaurant.latitude && restaurant.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    };
  }

  // Add contact info if available
  if (restaurant.phone) {
    schema.telephone = restaurant.phone;
  }

  if (restaurant.website_url) {
    schema.url = restaurant.website_url;
  }

  // Add ratings if available (requires reviewCount for Google rich snippets)
  if (restaurant.google_rating && restaurant.google_review_count) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: restaurant.google_rating,
      reviewCount: restaurant.google_review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add price range if available
  if (restaurant.price_tier) {
    schema.priceRange = restaurant.price_tier;
  }

  // Add images if available
  if (restaurant.photos && restaurant.photos.length > 0) {
    schema.image = restaurant.photos;
  }

  // Add cuisine types if available (from RestaurantWithEpisodes)
  const restaurantWithCuisines = restaurant as any;
  if (restaurantWithCuisines.cuisines && restaurantWithCuisines.cuisines.length > 0) {
    schema.servesCuisine = restaurantWithCuisines.cuisines.map((c: any) => c.name);
  }

  // Add opening hours status
  if (restaurant.status === 'open') {
    schema.openingHoursSpecification = {
      '@type': 'OpeningHoursSpecification',
      // Note: Add actual hours when available in restaurant.hours_json
    };
  }

  return schema;
}

/**
 * BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * ItemList schema for lists of restaurants (city/state pages)
 */
export function generateItemListSchema(
  restaurants: Restaurant[],
  listName: string,
  listUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: `${SITE_URL}${listUrl}`,
    numberOfItems: restaurants.length,
    itemListElement: restaurants.map((restaurant, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Restaurant',
        name: restaurant.name,
        url: `${SITE_URL}/restaurant/${restaurant.slug}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: restaurant.city,
          addressRegion: restaurant.state,
        },
        ...(restaurant.google_rating && restaurant.google_review_count && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: restaurant.google_rating,
            reviewCount: restaurant.google_review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      },
    })),
  };
}

/**
 * Episode schema for TV episode pages (when we add them)
 */
export function generateEpisodeSchema(episode: Episode, restaurants: Restaurant[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: episode.title,
    episodeNumber: episode.episode_number,
    partOfSeason: {
      '@type': 'TVSeason',
      seasonNumber: episode.season,
      partOfSeries: {
        '@type': 'TVSeries',
        name: 'Diners, Drive-ins and Dives',
      },
    },
    ...(episode.air_date && {
      datePublished: episode.air_date,
    }),
    ...(episode.description && {
      description: episode.description,
    }),
    // Link to featured restaurants
    mentions: restaurants.map(r => ({
      '@type': 'Restaurant',
      name: r.name,
      url: `${SITE_URL}/restaurant/${r.slug}`,
    })),
  };
}

