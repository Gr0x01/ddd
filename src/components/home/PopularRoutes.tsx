'use client';

import Link from 'next/link';
import type { RouteCache } from '@/lib/supabase';
import RoutePreview from './RoutePreview';

// Map colors based on route index (cycling through theme)
const COLORS = ['red', 'yellow', 'cream'] as const;

interface PopularRoutesProps {
  routes: RouteCache[];
}

export default function PopularRoutes({ routes }: PopularRoutesProps) {
  if (routes.length === 0) return null;

  return (
    <section className="popular-routes">
      <div className="popular-routes-container">
        <div className="popular-routes-header">
          <h2 className="popular-routes-title">Popular Routes</h2>
          <p className="popular-routes-subtitle">
            Curated road trips featuring the best Diners, Drive-ins & Dives spots
          </p>
        </div>

        <div className="popular-routes-grid">
          {routes.map((route, index) => {
            const color = COLORS[index % COLORS.length];
            const distanceMiles = Math.round(route.distance_meters / 1609.34);
            const durationHours = Math.round(route.duration_seconds / 3600 * 10) / 10;

            return (
              <Link
                key={route.id}
                href={`/route/${route.slug}`}
                className={`route-card route-card-${color}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="route-card-stripe" />

                <div className="route-card-header">
                  <div className="route-card-from">{route.origin_text.split(',')[0]}</div>
                  <div className="route-card-arrow">→</div>
                  <div className="route-card-to">{route.destination_text.split(',')[0]}</div>
                </div>

                <div className="route-card-map">
                  {route.polyline_points && Array.isArray(route.polyline_points) ? (
                    <RoutePreview
                      polylinePoints={route.polyline_points as Array<{ lat: number; lng: number }>}
                      originText={route.origin_text}
                      destinationText={route.destination_text}
                    />
                  ) : (
                    <div className="route-card-map-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12h18M12 3v18M9 9l-3 3 3 3M15 9l3 3-3 3"/>
                      </svg>
                      <span>{distanceMiles} mi • {durationHours} hrs</span>
                    </div>
                  )}
                </div>

                {route.description && (
                  <div className="route-card-highlight">{route.description.split('.')[0]}</div>
                )}

                <div className="route-card-cta">
                  <span>VIEW ROUTE</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
