import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import Image from 'next/image';

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
    db.getRestaurantsNearRoute(route.id, 10),
    db.incrementRouteViews(route.id), // Fire and forget
  ]);

  const distanceMiles = Math.round(route.distance_meters / 1609.34);
  const durationHours = Math.round(route.duration_seconds / 3600 * 10) / 10;

  return (
    <div className="app-container">
      <Header currentPage="roadtrip" />

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
          {route.map_image_url && (
            <section className="route-map-section">
              <Image
                src={route.map_image_url}
                alt={`Map of ${route.title}`}
                width={1200}
                height={600}
                className="route-map-image"
                priority
              />
            </section>
          )}

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
              <div className="route-restaurants-grid">
                {restaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurant/${restaurant.slug}`}
                    className="route-restaurant-card"
                  >
                    {restaurant.photo_url && (
                      <div className="route-restaurant-image">
                        <Image
                          src={restaurant.photo_url}
                          alt={restaurant.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="route-restaurant-img"
                        />
                        {restaurant.status === 'open' && (
                          <div className="route-restaurant-status">OPEN</div>
                        )}
                      </div>
                    )}

                    <div className="route-restaurant-content">
                      <h3 className="route-restaurant-name">{restaurant.name}</h3>
                      <p className="route-restaurant-location">
                        {restaurant.city}, {restaurant.state}
                      </p>
                      {restaurant.distance_miles && (
                        <p className="route-restaurant-distance">
                          {Math.round(restaurant.distance_miles * 10) / 10} miles from route
                        </p>
                      )}
                    </div>
                  </Link>
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
