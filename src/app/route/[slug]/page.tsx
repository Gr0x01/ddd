import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RestaurantCardOverlay } from '@/components/restaurant/RestaurantCardOverlay';
import Link from 'next/link';
import RouteMapSection from '@/components/route/RouteMapSection';
import { generateRouteSchema, generateRouteFAQSchema, generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import { Utensils, MapPin } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true; // Allow on-demand generation

// Pre-render all curated route pages at build time
export async function generateStaticParams() {
  try {
    const routes = await db.getRouteSlugs();
    console.log(`✓ Generating ${routes.length} route pages`);
    return routes
      .filter(route => route.slug)
      .map((route) => ({
        slug: route.slug!,
      }));
  } catch (error) {
    console.error('✗ Error generating route static params:', error);
    return [];
  }
}

interface RoutePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    radius?: string;
  }>;
}

export async function generateMetadata({ params }: RoutePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const route = await db.getRouteBySlug(slug);

    if (!route) {
      return {
        title: 'Route Not Found',
      };
    }

  const title = `${route.title} - Diners, Drive-ins and Dives Road Trip`;
  const description = route.description || `Find all Guy Fieri restaurants on the ${route.title} route. Plan your Diners, Drive-ins and Dives road trip adventure!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: route.map_image_url ? [{ url: route.map_image_url }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: route.map_image_url ? [route.map_image_url] : [],
      },
    };
  } catch (error) {
    console.error('Error generating route metadata:', error);
    return {
      title: 'Route Not Found',
    };
  }
}

// Valid radius options (must match SearchForm)
const ALLOWED_RADIUS = [10, 25, 50, 100] as const;

export default async function RoutePage({ params, searchParams }: RoutePageProps) {
  const { slug } = await params;
  const { radius: radiusParam } = await searchParams;
  const route = await db.getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  // Parse radius and snap to nearest valid value
  const parsedRadius = parseInt(radiusParam || '25', 10) || 25;
  const radiusMiles = ALLOWED_RADIUS.reduce((prev, curr) =>
    Math.abs(curr - parsedRadius) < Math.abs(prev - parsedRadius) ? curr : prev
  );

  // Get restaurants along this route
  const restaurants = await db.getRestaurantsNearRoute(route.id, radiusMiles);

  // Increment view count (fire and forget - don't block on failure)
  db.incrementRouteViews(route.id).catch(err =>
    console.error('Failed to increment route views:', err)
  );

  const distanceMiles = Math.round(route.distance_meters / 1609.34);
  const durationHours = Math.round(route.duration_seconds / 3600 * 10) / 10;

  // Count open restaurants for FAQ schema
  const openCount = restaurants.filter(r => r.status === 'open').length;

  // Generate structured data
  const routeSchema = generateRouteSchema(
    {
      title: route.title || `${route.origin_text} to ${route.destination_text}`,
      slug: route.slug!,
      origin_text: route.origin_text,
      destination_text: route.destination_text,
      description: route.description,
      distance_meters: route.distance_meters,
      duration_seconds: route.duration_seconds,
      map_image_url: route.map_image_url,
    },
    restaurants.length
  );

  const faqSchema = generateRouteFAQSchema(
    {
      title: route.title || `${route.origin_text} to ${route.destination_text}`,
      origin_text: route.origin_text,
      destination_text: route.destination_text,
      distance_meters: route.distance_meters,
      duration_seconds: route.duration_seconds,
    },
    restaurants.length,
    openCount
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Road Trips', url: '/roadtrip' },
    { name: route.title || `${route.origin_text} to ${route.destination_text}` },
  ]);

  return (
    <div className="app-container">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(routeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />

      <Header currentPage="roadtrip" />

      <main className="route-page">
        {/* Hero Section - Two Column */}
        <section className="route-detail-hero">
          {/* Racing stripe top */}
          <div className="route-detail-hero-stripe" />

          <div className="route-detail-hero-container">
            {/* Breadcrumbs */}
            <div className="route-detail-breadcrumb">
              <Link href="/">Home</Link>
              <span className="route-detail-breadcrumb-sep">→</span>
              <Link href="/roadtrip">Road Trips</Link>
              <span className="route-detail-breadcrumb-sep">→</span>
              <span>{route.title}</span>
            </div>

            {/* Two Column Layout */}
            <div className="route-detail-hero-grid">
              {/* Left: Route Info */}
              <div className="route-detail-hero-info">
                <div className="route-detail-hero-cities">
                  <div className="route-detail-city">
                    <span className="route-detail-city-label">FROM</span>
                    <span className="route-detail-city-name">{route.origin_text.split(',')[0]}</span>
                  </div>
                  <div className="route-detail-arrow-container">
                    <div className="route-detail-arrow-line" />
                    <span className="route-detail-arrow">→</span>
                    <div className="route-detail-arrow-line" />
                  </div>
                  <div className="route-detail-city">
                    <span className="route-detail-city-label">TO</span>
                    <span className="route-detail-city-name">{route.destination_text.split(',')[0]}</span>
                  </div>
                </div>

                <div className="route-detail-stats">
                  <div className="route-detail-stat">
                    <span className="route-detail-stat-value">{restaurants.length}</span>
                    <span className="route-detail-stat-label">STOPS</span>
                  </div>
                  <div className="route-detail-stat">
                    <span className="route-detail-stat-value">{distanceMiles}</span>
                    <span className="route-detail-stat-label">MILES</span>
                  </div>
                  <div className="route-detail-stat">
                    <span className="route-detail-stat-value">{durationHours}</span>
                    <span className="route-detail-stat-label">HOURS</span>
                  </div>
                </div>

                {route.description && (
                  <p className="route-detail-description">{route.description}</p>
                )}
              </div>

              {/* Right: Map */}
              <div className="route-detail-hero-map">
                <RouteMapSection
                  polylinePoints={route.polyline_points as Array<{ lat: number; lng: number }>}
                  restaurants={restaurants}
                />
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="route-detail-hero-accent" />
        </section>

        {/* Restaurants Section - Ordered along route */}
        <section className="route-restaurants-section-v2">
          <div className="route-restaurants-container">
            <div className="route-restaurants-header">
              <div className="route-restaurants-badge route-restaurants-badge--route">
                <MapPin size={20} />
              </div>
              <div className="route-restaurants-header-text">
                <h2 className="route-restaurants-title">
                  {restaurants.length} {restaurants.length === 1 ? 'Stop' : 'Stops'} Along the Way
                </h2>
                <p className="route-restaurants-subtitle">
                  {openCount} open &bull; {restaurants.length - openCount} closed &bull; Ordered by route position
                </p>
              </div>
            </div>

            {restaurants.length === 0 ? (
              <div className="route-no-results">
                <p>No restaurants found along this route.</p>
                <p>Try searching with a different route or larger radius.</p>
              </div>
            ) : (
              <div className="route-journey">
                {(() => {
                  const sorted = [...restaurants].sort((a, b) => a.route_position - b.route_position);

                  // Group by journey segments
                  const groups = [
                    { label: 'Starting Out', restaurants: sorted.filter(r => r.route_position < 0.2) },
                    { label: 'First Half', restaurants: sorted.filter(r => r.route_position >= 0.2 && r.route_position < 0.45) },
                    { label: 'Second Half', restaurants: sorted.filter(r => r.route_position >= 0.45 && r.route_position < 0.7) },
                    { label: 'Almost There', restaurants: sorted.filter(r => r.route_position >= 0.7 && r.route_position < 0.9) },
                    { label: 'The Finish Line', restaurants: sorted.filter(r => r.route_position >= 0.9) },
                  ].filter(g => g.restaurants.length > 0);

                  return groups.map((group, groupIndex) => (
                    <div key={group.label} className="route-journey-group" role="region" aria-label={`${group.label} - ${group.restaurants.length} stops`}>
                      <div className="route-journey-group-header">
                        <div className="route-journey-group-marker" aria-hidden="true" />
                        <h3 className="route-journey-group-label">{group.label}</h3>
                        <span className="route-journey-group-count">
                          {group.restaurants.length} {group.restaurants.length === 1 ? 'stop' : 'stops'}
                        </span>
                      </div>
                      <div className="route-restaurants-list">
                        {group.restaurants.map((restaurant, index) => (
                          <RestaurantCardOverlay
                            key={restaurant.id}
                            restaurant={restaurant}
                            index={groupIndex * 10 + index}
                          />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <div className="route-page-container">
          <section className="route-cta-section">
            <div className="route-cta-badge">
              <Utensils size={20} />
            </div>
            <h2>Plan Your Own Route</h2>
            <p>Find Diners, Drive-ins & Dives restaurants on any route you choose</p>
            <Link href="/roadtrip" className="route-cta-button">
              Plan a Road Trip
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
