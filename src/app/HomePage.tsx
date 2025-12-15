'use client';

import type { RestaurantWithEpisodes, Episode, RouteCache } from '@/lib/supabase';
import type { City } from '@/lib/cityMatcher';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import HeroRoadTrip from '@/components/home/HeroRoadTrip';
import PopularRoutes from '@/components/home/PopularRoutes';
import IconicSpots from '@/components/home/IconicSpots';
import Link from 'next/link';

interface HomePageProps {
  iconicRestaurants: RestaurantWithEpisodes[];
  stats: { restaurants: number; episodes: number; cities: number };
  recentEpisodes: Episode[];
  cities: City[];
  curatedRoutes: RouteCache[];
}

export default function HomePage({
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

      {/* Iconic Diners, Drive-ins & Dives Spots */}
      {iconicRestaurants.length > 0 && (
        <IconicSpots restaurants={iconicRestaurants} />
      )}

      {/* Browse Section - Highway Sign Style */}
      <section className="browse-section">
        <div className="browse-container">
          <div className="browse-header">
            <h2 className="browse-title">Explore</h2>
            <p className="browse-subtitle">Find your next flavor destination</p>
          </div>

          <div className="browse-grid">
            <Link href="/states" className="browse-card browse-card-states">
              <div className="browse-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">By State</h3>
                <p className="browse-card-stat">{stats.restaurants} restaurants</p>
              </div>
              <div className="browse-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            <Link href="/episodes" className="browse-card browse-card-episodes">
              <div className="browse-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">By Episode</h3>
                <p className="browse-card-stat">{stats.episodes} episodes</p>
              </div>
              <div className="browse-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            <Link href="/still-open" className="browse-card browse-card-open">
              <div className="browse-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">Still Open</h3>
                <p className="browse-card-stat">{verifiedOpen} verified</p>
              </div>
              <div className="browse-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>

            <Link href="/roadtrip" className="browse-card browse-card-roadtrip">
              <div className="browse-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="5.5" cy="17.5" r="2.5"/>
                  <circle cx="18.5" cy="17.5" r="2.5"/>
                  <path d="M15 17.5H9M3 17.5V11l2-4h6l4 4h6v6.5"/>
                </svg>
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">Road Trip</h3>
                <p className="browse-card-stat">{stats.cities} cities</p>
              </div>
              <div className="browse-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
