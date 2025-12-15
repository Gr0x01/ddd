'use client';

import Link from 'next/link';

interface PopularRoute {
  slug: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  restaurants: number;
  highlight: string;
  color: 'red' | 'yellow' | 'cream';
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    slug: 'sf-to-la',
    from: 'San Francisco',
    to: 'Los Angeles',
    distance: '382 miles',
    duration: '5.5 hours',
    restaurants: 42,
    highlight: 'Pacific Coast classics',
    color: 'red',
  },
  {
    slug: 'nyc-to-boston',
    from: 'New York',
    to: 'Boston',
    distance: '215 miles',
    duration: '3.7 hours',
    restaurants: 28,
    highlight: 'Northeast food tour',
    color: 'yellow',
  },
  {
    slug: 'chicago-to-milwaukee',
    from: 'Chicago',
    to: 'Milwaukee',
    distance: '92 miles',
    duration: '1.5 hours',
    restaurants: 15,
    highlight: 'Midwest comfort food',
    color: 'cream',
  },
  {
    slug: 'austin-to-san-antonio',
    from: 'Austin',
    to: 'San Antonio',
    distance: '80 miles',
    duration: '1.3 hours',
    restaurants: 12,
    highlight: 'Texas BBQ heaven',
    color: 'red',
  },
  {
    slug: 'portland-to-seattle',
    from: 'Portland',
    to: 'Seattle',
    distance: '174 miles',
    duration: '2.8 hours',
    restaurants: 18,
    highlight: 'Pacific Northwest gems',
    color: 'yellow',
  },
  {
    slug: 'miami-to-key-west',
    from: 'Miami',
    to: 'Key West',
    distance: '166 miles',
    duration: '3.5 hours',
    restaurants: 10,
    highlight: 'Florida Keys seafood',
    color: 'cream',
  },
];

export default function PopularRoutes() {
  return (
    <section className="popular-routes">
      <div className="popular-routes-container">
        <div className="popular-routes-header">
          <div className="popular-routes-title-group">
            <div className="popular-routes-accent" />
            <h2 className="popular-routes-title">Popular Routes</h2>
          </div>
          <p className="popular-routes-subtitle">
            Curated road trips featuring the best Triple D spots
          </p>
        </div>

        <div className="popular-routes-grid">
          {POPULAR_ROUTES.map((route, index) => (
            <Link
              key={route.slug}
              href={`/route/${route.slug}`}
              className={`route-card route-card-${route.color}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="route-card-stripe" />

              <div className="route-card-header">
                <div className="route-card-from">{route.from}</div>
                <div className="route-card-arrow">→</div>
                <div className="route-card-to">{route.to}</div>
              </div>

              <div className="route-card-stats">
                <div className="route-stat">
                  <span className="route-stat-icon">📏</span>
                  <span className="route-stat-value">{route.distance}</span>
                </div>
                <div className="route-stat">
                  <span className="route-stat-icon">⏱</span>
                  <span className="route-stat-value">{route.duration}</span>
                </div>
              </div>

              <div className="route-card-restaurants">
                <span className="route-restaurants-count">{route.restaurants}</span>
                <span className="route-restaurants-label">RESTAURANTS</span>
              </div>

              <div className="route-card-highlight">{route.highlight}</div>

              <div className="route-card-cta">
                <span>VIEW ROUTE</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
