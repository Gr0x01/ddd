'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '../seo/Breadcrumbs';

function getRestaurantStatus(status: 'open' | 'closed' | 'unknown') {
  if (status === 'open') {
    return { displayStatus: 'OPEN', isOpen: true, isClosed: false };
  } else if (status === 'closed') {
    return { displayStatus: 'PERMANENTLY CLOSED', isOpen: false, isClosed: true };
  }
  return { displayStatus: 'STATUS UNKNOWN', isOpen: false, isClosed: false };
}

interface Episode {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  slug: string;
}

interface Cuisine {
  id: string;
  name: string;
}

interface RestaurantHeroProps {
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  restaurant: {
    name: string;
    address?: string | null;
    city: string;
    state?: string | null;
    country?: string | null;
    price_tier?: string | null;
    status: 'open' | 'closed' | 'unknown';
    google_rating?: number | null;
    google_review_count?: number | null;
    photos?: string[] | null;
    description?: string | null;
    phone?: string | null;
    website_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    updated_at?: string;
    episodes?: Episode[];
    cuisines?: Cuisine[];
  };
}

export function RestaurantHero({ restaurant, breadcrumbItems }: RestaurantHeroProps) {
  const status = getRestaurantStatus(restaurant.status);

  // Filter photos to only include valid URL strings
  const photos = (restaurant.photos || [])
    .filter(Boolean)
    .filter((photo): photo is string => typeof photo === 'string' && photo.startsWith('http'));
  const hasPhoto = photos.length > 0;

  const locationText = [restaurant.city, restaurant.state].filter(Boolean).join(', ');

  return (
    <section className="restaurant-hero">
      {/* Racing stripe top */}
      <div className="restaurant-hero-stripe" />

      {/* Diagonal stripe background pattern */}
      <div className="restaurant-hero-pattern" />

      <div className="restaurant-hero-container">
        {/* Breadcrumbs */}
        {breadcrumbItems && (
          <div className="restaurant-hero-breadcrumbs">
            <Breadcrumbs
              items={breadcrumbItems}
              className="[&_a]:text-white/50 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/30"
            />
          </div>
        )}

        <div className="restaurant-hero-content">
          {/* Left side - Main info */}
          <div className="restaurant-hero-main">
            {/* Status Badge */}
            <div className={`restaurant-hero-status ${status.isOpen ? 'status-open' : status.isClosed ? 'status-closed' : 'status-unknown'}`}>
              {status.isOpen && (
                <svg className="restaurant-hero-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
              {status.isClosed && (
                <svg className="restaurant-hero-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              )}
              <span>{status.displayStatus}</span>
            </div>

            {/* Restaurant Name */}
            <h1 className="restaurant-hero-name">
              {restaurant.name}
            </h1>

            {/* Location */}
            <p className="restaurant-hero-location">
              <svg className="restaurant-hero-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {locationText}
            </p>

            {/* Rating and Price */}
            <div className="restaurant-hero-meta">
              {restaurant.google_rating && (
                <div className="restaurant-hero-rating">
                  <svg className="restaurant-hero-rating-star" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="restaurant-hero-rating-value">{restaurant.google_rating}</span>
                  {restaurant.google_review_count && (
                    <span className="restaurant-hero-rating-count">
                      ({restaurant.google_review_count.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              {restaurant.price_tier && (
                <span className="restaurant-hero-price">{restaurant.price_tier}</span>
              )}
            </div>

            {/* Cuisines */}
            {restaurant.cuisines && restaurant.cuisines.length > 0 && (
              <div className="restaurant-hero-cuisines">
                {restaurant.cuisines.map((cuisine) => (
                  <span key={cuisine.id} className="restaurant-hero-cuisine-tag">
                    {cuisine.name}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="restaurant-hero-actions">
              {restaurant.latitude && restaurant.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="restaurant-hero-button primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  GET DIRECTIONS
                </a>
              )}
              {restaurant.website_url && (
                <a
                  href={restaurant.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="restaurant-hero-button secondary"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  WEBSITE
                </a>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="restaurant-hero-button secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {restaurant.phone}
                </a>
              )}
            </div>
          </div>

          {/* Right side - Photo */}
          {hasPhoto && (
            <div className="restaurant-hero-photo-wrapper">
              <a
                href={photos[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="restaurant-hero-photo"
                aria-label="View photo in full size"
              >
                <Image
                  src={photos[0]}
                  alt={restaurant.name}
                  fill
                  className="restaurant-hero-photo-img"
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority
                />
                <div className="restaurant-hero-photo-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </div>
              </a>
              {photos.length > 1 && (
                <span className="restaurant-hero-photo-count">
                  +{photos.length - 1} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Episodes Section */}
        {restaurant.episodes && restaurant.episodes.length > 0 && (
          <div className="restaurant-hero-episodes">
            <span className="restaurant-hero-episodes-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
              FEATURED ON
            </span>
            <div className="restaurant-hero-episodes-list">
              {restaurant.episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/episode/${episode.slug}`}
                  className="restaurant-hero-episode-link"
                >
                  <span className="restaurant-hero-episode-number">
                    S{episode.season}E{episode.episode_number}
                  </span>
                  <span className="restaurant-hero-episode-title">
                    {episode.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="restaurant-hero-bottom-accent" />
    </section>
  );
}
