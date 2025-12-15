import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import Link from 'next/link';
import RouteMapSection from '@/components/route/RouteMapSection';
import { generateRouteSchema, generateRouteFAQSchema, generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';

export const revalidate = 3600; // Revalidate every hour

interface RoutePageProps {
  params: Promise<{
    slug: string;
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
  const description = route.description || `Find all Guy Fieri restaurants on the ${route.title} route. Plan your Triple D road trip adventure!`;

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

export default async function RoutePage({ params }: RoutePageProps) {
  const { slug } = await params;
  const route = await db.getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  // Get restaurants along this route and increment view count in parallel
  const [restaurants] = await Promise.all([
    db.getRestaurantsNearRoute(route.id, 25), // 25 mile radius to catch more restaurants
    db.incrementRouteViews(route.id), // Fire and forget
  ]);

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

      <Header currentPage="restaurants" />

      <main className="route-page">
        <div className="route-page-container">
          {/* Hero Section */}
          <section className="route-hero">
            <div className="route-breadcrumb">
              <Link href="/">Home</Link>
              <span>→</span>
              <Link href="/roadtrip">Road Trips</Link>
              <span>→</span>
              <span>{route.title}</span>
            </div>

            <h1 className="route-title">
              {route.origin_text}
              <span className="route-arrow">→</span>
              {route.destination_text}
            </h1>

            <div className="route-stats">
              <div className="route-stat">
                <span className="route-stat-value">{restaurants.length}</span>
                <span className="route-stat-label">Restaurants</span>
              </div>
              <div className="route-stat">
                <span className="route-stat-value">{distanceMiles} mi</span>
                <span className="route-stat-label">Distance</span>
              </div>
              <div className="route-stat">
                <span className="route-stat-value">{durationHours} hrs</span>
                <span className="route-stat-label">Drive Time</span>
              </div>
            </div>

            {route.description && (
              <p className="route-description">{route.description}</p>
            )}
          </section>

          {/* Map Section */}
          <section className="route-map-section">
            <RouteMapSection
              polylinePoints={route.polyline_points as Array<{ lat: number; lng: number }>}
              restaurants={restaurants}
            />
          </section>

          {/* Restaurants Section */}
          <section className="route-restaurants-section">
            <h2 className="route-section-title">
              Restaurants Along This Route
            </h2>

            {restaurants.length === 0 ? (
              <div className="route-no-results">
                <p>No restaurants found along this route.</p>
                <p>Try searching with a different route or larger radius.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant, index) => (
                  <RestaurantCardCompact
                    key={restaurant.id}
                    restaurant={restaurant}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="route-cta-section">
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
