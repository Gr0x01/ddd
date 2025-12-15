'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { RouteCache } from '@/lib/supabase';

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
                  {route.map_image_url ? (
                    <Image
                      src={route.map_image_url}
                      alt={`Map of ${route.title || `${route.origin_text} to ${route.destination_text}`}`}
                      width={600}
                      height={300}
                      className="route-card-map-image"
                    />
                  ) : (
                    <div className="route-card-map-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{distanceMiles} mi</span>
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
