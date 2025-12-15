'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CityAutocomplete from '@/components/roadtrip/CityAutocomplete';
import type { City } from '@/lib/cityMatcher';

interface HeroRoadTripProps {
  cities: City[];
  totalRestaurants: number;
  verifiedOpen: number;
}

const QUICK_ROUTES = [
  { from: 'San Francisco, CA', to: 'Los Angeles, CA', label: 'SF → LA', restaurants: 42 },
  { from: 'New York, NY', to: 'Boston, MA', label: 'NYC → Boston', restaurants: 28 },
  { from: 'Chicago, IL', to: 'Milwaukee, WI', label: 'Chicago → Milwaukee', restaurants: 15 },
  { from: 'Austin, TX', to: 'San Antonio, TX', label: 'Austin → SA', restaurants: 12 },
];

export default function HeroRoadTrip({ cities, totalRestaurants, verifiedOpen }: HeroRoadTripProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setIsLoading(true);
    // Navigate to road trip page with params
    const params = new URLSearchParams({
      origin,
      destination,
      radius: radiusMiles.toString(),
    });
    router.push(`/roadtrip?${params.toString()}`);
  }, [origin, destination, radiusMiles, router]);

  const loadQuickRoute = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <section className="hero-roadtrip">
      {/* Top racing stripe */}
      <div className="hero-stripe-top" />

      <div className="hero-roadtrip-container">
        <div className="hero-roadtrip-left">
          <div className="hero-badge">
            <svg className="hero-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z"/>
              <circle cx="7.5" cy="17.5" r="1.5"/>
              <circle cx="16.5" cy="17.5" r="1.5"/>
            </svg>
            <span className="hero-badge-text">PLAN YOUR TRIP</span>
          </div>

          <h1 className="hero-roadtrip-title">
            Find Diners, Drive-ins & Dives
            <br />
            <span className="hero-roadtrip-title-accent">On Your Route</span>
          </h1>

          <p className="hero-roadtrip-subtitle">
            <strong>{totalRestaurants.toLocaleString()}</strong> Diners, Drive-ins & Dives locations
            <span className="hero-subtitle-divider">•</span>
            <strong className="text-green">{verifiedOpen.toLocaleString()}</strong> verified open
          </p>

          {/* Quick Routes */}
          <div className="hero-quick-routes">
            <p className="hero-quick-label">Popular Routes:</p>
            <div className="hero-quick-buttons">
              {QUICK_ROUTES.map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => loadQuickRoute(route.from, route.to)}
                  className="hero-quick-button"
                >
                  <span className="hero-quick-button-label">{route.label}</span>
                  <span className="hero-quick-button-count">{route.restaurants}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-roadtrip-right">
          <form onSubmit={handleSubmit} className="hero-search-form">
            <div className="hero-form-accent" />

            <div className="hero-form-row">
              {/* Origin */}
              <div className="hero-form-field">
                <label className="hero-form-label">
                  <svg className="hero-form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  START
                </label>
                <CityAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  placeholder="San Francisco, CA"
                  disabled={isLoading}
                  cities={cities}
                />
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={swapLocations}
                disabled={!origin || !destination}
                className="hero-swap-button"
                title="Swap locations"
                aria-label="Swap origin and destination"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                  <path d="M17 8V20M17 20L21 16M17 20L13 16" />
                </svg>
              </button>
            </div>

            <div className="hero-form-row">
              {/* Destination */}
              <div className="hero-form-field">
                <label className="hero-form-label">
                  <svg className="hero-form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  END
                </label>
                <CityAutocomplete
                  value={destination}
                  onChange={setDestination}
                  placeholder="Los Angeles, CA"
                  disabled={isLoading}
                  cities={cities}
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="hero-form-radius">
              <div className="hero-radius-header">
                <label htmlFor="radius" className="hero-form-label-small">
                  SEARCH RADIUS
                </label>
                <span className="hero-radius-value">{radiusMiles} MILES</span>
              </div>
              <input
                type="range"
                id="radius"
                min="5"
                max="25"
                step="5"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="hero-radius-slider"
                disabled={isLoading}
              />
              <div className="hero-radius-labels">
                <span>5 mi</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>25 mi</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !origin || !destination}
              className="hero-submit-button"
            >
              {isLoading ? (
                <>
                  <span className="hero-submit-spinner" />
                  PLANNING ROUTE...
                </>
              ) : (
                <>
                  <svg className="hero-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 11h18M3 11a2 2 0 0 0 0 4h18a2 2 0 0 0 0-4M5 15v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>
                    <path d="M5 11V9a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
                  </svg>
                  FIND RESTAURANTS
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
