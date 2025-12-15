'use client';

import Link from 'next/link';

// Simple route preview SVG generator
function RoutePreview({ from, to, fromCoords, toCoords, restaurants }: {
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  restaurants: number;
}) {
  // Calculate simple projection for visualization
  const padding = 20;
  const width = 300;
  const height = 180;

  const latMin = Math.min(fromCoords.lat, toCoords.lat) - 0.5;
  const latMax = Math.max(fromCoords.lat, toCoords.lat) + 0.5;
  const lngMin = Math.min(fromCoords.lng, toCoords.lng) - 0.5;
  const lngMax = Math.max(fromCoords.lng, toCoords.lng) + 0.5;

  const projectX = (lng: number) =>
    padding + ((lng - lngMin) / (lngMax - lngMin)) * (width - 2 * padding);
  const projectY = (lat: number) =>
    height - padding - ((lat - latMin) / (latMax - latMin)) * (height - 2 * padding);

  const x1 = projectX(fromCoords.lng);
  const y1 = projectY(fromCoords.lat);
  const x2 = projectX(toCoords.lng);
  const y2 = projectY(toCoords.lat);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="route-preview-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect width={width} height={height} fill="#f8f5f0" />

      {/* Route line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#4A90E2"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Start marker (green) */}
      <circle cx={x1} cy={y1} r="8" fill="#10b981" stroke="white" strokeWidth="2" />

      {/* End marker (red) */}
      <circle cx={x2} cy={y2} r="8" fill="#E63946" stroke="white" strokeWidth="2" />

      {/* Restaurant count badge */}
      <g transform={`translate(${width / 2}, ${height - 30})`}>
        <rect
          x="-35"
          y="-12"
          width="70"
          height="24"
          rx="4"
          fill="white"
          stroke="#ddd"
          strokeWidth="1"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#E63946"
          fontFamily="var(--font-display)"
        >
          {restaurants} stops
        </text>
      </g>
    </svg>
  );
}

interface PopularRoute {
  slug: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  restaurants: number;
  highlight: string;
  color: 'red' | 'yellow' | 'cream';
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    slug: 'sf-to-la',
    from: 'San Francisco',
    to: 'Los Angeles',
    fromCoords: { lat: 37.7749, lng: -122.4194 },
    toCoords: { lat: 34.0522, lng: -118.2437 },
    restaurants: 42,
    highlight: 'Pacific Coast classics',
    color: 'red',
  },
  {
    slug: 'nyc-to-boston',
    from: 'New York',
    to: 'Boston',
    fromCoords: { lat: 40.7128, lng: -74.0060 },
    toCoords: { lat: 42.3601, lng: -71.0589 },
    restaurants: 28,
    highlight: 'Northeast food tour',
    color: 'yellow',
  },
  {
    slug: 'chicago-to-milwaukee',
    from: 'Chicago',
    to: 'Milwaukee',
    fromCoords: { lat: 41.8781, lng: -87.6298 },
    toCoords: { lat: 43.0389, lng: -87.9065 },
    restaurants: 15,
    highlight: 'Midwest comfort food',
    color: 'cream',
  },
  {
    slug: 'austin-to-san-antonio',
    from: 'Austin',
    to: 'San Antonio',
    fromCoords: { lat: 30.2672, lng: -97.7431 },
    toCoords: { lat: 29.4241, lng: -98.4936 },
    restaurants: 12,
    highlight: 'Texas BBQ heaven',
    color: 'red',
  },
  {
    slug: 'portland-to-seattle',
    from: 'Portland',
    to: 'Seattle',
    fromCoords: { lat: 45.5152, lng: -122.6784 },
    toCoords: { lat: 47.6062, lng: -122.3321 },
    restaurants: 18,
    highlight: 'Pacific Northwest gems',
    color: 'yellow',
  },
  {
    slug: 'miami-to-key-west',
    from: 'Miami',
    to: 'Key West',
    fromCoords: { lat: 25.7617, lng: -80.1918 },
    toCoords: { lat: 24.5551, lng: -81.7800 },
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
          <h2 className="popular-routes-title">Popular Routes</h2>
          <p className="popular-routes-subtitle">
            Curated road trips featuring the best Diners, Drive-ins & Dives spots
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

              <div className="route-card-map">
                <RoutePreview
                  from={route.from}
                  to={route.to}
                  fromCoords={route.fromCoords}
                  toCoords={route.toCoords}
                  restaurants={route.restaurants}
                />
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
