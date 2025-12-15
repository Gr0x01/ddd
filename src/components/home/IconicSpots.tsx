'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { RestaurantWithEpisodes } from '@/lib/supabase';

// Filter photos to only include valid URL strings
function getFirstPhoto(photos: string[] | null | undefined): string | null {
  if (!photos || !Array.isArray(photos)) return null;
  const validPhoto = photos.find(
    (photo): photo is string => typeof photo === 'string' && photo.startsWith('http')
  );
  return validPhoto || null;
}

interface IconicSpotsProps {
  restaurants: RestaurantWithEpisodes[];
}

export default function IconicSpots({ restaurants }: IconicSpotsProps) {
  return (
    <section className="iconic-spots">
      <div className="iconic-spots-container">
        <div className="iconic-spots-header">
          <div className="iconic-badge">
            <svg className="iconic-badge-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="iconic-badge-text">LEGENDARY</span>
          </div>
          <h2 className="iconic-spots-title">
            <span className="iconic-spots-title-accent">Diners, Drive-ins & Dives Destinations</span>
          </h2>
          <p className="iconic-spots-subtitle">
            Hand-picked legendary spots every fan should experience
          </p>
        </div>

        <div className="iconic-spots-grid">
          {restaurants.slice(0, 10).map((restaurant, index) => {
            const photoUrl = getFirstPhoto(restaurant.photos);
            return (
            <Link
              key={restaurant.id}
              href={`/restaurant/${restaurant.slug}`}
              className="iconic-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Image */}
              <div className="iconic-card-image">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="iconic-card-img"
                  />
                ) : (
                  <div className="iconic-card-placeholder">
                    <svg className="iconic-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                )}

                {/* Legendary Badge */}
                <div className="iconic-legendary-badge">
                  <svg className="iconic-legendary-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>

                {/* Overlay gradient */}
                <div className="iconic-card-overlay" />

                {/* Text overlay */}
                <div className="iconic-card-overlay-content">
                  <h3 className="iconic-card-name">{restaurant.name}</h3>
                  <p className="iconic-card-location">
                    {restaurant.city}, {restaurant.state}
                  </p>
                </div>
              </div>

              {/* Guy quote on hover */}
              {restaurant.guy_quote && (
                <div className="iconic-card-quote-hover">
                  <p className="iconic-quote-text">"{restaurant.guy_quote}"</p>
                  <span className="iconic-quote-author">— Guy Fieri</span>
                </div>
              )}
            </Link>
          );
          })}
        </div>
      </div>
    </section>
  );
}
