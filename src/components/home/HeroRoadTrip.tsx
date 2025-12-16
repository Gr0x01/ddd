'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchForm from '@/components/roadtrip/SearchForm';
import type { City } from '@/lib/cityMatcher';
import type { Episode } from '@/lib/supabase';
import { Car, Sparkles, ChevronRight } from 'lucide-react';

const EPISODE_ROTATE_INTERVAL = 5000; // 5 seconds

// Valid radius options (must match SearchForm and route detail page)
const ALLOWED_RADIUS = [10, 25, 50, 100] as const;

interface RoadTripAPIResponse {
  slug?: string;
  cached?: boolean;
  error?: string;
}

interface HeroRoadTripProps {
  totalRestaurants: number;
  verifiedOpen: number;
  recentEpisodes?: Episode[];
}

export default function HeroRoadTrip({ totalRestaurants, verifiedOpen, recentEpisodes = [] }: HeroRoadTripProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Lazy load cities (US + Canada)
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoaded, setCitiesLoaded] = useState(false);

  // Get the 3 most recent episodes
  const episodesToShow = recentEpisodes.slice(0, 3);

  // Lazy load cities on mount
  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      try {
        const [usResponse, caResponse] = await Promise.all([
          fetch('/data/us-cities.min.json', { signal: controller.signal }),
          fetch('/data/ca-cities.min.json', { signal: controller.signal }).catch(() => null),
        ]);

        if (!usResponse.ok) return;

        const usCities: City[] = await usResponse.json();
        const caCities: City[] = caResponse?.ok ? await caResponse.json() : [];

        // Merge and sort by population
        const allCities = [...usCities, ...caCities].sort((a, b) => b.population - a.population);
        setCities(allCities);
      } catch (err) {
        // Silently fail - cities will just be empty
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load cities:', err);
        }
      } finally {
        setCitiesLoaded(true);
      }
    }

    loadCities();

    return () => controller.abort();
  }, []);

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

  const handleSubmit = useCallback(async () => {
    if (!origin || !destination) return;

    setIsLoading(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : 'Failed to plan route. Please try again.');
      setIsLoading(false);
    }
  }, [origin, destination, radiusMiles, router]);

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
          <SearchForm
            origin={origin}
            destination={destination}
            radiusMiles={radiusMiles}
            isLoading={isLoading}
            cities={cities}
            error={error}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onRadiusChange={setRadiusMiles}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </section>
  );
}
