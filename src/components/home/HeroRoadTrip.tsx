'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CityAutocomplete from '@/components/roadtrip/CityAutocomplete';
import type { City } from '@/lib/cityMatcher';
import type { Episode } from '@/lib/supabase';

const EPISODE_ROTATE_INTERVAL = 5000; // 5 seconds

interface HeroRoadTripProps {
  cities: City[];
  totalRestaurants: number;
  verifiedOpen: number;
  recentEpisodes?: Episode[];
}

export default function HeroRoadTrip({ cities, totalRestaurants, verifiedOpen, recentEpisodes = [] }: HeroRoadTripProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get the 3 most recent episodes
  const episodesToShow = recentEpisodes.slice(0, 3);

  // Auto-rotate episodes
  useEffect(() => {
    if (episodesToShow.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentEpisodeIndex((prev) => (prev + 1) % episodesToShow.length);
        setIsTransitioning(false);
      }, 300); // Match CSS transition duration
    }, EPISODE_ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [episodesToShow.length]);

  const currentEpisode = episodesToShow[currentEpisodeIndex];

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

          {/* Newest Episodes - Auto-rotating */}
          {currentEpisode && (
            <Link
              href={`/episode/${currentEpisode.slug}`}
              className={`hero-newest-episode ${isTransitioning ? 'hero-newest-transitioning' : ''}`}
            >
              <div className="hero-newest-badge">
                <svg className="hero-newest-badge-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.65 9.04l-4.84-.42-1.89-4.45c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.73 3.67-3.18c.67-.58.32-1.68-.56-1.75zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>
                </svg>
                <span className="hero-newest-badge-text">NEW</span>
              </div>
              <div className="hero-newest-content">
                <span className="hero-newest-episode-num">S{currentEpisode.season}E{currentEpisode.episode_number}</span>
                <h3 className="hero-newest-title">{currentEpisode.title}</h3>
                {currentEpisode.air_date && (
                  <span className="hero-newest-date">
                    {new Date(currentEpisode.air_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
              {/* Progress dots */}
              {episodesToShow.length > 1 && (
                <div className="hero-newest-dots">
                  {episodesToShow.map((_, idx) => (
                    <span
                      key={idx}
                      className={`hero-newest-dot ${idx === currentEpisodeIndex ? 'hero-newest-dot-active' : ''}`}
                    />
                  ))}
                </div>
              )}
              <div className="hero-newest-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </Link>
          )}
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
