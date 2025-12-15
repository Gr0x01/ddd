import Link from 'next/link';
import Image from 'next/image';
import { Navigation } from 'lucide-react';

interface RestaurantCardOverlayProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    city: string;
    state?: string | null;
    status: 'open' | 'closed' | 'unknown' | string;
    photos?: string[] | null;
    distance_miles?: number | null;
  };
  index?: number;
  hideStatus?: boolean;
}

// Filter photos to only include valid URL strings
function getFirstPhoto(photos: string[] | null | undefined): string | null {
  if (!photos || !Array.isArray(photos)) return null;
  const validPhoto = photos.find(
    (photo): photo is string => typeof photo === 'string' && photo.startsWith('http')
  );
  return validPhoto || null;
}

function formatDistance(miles: number): string {
  if (miles < 1) {
    return `${Math.round(miles * 10) / 10} mi`;
  }
  return `${Math.round(miles)} mi`;
}

export function RestaurantCardOverlay({ restaurant, index = 0, hideStatus = false }: RestaurantCardOverlayProps) {
  const photoUrl = getFirstPhoto(restaurant.photos);
  const isOpen = restaurant.status === 'open';
  const isClosed = restaurant.status === 'closed';

  return (
    <Link
      href={`/restaurant/${restaurant.slug}`}
      className="restaurant-more-card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="restaurant-more-card-image">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={restaurant.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={`restaurant-more-card-img ${isClosed ? 'restaurant-more-card-img--closed' : ''}`}
          />
        ) : (
          <div className="restaurant-more-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        )}

        {/* Status badge - hidden when grouped by status */}
        {!hideStatus && isOpen && (
          <span className="restaurant-more-card-status">OPEN</span>
        )}
        {!hideStatus && isClosed && (
          <span className="restaurant-more-card-status restaurant-more-card-status-closed">CLOSED</span>
        )}

        {/* Distance badge for route pages */}
        {typeof restaurant.distance_miles === 'number' && (
          <div className="restaurant-more-card-distance">
            <Navigation size={10} />
            <span>{formatDistance(restaurant.distance_miles)}</span>
          </div>
        )}

        <div className="restaurant-more-card-overlay" />
        <div className="restaurant-more-card-content">
          <h3 className={`restaurant-more-card-name ${isClosed ? 'line-through opacity-70' : ''}`}>
            {restaurant.name}
          </h3>
          <p className="restaurant-more-card-location">{restaurant.city}</p>
        </div>
      </div>
    </Link>
  );
}
