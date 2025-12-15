'use client';

import Link from 'next/link';
import type { RouteCache } from '@/lib/supabase';
import RoutePreview from './RoutePreview';

interface PopularRoutesProps {
  routes: RouteCache[];
}

export default function PopularRoutes({ routes }: PopularRoutesProps) {
  if (routes.length === 0) return null;

  return (
    <section className="popular-routes">
      {/* Racing stripe accent */}
      <div className="popular-routes-stripe" />

      <div className="popular-routes-container">
        <div className="popular-routes-header">
          <h2 className="popular-routes-title">
            Popular <span className="popular-routes-title-accent">Road Trips</span>
          </h2>
          <p className="popular-routes-subtitle">
            Curated routes featuring the best Diners, Drive-ins & Dives spots
          </p>
        </div>

        <div className="popular-routes-grid">
          {routes.map((route, index) => {
            const distanceMiles = Math.round(route.distance_meters / 1609.34);
            const durationHours = Math.round(route.duration_seconds / 3600 * 10) / 10;

            return (
              <Link
                key={route.id}
                href={`/route/${route.slug}`}
                className="route-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Route map preview */}
                <div className="route-card-map">
                  {route.polyline_points && Array.isArray(route.polyline_points) ? (
                    <RoutePreview
                      polylinePoints={route.polyline_points as Array<{ lat: number; lng: number }>}
                      originText={route.origin_text}
                      destinationText={route.destination_text}
                    />
                  ) : (
                    <div className="route-card-map-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Route info */}
                <div className="route-card-content">
                  {/* Cities */}
                  <div className="route-card-cities">
                    <div className="route-card-city">
                      <span className="route-card-city-name">{route.origin_text.split(',')[0]}</span>
                    </div>
                    <div className="route-card-connector">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                    <div className="route-card-city">
                      <span className="route-card-city-name">{route.destination_text.split(',')[0]}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="route-card-stats">
                    <div className="route-card-stat">
                      <svg className="route-card-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      <span className="route-card-stat-value">{durationHours}</span>
                      <span className="route-card-stat-label">hrs</span>
                    </div>
                    <div className="route-card-stat-divider" />
                    <div className="route-card-stat">
                      <svg className="route-card-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z"/>
                        <circle cx="7.5" cy="17.5" r="1.5"/>
                        <circle cx="16.5" cy="17.5" r="1.5"/>
                      </svg>
                      <span className="route-card-stat-value">{distanceMiles}</span>
                      <span className="route-card-stat-label">mi</span>
                    </div>
                  </div>

                  {/* Description */}
                  {route.description && (
                    <p className="route-card-description">
                      {route.description.split('.')[0]}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="route-card-cta">
                    <span>EXPLORE ROUTE</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all CTA */}
        <div className="popular-routes-cta">
          <Link href="/roadtrip" className="popular-routes-view-all">
            <span>PLAN YOUR OWN TRIP</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
