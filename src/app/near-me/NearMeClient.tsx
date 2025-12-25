'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';

interface NearbyRestaurant {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  latitude: number;
  longitude: number;
  price_tier: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  photo_url: string | null;
  photos: string[] | null;
  cuisines: Array<{ name: string; slug: string }>;
}

interface RestaurantWithDistance extends NearbyRestaurant {
  distance: number; // miles
}

interface NearMeClientProps {
  restaurants: NearbyRestaurant[];
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearMeClient({ restaurants }: NearMeClientProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [nearbyRestaurants, setNearbyRestaurants] = useState<RestaurantWithDistance[]>([]);
  const [radiusMiles, setRadiusMiles] = useState<number>(50);
  const [showAll, setShowAll] = useState(false);

  const findNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Calculate distances for all restaurants
        const restaurantsWithDistance = restaurants.map((r) => ({
          ...r,
          distance: calculateDistance(latitude, longitude, r.latitude, r.longitude),
        }));

        // Sort by distance
        restaurantsWithDistance.sort((a, b) => a.distance - b.distance);

        setNearbyRestaurants(restaurantsWithDistance);
        setStatus('success');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMessage('Location access was denied. Please enable location services to find restaurants near you.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus('error');
          setErrorMessage('Unable to determine your location. Please try again.');
        } else if (error.code === error.TIMEOUT) {
          setStatus('error');
          setErrorMessage('Location request timed out. Please try again.');
        } else {
          setStatus('error');
          setErrorMessage('An error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache location for 5 minutes
      }
    );
  }, [restaurants]);

  // Filter restaurants within radius
  const filteredRestaurants = nearbyRestaurants.filter((r) => r.distance <= radiusMiles);
  const displayedRestaurants = showAll ? filteredRestaurants : filteredRestaurants.slice(0, 12);

  return (
    <>
      {/* Location Action Section */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {status === 'idle' && (
          <div className="text-center">
            <button
              onClick={findNearby}
              className="inline-flex items-center gap-3 font-ui font-bold text-lg px-8 py-4 rounded-full transition-all hover:scale-105"
              style={{ background: 'var(--ddd-yellow)', color: '#1A1A1D' }}
            >
              <Navigation className="w-6 h-6" />
              Find Restaurants Near Me
            </button>
            <p className="font-ui text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
              We&apos;ll use your location to find the closest Triple D spots
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--ddd-yellow)' }} />
            <span className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              Getting your location...
            </span>
          </div>
        )}

        {(status === 'error' || status === 'denied') && (
          <div className="max-w-md mx-auto text-center">
            <div
              className="flex items-start gap-3 p-4 rounded-lg mb-4 text-left"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="font-ui font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Location Access Needed
                </p>
                <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              onClick={findNearby}
              className="inline-flex items-center gap-2 font-ui font-semibold px-6 py-3 rounded-full transition-all hover:scale-105"
              style={{ background: 'var(--ddd-yellow)', color: '#1A1A1D' }}
            >
              <Navigation className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}
      </section>

      {/* Results Section */}
      {status === 'success' && (
        <main className="max-w-6xl mx-auto px-4 pb-12">
          {/* Radius Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                {filteredRestaurants.length} restaurants within {radiusMiles} miles
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-mono text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                Radius
              </label>
              <select
                value={radiusMiles}
                onChange={(e) => {
                  setRadiusMiles(Number(e.target.value));
                  setShowAll(false);
                }}
                className="font-mono text-sm px-3 py-1.5 rounded border-0"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value={10}>10 mi</option>
                <option value={25}>25 mi</option>
                <option value={50}>50 mi</option>
                <option value={100}>100 mi</option>
                <option value={250}>250 mi</option>
                <option value={500}>500 mi</option>
              </select>
            </div>
          </div>

          {/* Restaurant Grid */}
          {filteredRestaurants.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="relative">
                    <RestaurantCardCompact
                      restaurant={{
                        ...restaurant,
                        status: 'open' as const,
                      }}
                    />
                    {/* Distance Badge */}
                    <div
                      className="absolute top-3 right-3 font-mono text-xs font-bold px-2 py-1 rounded"
                      style={{ background: 'rgba(26, 26, 29, 0.85)', color: '#fff' }}
                    >
                      {restaurant.distance < 1
                        ? `${(restaurant.distance * 5280).toFixed(0)} ft`
                        : `${restaurant.distance.toFixed(1)} mi`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More Button */}
              {!showAll && filteredRestaurants.length > 12 && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setShowAll(true)}
                    className="font-mono text-sm px-6 py-3 rounded-full transition-colors"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    SHOW ALL {filteredRestaurants.length} →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="font-ui text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
                No restaurants found within {radiusMiles} miles.
              </p>
              <button
                onClick={() => setRadiusMiles(Math.min(radiusMiles * 2, 500))}
                className="font-ui font-semibold px-6 py-3 rounded-full transition-colors"
                style={{ background: 'var(--ddd-yellow)', color: '#1A1A1D' }}
              >
                Expand to {Math.min(radiusMiles * 2, 500)} Miles
              </button>
            </div>
          )}
        </main>
      )}

      {/* Fallback: Browse by State */}
      {status === 'idle' && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Or Browse by State
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { name: 'California', slug: 'california' },
              { name: 'Texas', slug: 'texas' },
              { name: 'Florida', slug: 'florida' },
              { name: 'New York', slug: 'new-york' },
              { name: 'Nevada', slug: 'nevada' },
              { name: 'Arizona', slug: 'arizona' },
              { name: 'Oregon', slug: 'oregon' },
              { name: 'Ohio', slug: 'ohio' },
              { name: 'Colorado', slug: 'colorado' },
              { name: 'Georgia', slug: 'georgia' },
              { name: 'Washington', slug: 'washington' },
              { name: 'Illinois', slug: 'illinois' },
            ].map((state) => (
              <Link
                key={state.slug}
                href={`/state/${state.slug}`}
                className="p-3 rounded-lg text-center transition-all hover:scale-105"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <span className="font-ui font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {state.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
