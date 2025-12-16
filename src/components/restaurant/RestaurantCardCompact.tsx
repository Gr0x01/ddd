import Link from 'next/link';
import Image from 'next/image';
import { getRestaurantStatus } from '@/lib/utils/restaurant';
import { UtensilsCrossed, Star, MapPin } from 'lucide-react';

// Filter photos to only include valid URL strings
function getFirstPhoto(photos: string[] | null | undefined): string | null {
  if (!photos || !Array.isArray(photos)) return null;
  const validPhoto = photos.find(
    (photo): photo is string => typeof photo === 'string' && photo.startsWith('http')
  );
  return validPhoto || null;
}

interface RestaurantCardCompactProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    city: string;
    state?: string | null;
    price_tier?: string | null;
    cuisine_tags?: string[] | null;
    status: 'open' | 'closed' | 'unknown';
    google_rating?: number | null;
    google_review_count?: number | null;
    photo_url?: string | null;
    photos?: string[] | null;
    chef?: {
      name: string;
      slug: string;
      james_beard_status?: 'semifinalist' | 'nominated' | 'winner' | null;
      chef_shows?: Array<{
        result?: 'winner' | 'finalist' | 'contestant' | 'judge' | null;
        is_primary?: boolean;
      }>;
    } | null;
  };
  index?: number;
  asButton?: boolean;
}

export function RestaurantCardCompact({ restaurant, index = 0, asButton = false }: RestaurantCardCompactProps) {
  const isPriority = index < 6;
  const status = getRestaurantStatus(restaurant.status);

  // Use photos array, filtering to only valid URL strings
  const photoUrl = getFirstPhoto(restaurant.photos);

  const content = (
    <>
      {/* Square image area */}
      <div className="mini-card-image-wrapper" data-closed={status.isClosed ? "true" : undefined}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={restaurant.name}
            fill
            className="mini-card-image"
            loading={isPriority ? undefined : "lazy"}
            priority={isPriority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={60}
          />
        ) : (
          <div className="mini-card-placeholder">
            <UtensilsCrossed className="mini-card-placeholder-icon" strokeWidth={1.5} />
          </div>
        )}

        {/* Price badge */}
        {restaurant.price_tier && (
          <span className={`mini-card-price ${status.isClosed ? 'mini-card-price-closed' : ''}`}>
            {restaurant.price_tier}
          </span>
        )}

        {/* Closed overlay */}
        {status.isClosed && (
          <div className="mini-card-closed-overlay">
            <span className="mini-card-closed-text">CLOSED</span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="mini-card-content">
        <h3 className={`mini-card-name ${status.isClosed ? 'line-through' : ''}`}>
          {restaurant.name}
        </h3>

        <div className="mini-card-location">
          <MapPin className="mini-card-location-icon" />
          <span>{restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}</span>
        </div>

        {/* Rating and tags row */}
        <div className="mini-card-meta">
          {restaurant.google_rating && (
            <div className="mini-card-rating">
              <Star className="mini-card-star" fill="currentColor" strokeWidth={0} />
              <span>{restaurant.google_rating}</span>
            </div>
          )}
          {restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0 && (
            <span className="mini-card-cuisine">
              {restaurant.cuisine_tags[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardClass = `mini-card group ${status.isClosed ? 'mini-card-closed' : ''}`;
  const ariaLabel = `${restaurant.name} in ${restaurant.city}${restaurant.state ? `, ${restaurant.state}` : ''} - ${status.isClosed ? 'Closed' : 'Open'}`;

  if (asButton) {
    return (
      <div
        className={cardClass}
        style={{ animationDelay: `${index * 30}ms` }}
        aria-label={ariaLabel}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/restaurant/${restaurant.slug}`}
      className={cardClass}
      style={{ animationDelay: `${index * 30}ms` }}
      aria-label={ariaLabel}
    >
      {content}
    </Link>
  );
}
