'use client';

import { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { RestaurantWithEpisodes, MapPin, Episode } from '@/lib/supabase';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { HeroSection } from '@/components/homepage/HeroSection';
import { BrowseSection } from '@/components/homepage/BrowseSection';
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

  const visibleRestaurants = filteredRestaurants.slice(0, visibleCount);

  return (
    <>
      <Header />
      <main>
        <HeroSection
          stats={stats}
          onSearchFocus={() => searchInputRef.current?.focus()}
        />

        {/* Map + Search Section */}
        <section className="map-section">
          <div className="map-container">
            <div className="map-wrapper">
              {!isMapLoading && (
                <RestaurantMapPins
                  pins={mapPins}
                  selectedPinId={selectedRestaurant?.id}
                  onPinSelect={(pin) => {
                    const restaurant = restaurants.find(r => r.id === pin.id);
                    setSelectedRestaurant(restaurant || null);
                  }}
                  isLoading={isMapLoading}
                />
              )}
            </div>

            <div className="map-sidebar">
              <div className="search-header">
                <div className="search-container">
                  <Search className="search-icon" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search restaurants, cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="price-filter"
                >
                  <option value="all">All Prices</option>
                  <option value="$">$ - Budget</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Upscale</option>
                  <option value="$$$$">$$$$ - Fine Dining</option>
                </select>
              </div>

              <div className="results-header">
                <h2>{filteredRestaurants.length} Restaurants</h2>
              </div>

              <div className="restaurant-list">
                {isLoading ? (
                  <div className="loading-state">Loading restaurants...</div>
                ) : visibleRestaurants.length === 0 ? (
                  <div className="empty-state">
                    <p>No restaurants found</p>
                  </div>
                ) : (
                  <>
                    {visibleRestaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        onMouseEnter={() => setHoveredRestaurant(restaurant.id)}
                        onMouseLeave={() => setHoveredRestaurant(null)}
                      >
                        <RestaurantCardCompact restaurant={restaurant} />
                      </div>
                    ))}

                    {visibleCount < filteredRestaurants.length && (
                      <button
                        onClick={() => setVisibleCount(prev => prev + 20)}
                        className="load-more-button"
                      >
                        Load more ({filteredRestaurants.length - visibleCount} remaining)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Browse Section */}
        <BrowseSection stats={stats} />

        {/* Recent Episodes */}
        {recentEpisodes.length > 0 && (
          <section className="recent-episodes-section">
            <div className="container">
              <h2>Recent Episodes</h2>
              <div className="episode-grid">
                {recentEpisodes.map((episode) => (
                  <Link
                    key={episode.id}
                    href={`/episode/${episode.slug}`}
                    className="episode-card"
                  >
                    <div className="episode-number">
                      S{episode.season}E{episode.episode_number}
                    </div>
                    <h3>{episode.title}</h3>
                    {episode.air_date && (
                      <p className="episode-date">
                        {new Date(episode.air_date).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
