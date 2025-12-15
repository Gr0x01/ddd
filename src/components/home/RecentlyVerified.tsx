'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { RestaurantWithEpisodes } from '@/lib/supabase';

interface RecentlyVerifiedProps {
  restaurants: RestaurantWithEpisodes[];
}

export default function RecentlyVerified({ restaurants }: RecentlyVerifiedProps) {
  return (
    <section className="recently-verified">
      <div className="recently-verified-container">
        <div className="recently-verified-header">
          <div className="recently-verified-badge">
            <svg className="recently-verified-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span className="recently-verified-badge-text">VERIFIED OPEN</span>
          </div>
          <h2 className="recently-verified-title">
            Confirmed
            <br />
            <span className="recently-verified-title-accent">Still Serving</span>
          </h2>
          <p className="recently-verified-subtitle">
            These restaurants were verified within the last 30 days
          </p>
        </div>

        <div className="recently-verified-grid">
          {restaurants.slice(0, 8).map((restaurant, index) => (
            <Link
              key={restaurant.id}
              href={`/restaurant/${restaurant.slug}`}
              className="verified-card"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Image */}
              <div className="verified-card-image">
                {restaurant.photos && restaurant.photos.length > 0 ? (
                  <Image
                    src={restaurant.photos[0]}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="verified-card-img"
                  />
                ) : (
                  <div className="verified-card-placeholder">
                    <svg className="verified-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                )}

                {/* Open Badge */}
                <div className="verified-open-badge">
                  <svg className="verified-open-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span className="verified-open-text">OPEN</span>
                </div>

                {/* Price Tier */}
                {restaurant.price_tier && (
                  <div className="verified-price-badge">{restaurant.price_tier}</div>
                )}
              </div>

              {/* Content */}
              <div className="verified-card-content">
                <h3 className="verified-card-name">{restaurant.name}</h3>

                <p className="verified-card-location">
                  {restaurant.city}, {restaurant.state}
                </p>

                {restaurant.cuisines && restaurant.cuisines.length > 0 && (
                  <div className="verified-card-cuisines">
                    {restaurant.cuisines.slice(0, 2).map((cuisine) => (
                      <span key={cuisine.id} className="verified-cuisine-tag">
                        {cuisine.name}
                      </span>
                    ))}
                    {restaurant.cuisines.length > 2 && (
                      <span className="verified-cuisine-more">
                        +{restaurant.cuisines.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {restaurant.guy_quote && (
                  <p className="verified-card-quote">"{restaurant.guy_quote}"</p>
                )}

                <div className="verified-card-meta">
                  <svg className="verified-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span className="verified-meta-text">
                    Verified {restaurant.last_verified ? new Date(restaurant.last_verified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'recently'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="recently-verified-cta">
          <Link href="/still-open" className="verified-view-all-button">
            <span>VIEW ALL OPEN RESTAURANTS</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
