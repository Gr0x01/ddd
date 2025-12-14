/**
 * Schema.org Structured Data Utilities for SEO
 *
 * Generates JSON-LD structured data for various page types to help
 * search engines understand our content better.
 */

import { Restaurant, Episode } from './supabase';

const SITE_NAME = 'Diners, Drive-ins and Dives Locations';
const SITE_URL = 'https://www.tripledmap.com';
const SITE_DESCRIPTION = 'Find every restaurant featured on Guy Fieri\'s Diners, Drive-ins and Dives. Interactive map, photos, ratings, and detailed info.';

/**
 * Sanitize data for safe inclusion in JSON-LD scripts
 * Prevents XSS by escaping dangerous characters and removing control chars
 */
function sanitizeForJSON(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')        // Escape ampersands
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForJSON);
  }

  if (obj && typeof obj === 'object') {
    // Prevent prototype pollution
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous prototype keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeForJSON(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Safely stringify schema for inclusion in script tags
 * Use this instead of JSON.stringify() for all schema.org data
 */
export function safeStringifySchema(schema: any): string {
  return JSON.stringify(sanitizeForJSON(schema));
}

// Type definitions for Schema.org structured data
interface SchemaOrgBase {
  '@context': string;
  '@type': string | string[];
}

interface SchemaOrgOrganization extends SchemaOrgBase {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

interface SchemaOrgWebSite extends SchemaOrgBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

interface SchemaOrgPostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

interface SchemaOrgGeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

interface SchemaOrgAggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
}

interface SchemaOrgRestaurant extends SchemaOrgBase {
  '@type': ['Restaurant', 'LocalBusiness'];
  name: string;
  description: string;
  url: string;
  address: SchemaOrgPostalAddress;
  geo?: SchemaOrgGeoCoordinates;
  telephone?: string;
  sameAs?: string[];
  aggregateRating?: SchemaOrgAggregateRating;
  priceRange?: string;
  image?: string[];
  servesCuisine?: string[];
}

interface SchemaOrgBreadcrumbListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

interface SchemaOrgBreadcrumbList extends SchemaOrgBase {
  '@type': 'BreadcrumbList';
  itemListElement: SchemaOrgBreadcrumbListItem[];
}

interface SchemaOrgItemList extends SchemaOrgBase {
  '@type': 'ItemList';
  name: string;
  url: string;
  numberOfItems: number;
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    item: Record<string, any>;
  }>;
}

/**
 * Organization schema for the site itself
 */
export function generateOrganizationSchema(): SchemaOrgOrganization {
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
export function generateWebSiteSchema(): SchemaOrgWebSite {
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
export function generateRestaurantSchema(restaurant: Restaurant): SchemaOrgRestaurant {
  const schema: SchemaOrgRestaurant = {
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

  // Link to restaurant's external website using sameAs (not url - that's for our page)
  if (restaurant.website_url) {
    schema.sameAs = [restaurant.website_url];
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

  // Note: openingHoursSpecification removed - only add when actual hours data is available
  // Empty openingHoursSpecification triggers validation warnings

  return schema;
}

/**
 * BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): SchemaOrgBreadcrumbList {
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
): SchemaOrgItemList {
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
    url: `${SITE_URL}/episode/${episode.slug}`,
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

/**
 * LocalBusiness aggregate schema for city pages
 */
export function generateCityBusinessSchema(
  cityName: string,
  stateName: string,
  stateAbbr: string,
  restaurants: Restaurant[]
): any {
  const openCount = restaurants.filter(r => r.status === 'open').length;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Diners, Drive-ins and Dives Restaurants in ${cityName}`,
    description: `${openCount} restaurants from Guy Fieri's show in ${cityName}, ${stateName}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityName,
      addressRegion: stateAbbr,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: cityName,
      containedInPlace: {
        '@type': 'State',
        name: stateName,
      },
    },
  };
}

/**
 * FAQ schema for state pages
 */
export function generateStateFAQSchema(
  stateName: string,
  totalRestaurants: number,
  openRestaurants: number,
  topCities: Array<{ name: string; count: number }>
): any {
  const closedCount = totalRestaurants - openRestaurants;
  const topCityNames = topCities.slice(0, 3).map(c => c.name).join(', ');

  // Grammar fixes for singular/plural
  const openText = openRestaurants === 1 ? 'is currently open' : 'are currently open';
  const closedText = closedCount === 0
    ? 'All are still operating'
    : closedCount === 1
      ? '1 has closed'
      : `${closedCount} have closed`;

  const cityText = topCityNames
    ? `The cities with the most restaurants are: ${topCityNames}.`
    : 'Restaurants are distributed across multiple cities in the state.';

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many Diners, Drive-ins and Dives restaurants are in ${stateName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are ${totalRestaurants} restaurants featured on Guy Fieri's show in ${stateName}. ${openRestaurants} ${openText} and ${closedText}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which cities in ${stateName} have the most DDD restaurants?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: cityText,
        },
      },
      {
        '@type': 'Question',
        name: `Are all DDD restaurants in ${stateName} still open?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `No, ${openRestaurants} out of ${totalRestaurants} are still open. We verify status regularly.`,
        },
      },
    ],
  };
}

