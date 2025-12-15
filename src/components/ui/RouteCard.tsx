import Link from 'next/link';
import { Hamburger, Car } from 'lucide-react';
import type { RouteCache, RouteWithRestaurantCount } from '@/lib/supabase';

interface RouteCardProps {
  route: RouteCache | RouteWithRestaurantCount;
  index?: number;
  compact?: boolean;
}

export function RouteCard({
  route,
  index = 0,
  compact = false,
}: RouteCardProps) {
  const distanceMiles = Math.round(route.distance_meters / 1609.34);
  const href = route.slug ? `/route/${route.slug}` : `/roadtrip?origin=${encodeURIComponent(route.origin_text)}&destination=${encodeURIComponent(route.destination_text)}`;

  return (
    <Link
      href={href}
      className={compact ? 'route-card-compact' : 'route-card'}
      style={{ animationDelay: `${index * (compact ? 50 : 100)}ms` }}
    >
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
            <Hamburger className="route-card-stat-icon" size={16} />
            <span className="route-card-stat-value">{'restaurant_count' in route ? route.restaurant_count : '?'}</span>
            <span className="route-card-stat-label">stops</span>
          </div>
          <div className="route-card-stat-divider" />
          <div className="route-card-stat">
            <Car className="route-card-stat-icon" size={16} />
            <span className="route-card-stat-value">{distanceMiles}</span>
            <span className="route-card-stat-label">mi</span>
          </div>
        </div>

        {/* Description - only for full cards */}
        {!compact && route.description && (
          <p className="route-card-description">
            {route.description.split('.')[0]}
          </p>
        )}

        {/* CTA - only for full cards */}
        {!compact && (
          <div className="route-card-cta">
            <span>EXPLORE ROUTE</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        )}
      </div>
    </Link>
  );
}
