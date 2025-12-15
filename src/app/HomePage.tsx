'use client';

import type { RestaurantWithEpisodes, Episode, RouteCache } from '@/lib/supabase';
import type { City } from '@/lib/cityMatcher';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import HeroRoadTrip from '@/components/home/HeroRoadTrip';
import PopularRoutes from '@/components/home/PopularRoutes';
import IconicSpots from '@/components/home/IconicSpots';
import Link from 'next/link';
import { MapPin, Tv, CheckCircle, Car, ArrowRight } from 'lucide-react';

interface HomePageProps {
  iconicRestaurants: RestaurantWithEpisodes[];
  stats: { restaurants: number; openRestaurants: number; episodes: number; cities: number };
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
  const verifiedOpen = stats.openRestaurants;

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
                <MapPin />
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">By State</h3>
                <p className="browse-card-stat">{stats.restaurants} restaurants</p>
              </div>
              <div className="browse-card-arrow">
                <ArrowRight strokeWidth={3} />
              </div>
            </Link>

            <Link href="/episodes" className="browse-card browse-card-episodes">
              <div className="browse-card-icon">
                <Tv />
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">By Episode</h3>
                <p className="browse-card-stat">{stats.episodes} episodes</p>
              </div>
              <div className="browse-card-arrow">
                <ArrowRight strokeWidth={3} />
              </div>
            </Link>

            <Link href="/still-open" className="browse-card browse-card-open">
              <div className="browse-card-icon">
                <CheckCircle />
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">Still Open</h3>
                <p className="browse-card-stat">{verifiedOpen} verified</p>
              </div>
              <div className="browse-card-arrow">
                <ArrowRight strokeWidth={3} />
              </div>
            </Link>

            <Link href="/roadtrip" className="browse-card browse-card-roadtrip">
              <div className="browse-card-icon">
                <Car />
              </div>
              <div className="browse-card-content">
                <h3 className="browse-card-title">Road Trip</h3>
                <p className="browse-card-stat">{stats.cities} cities</p>
              </div>
              <div className="browse-card-arrow">
                <ArrowRight strokeWidth={3} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
