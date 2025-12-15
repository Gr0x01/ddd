'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '../seo/Breadcrumbs';
import { Check, X, MapPin, Star, ExternalLink, Phone, Maximize2, Tv } from 'lucide-react';

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
              className="[&_a]:text-[#1A1A1D]/60 [&_a:hover]:text-[#1A1A1D] [&_span]:text-[#1A1A1D] [&_svg]:text-[#1A1A1D]/30"
            />
          </div>
        )}

        <div className="restaurant-hero-content">
          {/* Left side - Main info */}
          <div className="restaurant-hero-main">
            {/* Status Badge */}
            <div className={`restaurant-hero-status ${status.isOpen ? 'status-open' : status.isClosed ? 'status-closed' : 'status-unknown'}`}>
              {status.isOpen && (
                <Check className="restaurant-hero-status-icon" strokeWidth={3} />
              )}
              {status.isClosed && (
                <X className="restaurant-hero-status-icon" strokeWidth={3} />
              )}
              <span>{status.displayStatus}</span>
            </div>

            {/* Restaurant Name */}
            <h1 className="restaurant-hero-name">
              {restaurant.name}
            </h1>

            {/* Location */}
            <p className="restaurant-hero-location">
              <MapPin className="restaurant-hero-location-icon" />
              {locationText}
            </p>

            {/* Rating and Price */}
            <div className="restaurant-hero-meta">
              {restaurant.google_rating && (
                <div className="restaurant-hero-rating">
                  <Star className="restaurant-hero-rating-star" fill="currentColor" strokeWidth={0} />
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
                  <MapPin />
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
                  <ExternalLink />
                  WEBSITE
                </a>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="restaurant-hero-button secondary">
                  <Phone />
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
                  <Maximize2 />
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
              <Tv />
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
