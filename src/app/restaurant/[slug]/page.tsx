import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RestaurantHero } from '@/components/restaurant/RestaurantHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateRestaurantSchema, generateBreadcrumbSchema } from '@/lib/schema';

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}

async function getStateRestaurants(state: string | null, excludeId: string) {
  if (!state) return [];

  try {
    const allRestaurants = await db.getRestaurants();
    return allRestaurants
      .filter(r => r.state === state && r.id !== excludeId)
      .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
      .slice(0, 6);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const restaurant = await db.getRestaurant(slug);

    if (!restaurant) {
      return {
        title: 'Restaurant Not Found | Triple D Map',
      };
    }

    const ratingText = restaurant.google_rating ? ` ⭐ ${restaurant.google_rating}` : '';
    const priceText = restaurant.price_tier ? ` ${restaurant.price_tier}` : '';

    const description = restaurant.description
      ? restaurant.description.substring(0, 160)
      : `${restaurant.name} in ${restaurant.city}${restaurant.state ? `, ${restaurant.state}` : ''}.${ratingText}${priceText}`;

    return {
      title: `${restaurant.name} - ${restaurant.city} | Triple D Map`,
      description,
      openGraph: {
        title: `${restaurant.name}`,
        description,
        type: 'website',
        images: restaurant.photos?.[0] ? [restaurant.photos[0]] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${restaurant.name}`,
        description,
        images: restaurant.photos?.[0] ? [restaurant.photos[0]] : undefined,
      },
    };
  } catch {
    return {
      title: 'Restaurant Not Found | Triple D Map',
    };
  }
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = await db.getRestaurant(slug);

  if (!restaurant) {
    notFound();
  }

  const stateRestaurants = await getStateRestaurants(restaurant.state, restaurant.id);

  // Generate structured data for SEO
  const restaurantSchema = generateRestaurantSchema(restaurant);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Restaurants', url: '/restaurants' },
    { name: restaurant.name },
  ]);

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen overflow-auto" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <main>
          <RestaurantHero
            restaurant={restaurant}
            breadcrumbItems={[
              { label: 'Restaurants', href: '/restaurants' },
              { label: restaurant.name },
            ]}
          />

          {/* About This Restaurant - Description */}
          {restaurant.description && (
            <section
              className="py-12 border-t"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
            >
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                  About This Restaurant
                </h2>
                <p
                  className="font-ui text-lg leading-relaxed max-w-4xl"
                  style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
                >
                  {restaurant.description}
                </p>
              </div>
            </section>
          )}

          {/* Guy's Quote Section */}
          {restaurant.guy_quote && (
            <section className="py-12 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <div className="max-w-6xl mx-auto px-4">
                <blockquote
                  className="font-display text-3xl font-bold italic max-w-4xl"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  &quot;{restaurant.guy_quote}&quot;
                </blockquote>
                <p
                  className="font-ui text-base mt-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  — Guy Fieri
                </p>
              </div>
            </section>
          )}

          {/* Featured Dishes Section */}
          {restaurant.dishes && restaurant.dishes.length > 0 && (
            <section
              className="py-12 border-t"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
            >
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="font-display text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
                  Featured Dishes
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {restaurant.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="p-6 rounded"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3
                          className="font-display text-xl font-bold flex-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {dish.name}
                        </h3>
                        {dish.is_signature_dish && (
                          <span
                            className="font-mono text-xs px-2 py-1 ml-2 flex-shrink-0"
                            style={{
                              background: 'var(--accent-primary)',
                              color: 'white'
                            }}
                          >
                            SIGNATURE
                          </span>
                        )}
                      </div>
                      {dish.description && (
                        <p
                          className="font-ui text-sm leading-relaxed mb-3"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {dish.description}
                        </p>
                      )}
                      {dish.guy_reaction && (
                        <p
                          className="font-ui text-sm italic"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          &quot;{dish.guy_reaction}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Map Section */}
          {restaurant.latitude && restaurant.longitude && (
            <section className="py-12 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                  Location
                </h2>
                <div
                  className="h-64 sm:h-80 overflow-hidden bg-gray-100 flex items-center justify-center"
                  style={{ border: '2px solid var(--border-light)' }}
                >
                  <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                    Map: {restaurant.latitude.toFixed(4)}, {restaurant.longitude.toFixed(4)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-4 py-2 transition-colors"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    GET DIRECTIONS
                  </a>
                  {restaurant.website_url && (
                    <a
                      href={restaurant.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-4 py-2 transition-colors"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '2px solid var(--border-light)'
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      VISIT WEBSITE
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* More in State Section */}
          {stateRestaurants.length > 0 && restaurant.state && (
            <section
              className="py-12 border-t"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
            >
              <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-baseline gap-4 mb-8">
                  <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    More in {restaurant.state}
                  </h2>
                  <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                    {stateRestaurants.length}+ RESTAURANTS
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {stateRestaurants.map((r) => (
                    <RestaurantCardCompact key={r.id} restaurant={r} />
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <Link
                    href={`/state/${restaurant.state.toLowerCase()}`}
                    className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    VIEW ALL RESTAURANTS IN {restaurant.state.toUpperCase()}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
