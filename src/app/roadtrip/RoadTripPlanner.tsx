'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import SearchForm from '@/components/roadtrip/SearchForm';
import RouteMap from '@/components/roadtrip/RouteMap';
import RestaurantList from '@/components/roadtrip/RestaurantList';
import { RestaurantNearRoute } from '@/lib/supabase';
import type { City } from '@/lib/cityMatcher';

interface RouteData {
  polyline: string;
  polylinePoints: Array<{ lat: number; lng: number }>;
  distanceMeters: number;
  durationSeconds: number;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

interface RoadTripState {
  origin: string;
  destination: string;
  radiusMiles: number;
  route: RouteData | null;
  restaurants: RestaurantNearRoute[];
  isLoading: boolean;
  error: string | null;
  selectedRestaurant: RestaurantNearRoute | null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return `${miles.toFixed(0)} mi`;
}

export default function RoadTripPlanner() {
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [state, setState] = useState<RoadTripState>({
    origin: '',
    destination: '',
    radiusMiles: 10,
    route: null,
    restaurants: [],
    isLoading: false,
    error: null,
    selectedRestaurant: null
  });

  // Load cities data on mount with abort controller
  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      try {
        const response = await fetch('/data/us-cities.min.json', {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to load cities: ${response.statusText}`);
        }

        const data = await response.json();
        setCities(data);
        setCitiesError(null);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to load city data';

        console.error('Failed to load cities:', error);
        setCitiesError(errorMessage);
      } finally {
        setCitiesLoading(false);
      }
    }

    loadCities();

    return () => {
      controller.abort();
    };
  }, []);

  // Check for URL params and set state if present
  useEffect(() => {
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const radius = searchParams.get('radius');

    if (origin && destination && !citiesLoading) {
      setState(prev => ({
        ...prev,
        origin,
        destination,
        radiusMiles: radius ? parseInt(radius, 10) : prev.radiusMiles
      }));
    }
  }, [searchParams, citiesLoading]);

  // Auto-submit when params are loaded from URL
  useEffect(() => {
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (origin && destination && state.origin && state.destination && !state.route && !state.isLoading && !citiesLoading) {
      planRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.origin, state.destination, citiesLoading]);

  const planRoute = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/roadtrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: state.origin,
          destination: state.destination,
          radiusMiles: state.radiusMiles
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to plan route');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        route: data.route,
        restaurants: data.restaurants,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to plan route',
        isLoading: false
      }));
    }
  };

  const clearRoute = () => {
    setState(prev => ({
      ...prev,
      route: null,
      restaurants: [],
      selectedRestaurant: null,
      error: null
    }));
  };

  return (
    <>
      <PageHero
        title="Road Trip Planner"
        subtitle="Find Guy Fieri-approved restaurants along your route"
        breadcrumbItems={[
          { label: 'Home', href: '/' },
          { label: 'Road Trip' }
        ]}
      />

      <main id="main-content" style={{ background: 'var(--bg-primary)' }}>
        {/* Search Form Section */}
        <section className="py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4">
            {citiesLoading ? (
              <div
                className="p-8 text-center"
                style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}
              >
                <div className="inline-flex items-center gap-3">
                  <div
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                  />
                  <span className="font-mono text-sm tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    LOADING CITY DATA...
                  </span>
                </div>
              </div>
            ) : citiesError ? (
              <div
                className="p-6"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--accent-primary)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Failed to Load City Data
                    </h3>
                    <p className="font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {citiesError}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="font-mono text-sm font-semibold tracking-wider px-4 py-2 transition-colors"
                      style={{
                        background: 'var(--accent-primary)',
                        color: 'white'
                      }}
                    >
                      RELOAD PAGE
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <SearchForm
                origin={state.origin}
                destination={state.destination}
                radiusMiles={state.radiusMiles}
                isLoading={state.isLoading}
                cities={cities}
                onOriginChange={(origin) => setState(prev => ({ ...prev, origin }))}
                onDestinationChange={(destination) => setState(prev => ({ ...prev, destination }))}
                onRadiusChange={(radiusMiles) => setState(prev => ({ ...prev, radiusMiles }))}
                onSubmit={planRoute}
              />
            )}

            {state.error && (
              <div
                className="mt-6 p-4 flex items-start gap-3"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--accent-primary)'
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-body" style={{ color: 'var(--text-primary)' }}>{state.error}</p>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        {state.route && (
          <section
            className="py-8 sm:py-12 border-t"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
          >
            <div className="max-w-6xl mx-auto px-4">
              {/* Route Summary */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Your Route
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="font-mono text-xs sm:text-sm tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {formatDistance(state.route.distanceMeters)}
                    </span>
                    <span style={{ color: 'var(--border-medium)' }}>•</span>
                    <span className="font-mono text-xs sm:text-sm tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {formatDuration(state.route.durationSeconds)}
                    </span>
                    <span style={{ color: 'var(--border-medium)' }}>•</span>
                    <span className="font-mono text-xs sm:text-sm tracking-wider font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {state.restaurants.length} STOP{state.restaurants.length !== 1 ? 'S' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={clearRoute}
                  className="font-mono text-xs tracking-wider px-4 py-2 transition-all hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-muted)',
                    border: '2px solid var(--border-light)'
                  }}
                >
                  CLEAR ROUTE
                </button>
              </div>

              {/* Map and List Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2">
                  <div style={{ border: '2px solid var(--border-light)' }}>
                    <RouteMap
                      route={state.route}
                      restaurants={state.restaurants}
                      selectedRestaurant={state.selectedRestaurant}
                      onRestaurantSelect={(restaurant) =>
                        setState(prev => ({ ...prev, selectedRestaurant: restaurant }))
                      }
                    />
                  </div>
                </div>

                {/* Restaurant List */}
                <div className="lg:col-span-1">
                  <RestaurantList
                    restaurants={state.restaurants}
                    selectedRestaurant={state.selectedRestaurant}
                    onRestaurantSelect={(restaurant) =>
                      setState(prev => ({ ...prev, selectedRestaurant: restaurant }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Attribution */}
        <section className="py-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <p className="font-mono text-[10px] tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              CITY DATA BY{' '}
              <a
                href="https://simplemaps.com/data/us-cities"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-[var(--accent-primary)]"
              >
                SIMPLEMAPS
              </a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
