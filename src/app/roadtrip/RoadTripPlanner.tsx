'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchForm from '@/components/roadtrip/SearchForm';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import type { City } from '@/lib/cityMatcher';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface RoadTripState {
  origin: string;
  destination: string;
  radiusMiles: number;
  isLoading: boolean;
  error: string | null;
}

interface RoadTripAPIResponse {
  slug?: string;
  cached?: boolean;
  error?: string;
}

// Valid radius options (must match SearchForm and route detail page)
const ALLOWED_RADIUS = [10, 25, 50, 100] as const;

export default function RoadTripPlanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [state, setState] = useState<RoadTripState>({
    origin: '',
    destination: '',
    radiusMiles: 25,
    isLoading: false,
    error: null,
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

    if (origin && destination && !citiesLoading) {
      setState(prev => ({
        ...prev,
        origin,
        destination,
      }));
    }
  }, [searchParams, citiesLoading]);

  const planRoute = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/roadtrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: state.origin,
          destination: state.destination,
        })
      });

      const data: RoadTripAPIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to plan route');
      }

      // Validate slug is a non-empty string
      if (typeof data.slug === 'string' && data.slug.length > 0) {
        // Validate radius is an allowed value
        const safeRadius = ALLOWED_RADIUS.includes(state.radiusMiles as typeof ALLOWED_RADIUS[number])
          ? state.radiusMiles
          : 25;
        router.push(`/route/${data.slug}?radius=${safeRadius}`);
      } else {
        throw new Error('Failed to generate route');
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to plan route',
        isLoading: false
      }));
    }
  };

  return (
    <>
      {/* Custom Hero - Road Trip Planner */}
      <section className="roadtrip-hero">
        <div className="roadtrip-hero-stripe" />
        <div className="roadtrip-hero-pattern" />

        <div className="roadtrip-hero-container">
          {/* Breadcrumbs */}
          <div className="roadtrip-hero-breadcrumbs">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Road Trip' }
              ]}
              className="[&_a]:text-[#1A1A1D]/60 [&_a:hover]:text-[#1A1A1D] [&_span]:text-[#1A1A1D] [&_svg]:text-[#1A1A1D]/30"
            />
          </div>

          <div className="roadtrip-hero-grid">
            {/* Left Column - Title */}
            <div className="roadtrip-hero-left">
              <h1 className="roadtrip-hero-title">
                Road Trip Planner
              </h1>

              <p className="roadtrip-hero-description">
                Find <strong>Diners, Drive-ins and Dives</strong> restaurants along your route. Enter your start and end points to discover Guy Fieri-approved spots on the way.
              </p>
            </div>

            {/* Right Column - Search Form */}
            <div className="roadtrip-hero-right">
              {citiesLoading ? (
                <div
                  className="hero-search-form"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px' }}
                >
                  <div className="hero-form-accent" />
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
                <div className="hero-search-form">
                  <div className="hero-form-accent" />
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--accent-primary)' }}
                    >
                      <AlertTriangle className="w-5 h-5 text-white" />
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
                    background: 'white',
                    border: '2px solid var(--accent-primary)'
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                  <p className="font-body" style={{ color: 'var(--text-primary)' }}>{state.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="roadtrip-hero-accent" />
      </section>

      <main id="main-content" style={{ background: 'var(--bg-primary)' }} className="roadtrip-main">
        {/* Attribution */}
        <section className="py-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <p className="font-mono text-[13px] tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
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
