'use client';

import dynamic from 'next/dynamic';
import type { RestaurantWithEpisodes, Episode, RouteCache } from '@/lib/supabase';
import type { City } from '@/lib/cityMatcher';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import HeroRoadTrip from '@/components/home/HeroRoadTrip';
import PopularRoutes from '@/components/home/PopularRoutes';
import RecentlyVerified from '@/components/home/RecentlyVerified';
import IconicSpots from '@/components/home/IconicSpots';
import Link from 'next/link';

// Dynamically import the newest episode display from the original
const RestaurantMapPins = dynamic(() => import('@/components/RestaurantMapPins'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-loading-spinner"></div>
      <span>Loading map...</span>
    </div>
  )
});

interface HomePageProps {
  initialRestaurants: RestaurantWithEpisodes[];
  recentlyVerified: RestaurantWithEpisodes[];
  iconicRestaurants: RestaurantWithEpisodes[];
  stats: { restaurants: number; episodes: number; cities: number };
  recentEpisodes: Episode[];
  cities: City[];
  curatedRoutes: RouteCache[];
}

export default function HomePage({
  initialRestaurants,
  recentlyVerified,
  iconicRestaurants,
  stats,
  recentEpisodes,
  cities,
  curatedRoutes
}: HomePageProps) {
  const verifiedOpen = stats.restaurants; // Will be updated to actual verified count

  return (
    <div className="app-container">
      <Header currentPage="home" />

      {/* NEW HERO - Road Trip Planner */}
      <HeroRoadTrip
        cities={cities}
        totalRestaurants={stats.restaurants}
        verifiedOpen={verifiedOpen}
        recentEpisodes={recentEpisodes}
      />

      {/* Popular Routes */}
      <PopularRoutes routes={curatedRoutes} />

      {/* Recently Verified Open */}
      {recentlyVerified.length > 0 && (
        <RecentlyVerified restaurants={recentlyVerified} />
      )}

      {/* Iconic Diners, Drive-ins & Dives Spots */}
      {iconicRestaurants.length > 0 && (
        <IconicSpots restaurants={iconicRestaurants} />
      )}

      {/* Browse Section - Keep from original */}
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
              href="/still-open"
              className="shows-showcase-card"
              style={{ animationDelay: '160ms' }}
            >
              <div className="shows-showcase-card-accent" />
              <div className="shows-showcase-card-content">
                <div className="shows-showcase-card-header">
                  <h3 className="shows-showcase-card-name">Still Open</h3>
                </div>
                <div className="shows-showcase-card-stats">
                  <div className="shows-showcase-stat">
                    <span className="shows-showcase-stat-value">{verifiedOpen}</span>
                    <span className="shows-showcase-stat-label">Verified</span>
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
              href="/roadtrip"
              className="shows-showcase-card"
              style={{ animationDelay: '240ms' }}
            >
              <div className="shows-showcase-card-accent" />
              <div className="shows-showcase-card-content">
                <div className="shows-showcase-card-header">
                  <h3 className="shows-showcase-card-name">Plan a Road Trip</h3>
                </div>
                <div className="shows-showcase-card-stats">
                  <div className="shows-showcase-stat">
                    <span className="shows-showcase-stat-value">{stats.cities}</span>
                    <span className="shows-showcase-stat-label">Cities</span>
                  </div>
                </div>
                <div className="shows-showcase-card-cta">
                  <span>Start Planning</span>
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
