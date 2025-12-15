'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CityAutocomplete from '@/components/roadtrip/CityAutocomplete';
import type { City } from '@/lib/cityMatcher';
import type { Episode } from '@/lib/supabase';
import { Car, MapPin, Flag, ArrowUpDown, Sparkles, ChevronRight, Search } from 'lucide-react';

const EPISODE_ROTATE_INTERVAL = 5000; // 5 seconds

// Valid radius options (must match SearchForm and route detail page)
const ALLOWED_RADIUS = [10, 25, 50, 100] as const;

interface RoadTripAPIResponse {
  slug?: string;
  cached?: boolean;
  error?: string;
}

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
  const [radiusMiles, setRadiusMiles] = useState(25);
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

    try {
      const response = await fetch('/api/roadtrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination })
      });

      const data: RoadTripAPIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to plan route');
      }

      // Validate slug is a non-empty string
      if (typeof data.slug === 'string' && data.slug.length > 0) {
        // Validate radius is an allowed value
        const safeRadius = ALLOWED_RADIUS.includes(radiusMiles as typeof ALLOWED_RADIUS[number])
          ? radiusMiles
          : 25;
        router.push(`/route/${data.slug}?radius=${safeRadius}`);
      } else {
        throw new Error('Failed to generate route');
      }
    } catch (err) {
      console.error('Road trip error:', err);
      // Fall back to roadtrip page on error
      setIsLoading(false);
    }
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
            <Car className="hero-badge-icon" />
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
                <Sparkles className="hero-newest-badge-icon" />
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
                <ChevronRight strokeWidth={3} />
              </div>
            </Link>
          )}
        </div>

        <div className="hero-roadtrip-right">
          <form onSubmit={handleSubmit} className="hero-search-form">
            <div className="hero-form-accent" />

            <div className="hero-form-row hero-form-row-locations">
              {/* Origin */}
              <div className="hero-form-field">
                <label className="hero-form-label">
                  <MapPin className="hero-form-label-icon" />
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
                <ArrowUpDown strokeWidth={2.5} />
              </button>

              {/* Destination */}
              <div className="hero-form-field">
                <label className="hero-form-label">
                  <Flag className="hero-form-label-icon" />
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
                min="0"
                max="3"
                step="1"
                value={[10, 25, 50, 100].indexOf(radiusMiles)}
                onChange={(e) => setRadiusMiles([10, 25, 50, 100][Number(e.target.value)])}
                className="hero-radius-slider"
                disabled={isLoading}
              />
              <div className="hero-radius-labels">
                <span>10 mi</span>
                <span>25</span>
                <span>50</span>
                <span>100 mi</span>
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
                  <Search className="hero-submit-icon" />
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
