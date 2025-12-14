'use client';

import { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { RestaurantWithEpisodes, MapPin, Episode } from '@/lib/supabase';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Search } from 'lucide-react';

interface HomePageProps {
  initialRestaurants: RestaurantWithEpisodes[];
  stats: { restaurants: number; episodes: number; cities: number };
  recentEpisodes: Episode[];
}

const RestaurantMapPins = dynamic(() => import('@/components/RestaurantMapPins'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-loading-spinner"></div>
      <span>Loading map...</span>
    </div>
  )
});

export default function HomePage({ initialRestaurants, stats, recentEpisodes }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithEpisodes | null>(null);
  const [hoveredRestaurant, setHoveredRestaurant] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [restaurants, setRestaurants] = useState<RestaurantWithEpisodes[]>(initialRestaurants);
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    async function fetchMapPins() {
      try {
        const response = await fetch('/api/restaurants/map-pins');
        if (!response.ok) throw new Error('Failed to fetch map pins');
        const data = await response.json();
        setMapPins(data);
      } catch (error) {
        console.error('Error loading map pins:', error);
      } finally {
        setIsMapLoading(false);
      }
    }
    fetchMapPins();
  }, []);

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    if (deferredSearchQuery) {
      const query = deferredSearchQuery.toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.city.toLowerCase().includes(query) ||
        restaurant.state?.toLowerCase().includes(query)
      );
    }

    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter(r => r.price_tier === selectedPriceRange);
    }

    return filtered;
  }, [restaurants, deferredSearchQuery, selectedPriceRange]);

  const filteredPins = useMemo(() => {
    let filtered = mapPins;

    if (deferredSearchQuery) {
      const query = deferredSearchQuery.toLowerCase();
      filtered = filtered.filter(pin =>
        pin.name.toLowerCase().includes(query) ||
        pin.city.toLowerCase().includes(query)
      );
    }

    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter(pin => pin.price_tier === selectedPriceRange);
    }

    return filtered;
  }, [deferredSearchQuery, selectedPriceRange, mapPins]);

  const handleRestaurantClick = (restaurant: RestaurantWithEpisodes) => {
    setSelectedRestaurant(restaurant);
  };

  return (
    <div className="app-container">
      <Header currentPage="home" />

      {/* Hero Section - Inline, matching chefs */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Find DDD Restaurants
            </h1>
            <p className="hero-subtitle">
              Diners, Drive-ins and Dives with Guy Fieri
            </p>
            <dl className="hero-stats-row">
              <div className="hero-stat-item">
                <dt className="sr-only">Number of restaurants</dt>
                <dd className="hero-stat-number" aria-label={`${stats.restaurants} restaurants`}>{stats.restaurants}</dd>
                <dd className="hero-stat-label" aria-hidden="true">Restaurants</dd>
              </div>
              <div className="hero-stat-item">
                <dt className="sr-only">Number of episodes</dt>
                <dd className="hero-stat-number" aria-label={`${stats.episodes} episodes`}>{stats.episodes}</dd>
                <dd className="hero-stat-label" aria-hidden="true">Episodes</dd>
              </div>
              <div className="hero-stat-item">
                <dt className="sr-only">Number of cities</dt>
                <dd className="hero-stat-number" aria-label={`${stats.cities} cities`}>{stats.cities}</dd>
                <dd className="hero-stat-label" aria-hidden="true">Cities</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Featured Episode Section - If we have a recent episode */}
      {recentEpisodes.length > 0 && (
        <section
          className="featured-episode-hero relative overflow-hidden"
          style={{
            background: 'var(--slate-900)',
            borderTop: '3px solid var(--accent-primary)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                RECENT EPISODES • {recentEpisodes.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentEpisodes.slice(0, 4).map((episode) => (
                <Link
                  key={episode.id}
                  href={`/episode/${episode.slug}`}
                  className="group block p-6 rounded transition-all hover:shadow-lg"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div className="mb-3">
                    <span
                      className="font-mono text-xs font-bold px-2 py-1 rounded"
                      style={{ background: 'var(--accent-primary)', color: 'white' }}
                    >
                      S{episode.season}E{episode.episode_number}
                    </span>
                  </div>
                  <h3
                    className="font-display text-lg font-bold mb-2 group-hover:text-[var(--accent-primary)] transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {episode.title}
                  </h3>
                  {episode.air_date && (
                    <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(episode.air_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map Layout */}
      <main className="desktop-map-layout" id="main-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">{filteredRestaurants.length} Restaurants</h1>
            <p className="sidebar-subtitle">From Diners, Drive-ins and Dives</p>
          </div>

          <div className="sidebar-search">
            <label htmlFor="restaurant-search" className="sr-only">
              Search restaurants and cities
            </label>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref={searchInputRef}
              id="restaurant-search"
              type="text"
              placeholder="Search restaurants, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
              aria-label="Search restaurants and cities"
            />
          </div>

          <div className="restaurant-list">
            {filteredRestaurants.slice(0, visibleCount).map((restaurant, index) => (
              <div
                key={restaurant.id}
                className={`homepage-card-wrapper ${selectedRestaurant?.id === restaurant.id ? 'selected' : ''} ${hoveredRestaurant === restaurant.id ? 'hovered' : ''}`}
                onClick={() => handleRestaurantClick(restaurant)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRestaurantClick(restaurant);
                  }
                }}
                onMouseEnter={() => setHoveredRestaurant(restaurant.id)}
                onMouseLeave={() => setHoveredRestaurant(null)}
                role="button"
                tabIndex={0}
                aria-label={`View ${restaurant.name} in ${restaurant.city}`}
              >
                <RestaurantCardCompact restaurant={restaurant} index={index} />
              </div>
            ))}
            {visibleCount < filteredRestaurants.length && (
              <div className="px-4 pb-4 flex flex-col items-center gap-2">
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + 20, filteredRestaurants.length))}
                  className="load-more-button"
                  aria-label={`Load ${Math.min(20, filteredRestaurants.length - visibleCount)} more restaurants`}
                >
                  LOAD MORE
                </button>
                <span className="text-xs italic" style={{ color: 'var(--text-muted)' }} aria-live="polite">
                  {filteredRestaurants.length - visibleCount} remaining
                </span>
              </div>
            )}
          </div>
        </aside>

        <section className="map-section">
          <div className="map-filters-overlay">
            <label htmlFor="price-filter" className="sr-only">
              Filter by price range
            </label>
            <select
              id="price-filter"
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="map-filter-select"
              aria-label="Filter restaurants by price range"
            >
              <option value="all">All Prices</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </div>

          <RestaurantMapPins
            pins={filteredPins}
            selectedPinId={selectedRestaurant?.id}
            isLoading={isMapLoading}
          />
        </section>
      </main>

      {/* Browse Section - matching chefs "Browse by Show" */}
      <section className="shows-showcase">
        <div className="shows-showcase-container">
          <div className="shows-showcase-header">
            <div className="shows-showcase-title-group">
              <h2 className="shows-showcase-title">Browse Locations</h2>
            </div>
          </div>
          <div className="shows-showcase-grid">
            <Link
              href="/states"
              className="shows-showcase-card"
              style={{ animationDelay: '0ms' }}
            >
              <div className="shows-showcase-card-accent" />
              <div className="shows-showcase-card-content">
                <div className="shows-showcase-card-header">
                  <h3 className="shows-showcase-card-name">By State</h3>
                </div>
                <div className="shows-showcase-card-stats">
                  <div className="shows-showcase-stat">
                    <span className="shows-showcase-stat-value">{stats.restaurants}</span>
                    <span className="shows-showcase-stat-label">Restaurants</span>
                  </div>
                </div>
                <div className="shows-showcase-card-cta">
                  <span>Explore</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/episodes"
              className="shows-showcase-card"
              style={{ animationDelay: '80ms' }}
            >
              <div className="shows-showcase-card-accent" />
              <div className="shows-showcase-card-content">
                <div className="shows-showcase-card-header">
                  <h3 className="shows-showcase-card-name">By Episode</h3>
                </div>
                <div className="shows-showcase-card-stats">
                  <div className="shows-showcase-stat">
                    <span className="shows-showcase-stat-value">{stats.episodes}</span>
                    <span className="shows-showcase-stat-label">Episodes</span>
                  </div>
                </div>
                <div className="shows-showcase-card-cta">
                  <span>Explore</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/restaurants"
              className="shows-showcase-card"
              style={{ animationDelay: '160ms' }}
            >
              <div className="shows-showcase-card-accent" />
              <div className="shows-showcase-card-content">
                <div className="shows-showcase-card-header">
                  <h3 className="shows-showcase-card-name">All Restaurants</h3>
                </div>
                <div className="shows-showcase-card-stats">
                  <div className="shows-showcase-stat">
                    <span className="shows-showcase-stat-value">{stats.restaurants}</span>
                    <span className="shows-showcase-stat-label">Restaurants</span>
                  </div>
                </div>
                <div className="shows-showcase-card-cta">
                  <span>Explore</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/about"
              className="shows-showcase-card"
              style={{ animationDelay: '240ms' }}
            >
              <div className="shows-showcase-card-accent" />
              <div className="shows-showcase-card-content">
                <div className="shows-showcase-card-header">
                  <h3 className="shows-showcase-card-name">About DDD</h3>
                </div>
                <div className="shows-showcase-card-stats">
                  <div className="shows-showcase-stat">
                    <span className="shows-showcase-stat-value">{stats.cities}</span>
                    <span className="shows-showcase-stat-label">Cities</span>
                  </div>
                </div>
                <div className="shows-showcase-card-cta">
                  <span>Learn More</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
