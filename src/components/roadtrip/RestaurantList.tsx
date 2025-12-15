'use client';

import { RestaurantNearRoute } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { UtensilsCrossed, Star, ChevronRight } from 'lucide-react';

interface RestaurantListProps {
  restaurants: RestaurantNearRoute[];
  selectedRestaurant: RestaurantNearRoute | null;
  onRestaurantSelect: (restaurant: RestaurantNearRoute) => void;
}

// Filter photos to only include valid URL strings
function getFirstPhoto(photos: string[] | null | undefined): string | null {
  if (!photos || !Array.isArray(photos)) return null;
  const validPhoto = photos.find(
    (photo): photo is string => typeof photo === 'string' && photo.startsWith('http')
  );
  return validPhoto || null;
}

export default function RestaurantList({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div
        className="p-8 text-center"
        style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}
      >
        <div
          className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <UtensilsCrossed className="w-8 h-8" style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
        </div>
        <p className="font-display text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          No Restaurants Found
        </p>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          Try increasing the search radius or choosing a different route.
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: '2px solid var(--border-light)' }}>
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
      >
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {restaurants.length} Restaurant{restaurants.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      {/* Restaurant List */}
      <div
        className="max-h-[600px] overflow-y-auto"
        style={{ background: 'var(--bg-primary)' }}
      >
        {restaurants.map((restaurant, index) => {
          const isSelected = selectedRestaurant?.id === restaurant.id;
          const isClosed = restaurant.status === 'closed';
          const photoUrl = getFirstPhoto(restaurant.photos);

          return (
            <div
              key={restaurant.id}
              role="button"
              tabIndex={0}
              onClick={() => onRestaurantSelect(restaurant)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRestaurantSelect(restaurant);
                }
              }}
              className="flex gap-4 p-4 cursor-pointer transition-all border-b"
              style={{
                borderColor: 'var(--border-light)',
                background: isSelected ? 'rgba(230, 57, 70, 0.08)' : 'var(--bg-primary)',
                borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                animationDelay: `${index * 30}ms`
              }}
            >
              {/* Image */}
              <div
                className="w-16 h-16 flex-shrink-0 overflow-hidden"
                style={{
                  filter: isClosed ? 'grayscale(100%) brightness(0.7)' : 'none'
                }}
              >
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={restaurant.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    sizes="64px"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <UtensilsCrossed className="w-6 h-6" style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${isClosed ? 'opacity-60' : ''}`}>
                {/* Name & Price Row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className={`font-display text-base font-bold truncate ${isClosed ? 'line-through' : ''}`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {restaurant.name}
                  </h3>
                  {isClosed ? (
                    <span
                      className="font-mono text-[10px] tracking-wider px-2 py-0.5 flex-shrink-0"
                      style={{ background: 'var(--text-muted)', color: 'white' }}
                    >
                      CLOSED
                    </span>
                  ) : restaurant.price_tier ? (
                    <span
                      className="font-mono text-xs flex-shrink-0"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {restaurant.price_tier}
                    </span>
                  ) : null}
                </div>

                {/* Location */}
                <p
                  className="font-mono text-[11px] tracking-wider uppercase mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {restaurant.city}, {restaurant.state}
                </p>

                {/* Meta Row: Distance, Rating, Status */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Distance Badge */}
                  <span
                    className="font-mono text-[10px] tracking-wider px-2 py-0.5"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {restaurant.distance_miles.toFixed(1)} MI
                  </span>

                  {/* Rating */}
                  {restaurant.google_rating && (
                    <div className="flex items-center gap-1">
                      <Star
                        className="w-3 h-3"
                        style={{ color: 'var(--accent-secondary)' }}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {restaurant.google_rating}
                      </span>
                    </div>
                  )}

                  {/* Open Status */}
                  {!isClosed && (
                    <span
                      className="font-mono text-[10px] tracking-wider px-2 py-0.5"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--accent-success)'
                      }}
                    >
                      OPEN
                    </span>
                  )}
                </div>

                {/* View Details Link */}
                <Link
                  href={`/restaurant/${restaurant.slug}`}
                  className="inline-flex items-center gap-1 font-mono text-[11px] tracking-wider mt-3 transition-colors"
                  style={{ color: 'var(--accent-primary)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  VIEW DETAILS
                  <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
