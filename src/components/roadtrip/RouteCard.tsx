import Link from 'next/link';
import { RouteWithRestaurantCount } from '@/lib/supabase';
import { MapPin, Clock, Navigation, ChevronRight, Utensils } from 'lucide-react';

interface RouteCardProps {
  route: RouteWithRestaurantCount;
  index?: number;
  variant?: 'featured' | 'compact';
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '0 mi';
  const miles = Math.round(meters / 1609.34);
  return `${miles} mi`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours}h ${minutes}m`;
}

function getOriginCity(text: string): string {
  return text.split(',')[0].trim();
}

function getDestinationCity(text: string): string {
  return text.split(',')[0].trim();
}

export function RouteCard({ route, index = 0, variant = 'compact' }: RouteCardProps) {
  const originCity = getOriginCity(route.origin_text);
  const destCity = getDestinationCity(route.destination_text);
  const href = route.slug ? `/route/${route.slug}` : `/roadtrip?origin=${encodeURIComponent(route.origin_text)}&destination=${encodeURIComponent(route.destination_text)}`;

  if (variant === 'featured') {
    return (
      <Link
        href={href}
        className="route-card-featured group"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Curated badge */}
        {route.is_curated && (
          <div className="route-card-badge">POPULAR</div>
        )}

        {/* Route visualization */}
        <div className="route-card-visual">
          <div className="route-card-dot route-card-dot-start" />
          <div className="route-card-line" />
          <div className="route-card-dot route-card-dot-end" />
        </div>

        {/* Route info */}
        <div className="route-card-cities">
          <div className="route-card-city">
            <span className="route-card-city-label">FROM</span>
            <span className="route-card-city-name">{originCity}</span>
          </div>
          <div className="route-card-arrow">
            <ChevronRight size={20} strokeWidth={3} />
          </div>
          <div className="route-card-city">
            <span className="route-card-city-label">TO</span>
            <span className="route-card-city-name">{destCity}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="route-card-stats">
          <div className="route-card-stat">
            <Navigation size={14} />
            <span>{formatDistance(route.distance_meters)}</span>
          </div>
          <div className="route-card-stat">
            <Clock size={14} />
            <span>{formatDuration(route.duration_seconds)}</span>
          </div>
          <div className="route-card-stat route-card-stat-highlight">
            <Utensils size={14} />
            <span>{route.restaurant_count} stops</span>
          </div>
        </div>

        {/* Description if available */}
        {route.description && (
          <p className="route-card-description">{route.description}</p>
        )}

        {/* Hover effect */}
        <div className="route-card-hover-indicator">
          VIEW ROUTE <ChevronRight size={14} />
        </div>
      </Link>
    );
  }

  // Compact variant for user-generated routes
  return (
    <Link
      href={href}
      className="route-card-compact group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="route-card-compact-main">
        <div className="route-card-compact-route">
          <MapPin size={14} className="route-card-compact-icon" />
          <span className="route-card-compact-origin">{originCity}</span>
          <span className="route-card-compact-arrow">→</span>
          <span className="route-card-compact-dest">{destCity}</span>
        </div>

        <div className="route-card-compact-meta">
          <span>{formatDistance(route.distance_meters)}</span>
          <span className="route-card-compact-separator">•</span>
          <span>{formatDuration(route.duration_seconds)}</span>
          <span className="route-card-compact-separator">•</span>
          <span className="route-card-compact-restaurants">
            {route.restaurant_count} restaurants
          </span>
        </div>
      </div>

      <ChevronRight size={18} className="route-card-compact-chevron" />
    </Link>
  );
}
