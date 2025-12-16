import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db, getCachedRestaurant } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RestaurantHero } from '@/components/restaurant/RestaurantHero';
import { MiniMapWrapper } from '@/components/restaurant/MiniMapWrapper';
import { RestaurantCardOverlay } from '@/components/restaurant/RestaurantCardOverlay';
import { generateRestaurantSchema, generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import { MapPin, Phone, Globe, Star, Tv, ChevronUp } from 'lucide-react';

// Restaurant data rarely changes - revalidate once per day
export const revalidate = 86400;

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const restaurant = await getCachedRestaurant(slug);

    if (!restaurant) {
      return {
        title: 'Restaurant Not Found | Diners, Drive-ins and Dives Locations',
      };
    }

    const ratingText = restaurant.google_rating ? ` ⭐ ${restaurant.google_rating}` : '';
    const priceText = restaurant.price_tier ? ` ${restaurant.price_tier}` : '';

    // Use about_story for longer meta descriptions if available
    const description = restaurant.about_story
      ? restaurant.about_story.substring(0, 160)
      : restaurant.description
        ? restaurant.description.substring(0, 160)
        : `${restaurant.name} in ${restaurant.city}${restaurant.state ? `, ${restaurant.state}` : ''} - Featured on Guy Fieri's Diners, Drive-ins and Dives.${ratingText}${priceText}`;

    // Filter photos to only include valid URL strings
    const validPhotos = (restaurant.photos || [])
      .filter((photo): photo is string => typeof photo === 'string' && photo.startsWith('http'));
    const firstPhoto = validPhotos[0];

    return {
      title: `${restaurant.name} - ${restaurant.city} | Diners, Drive-ins and Dives`,
      description,
      openGraph: {
        title: `${restaurant.name} | Guy Fieri's Diners, Drive-ins and Dives`,
        description,
        type: 'website',
        images: firstPhoto ? [firstPhoto] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${restaurant.name} | Diners, Drive-ins and Dives`,
        description,
        images: firstPhoto ? [firstPhoto] : undefined,
      },
    };
  } catch {
    return {
      title: 'Restaurant Not Found | Diners, Drive-ins and Dives Locations',
    };
  }
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = await getCachedRestaurant(slug);

  if (!restaurant) {
    notFound();
  }

  // Use efficient DB query instead of fetching ALL restaurants
  const stateRestaurants = restaurant.state
    ? await db.getTopRestaurantsByState(restaurant.state, restaurant.id, 6)
    : [];

  // Generate structured data for SEO
  const restaurantSchema = generateRestaurantSchema(restaurant);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Restaurants', url: '/restaurants' },
    { name: restaurant.name },
  ]);

  // Determine what content we have
  const hasDescription = Boolean(restaurant.description);
  const hasQuote = Boolean(restaurant.guy_quote);
  const hasDishes = restaurant.dishes && restaurant.dishes.length > 0;
  const hasLocation = restaurant.latitude && restaurant.longitude;
  const hasMoreRestaurants = stateRestaurants.length > 0 && restaurant.state;

  // Long-form content flags
  const hasAboutStory = Boolean(restaurant.about_story);
  const hasCulinaryPhilosophy = Boolean(restaurant.culinary_philosophy);
  const hasHistoryHighlights = Boolean(restaurant.history_highlights);
  const hasWhyVisit = Boolean(restaurant.why_visit);
  const hasCityContext = Boolean(restaurant.city_context);
  const hasLongFormContent = hasAboutStory || hasCulinaryPhilosophy || hasHistoryHighlights || hasWhyVisit || hasCityContext;

  // Get photos for interspersing in content
  const photos = (restaurant.photos || [])
    .filter((photo): photo is string => typeof photo === 'string' && photo.startsWith('http'));

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />

      <div className="app-container">
        <Header currentPage="restaurants" />

        <main>
          <RestaurantHero
            restaurant={restaurant}
            breadcrumbItems={[
              { label: 'Restaurants', href: '/restaurants' },
              { label: restaurant.name },
            ]}
          />

          {/* Main Content Area - Desktop: Main + Sidebar, Mobile: Linear */}
          {hasLongFormContent ? (
            <div className="restaurant-content-wrapper">
              <div className="restaurant-content-container">
                {/* Main Content Column */}
                <article className="restaurant-main-content">
                  {/* About Story Section */}
                  {hasAboutStory && (
                    <section className="restaurant-content-section">
                      <h2 className="restaurant-content-title">
                        About {restaurant.name}
                      </h2>
                      <div className="restaurant-content-text">
                        {restaurant.about_story!.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Photo Break #1 */}
                  {photos.length > 1 && (
                    <div className="restaurant-content-photo">
                      <Image
                        src={photos[1]}
                        alt={`${restaurant.name} food`}
                        width={800}
                        height={500}
                        className="restaurant-content-photo-img"
                      />
                    </div>
                  )}

                  {/* Guy's Quote - Prominent blockquote */}
                  {hasQuote && (
                    <blockquote className="restaurant-content-quote">
                      <span className="restaurant-content-quote-mark">&ldquo;</span>
                      <p>{restaurant.guy_quote}</p>
                      <cite>&mdash; Guy Fieri</cite>
                    </blockquote>
                  )}

                  {/* Culinary Philosophy */}
                  {hasCulinaryPhilosophy && (
                    <section className="restaurant-content-section">
                      <h2 className="restaurant-content-title">
                        Culinary Philosophy
                      </h2>
                      <div className="restaurant-content-text">
                        {restaurant.culinary_philosophy!.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Featured Dishes - Integrated into main flow */}
                  {hasDishes && (
                    <section className="restaurant-content-section restaurant-content-dishes">
                      <h2 className="restaurant-content-title">
                        Featured Dishes
                      </h2>
                      <p className="restaurant-content-subtitle">
                        The dishes Guy Fieri highlighted on the show
                      </p>
                      <div className="restaurant-dishes-grid-inline">
                        {restaurant.dishes!.map((dish, index) => (
                          <div
                            key={dish.id}
                            className={`restaurant-dish-card-inline ${dish.is_signature_dish ? 'signature' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {dish.is_signature_dish && (
                              <div className="restaurant-dish-signature-inline">
                                <Star size={14} fill="currentColor" />
                                SIGNATURE
                              </div>
                            )}
                            <h3 className="restaurant-dish-name-inline">{dish.name}</h3>
                            {dish.description && (
                              <p className="restaurant-dish-desc-inline">{dish.description}</p>
                            )}
                            {dish.guy_reaction && (
                              <p className="restaurant-dish-reaction-inline">
                                &ldquo;{dish.guy_reaction}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Photo Break #2 */}
                  {photos.length > 2 && (
                    <div className="restaurant-content-photo">
                      <Image
                        src={photos[2]}
                        alt={`${restaurant.name} interior`}
                        width={800}
                        height={500}
                        className="restaurant-content-photo-img"
                      />
                    </div>
                  )}

                  {/* History Highlights */}
                  {hasHistoryHighlights && (
                    <section className="restaurant-content-section">
                      <h2 className="restaurant-content-title">
                        History & Highlights
                      </h2>
                      <div className="restaurant-content-text">
                        {restaurant.history_highlights!.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Why Visit */}
                  {hasWhyVisit && (
                    <section className="restaurant-content-section">
                      <h2 className="restaurant-content-title">
                        Why Visit {restaurant.name}
                      </h2>
                      <div className="restaurant-content-text">
                        {restaurant.why_visit!.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* City Context */}
                  {hasCityContext && (
                    <section className="restaurant-content-section">
                      <h2 className="restaurant-content-title">
                        {restaurant.city}&apos;s Food Scene
                      </h2>
                      <div className="restaurant-content-text">
                        {restaurant.city_context!.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                      {restaurant.state && (
                        <Link
                          href={`/city/${restaurant.state.toLowerCase()}/${restaurant.city.toLowerCase().replace(/\s+/g, '-')}`}
                          className="restaurant-content-city-link"
                        >
                          Explore more restaurants in {restaurant.city} →
                        </Link>
                      )}
                    </section>
                  )}
                </article>

                {/* Sidebar - Desktop Only */}
                <aside className="restaurant-sidebar">
                  {/* Quick Info Card */}
                  <div className="restaurant-sidebar-card">
                    <h3 className="restaurant-sidebar-card-title">Quick Info</h3>

                    {restaurant.address && (
                      <div className="restaurant-sidebar-item">
                        <MapPin size={16} />
                        <span>{restaurant.address}</span>
                      </div>
                    )}

                    <div className="restaurant-sidebar-item">
                      <MapPin size={16} />
                      <span>{restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}</span>
                    </div>

                    {restaurant.phone && (
                      <a href={`tel:${restaurant.phone}`} className="restaurant-sidebar-item restaurant-sidebar-link">
                        <Phone size={16} />
                        <span>{restaurant.phone}</span>
                      </a>
                    )}

                    {restaurant.website_url && (
                      <a
                        href={restaurant.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="restaurant-sidebar-item restaurant-sidebar-link"
                      >
                        <Globe size={16} />
                        <span>Visit Website</span>
                      </a>
                    )}

                    {hasLocation && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="restaurant-sidebar-directions"
                      >
                        <MapPin size={18} />
                        Get Directions
                      </a>
                    )}
                  </div>

                  {/* Cuisine Tags */}
                  {restaurant.cuisines && restaurant.cuisines.length > 0 && (
                    <div className="restaurant-sidebar-card">
                      <h3 className="restaurant-sidebar-card-title">Cuisine</h3>
                      <div className="restaurant-sidebar-tags">
                        {restaurant.cuisines.map((cuisine) => (
                          <Link
                            key={cuisine.id}
                            href={`/cuisines/${cuisine.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="restaurant-sidebar-tag"
                          >
                            {cuisine.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Episode Info */}
                  {restaurant.episodes && restaurant.episodes.length > 0 && (
                    <div className="restaurant-sidebar-card">
                      <h3 className="restaurant-sidebar-card-title">
                        <Tv size={16} />
                        Featured On
                      </h3>
                      <div className="restaurant-sidebar-episodes">
                        {restaurant.episodes.map((episode) => (
                          <Link
                            key={episode.id}
                            href={`/episode/${episode.slug}`}
                            className="restaurant-sidebar-episode"
                          >
                            <span className="restaurant-sidebar-episode-num">
                              S{episode.season}E{episode.episode_number}
                            </span>
                            <span className="restaurant-sidebar-episode-title">
                              {episode.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mini Map */}
                  {hasLocation && (
                    <div className="restaurant-sidebar-card restaurant-sidebar-map">
                      <MiniMapWrapper
                        lat={restaurant.latitude!}
                        lng={restaurant.longitude!}
                        name={restaurant.name}
                      />
                    </div>
                  )}
                </aside>
              </div>

              {/* Back to Top - Mobile */}
              <a href="#" className="restaurant-back-to-top">
                <ChevronUp size={20} />
                Back to Top
              </a>
            </div>
          ) : (
            /* Fallback: Original layout for restaurants without long-form content */
            <>
              {/* Guy's Quote Section - Prominent, bold */}
              {hasQuote && (
                <section className="restaurant-quote-section">
                  <div className="restaurant-quote-container">
                    <div className="restaurant-quote-marks">&ldquo;</div>
                    <blockquote className="restaurant-quote-text">
                      {restaurant.guy_quote}
                    </blockquote>
                    <cite className="restaurant-quote-author">
                      <span className="restaurant-quote-dash">&mdash;</span>
                      Guy Fieri
                    </cite>
                  </div>
                </section>
              )}

              {/* About Section - Only if we have description AND no quote (to avoid redundancy) */}
              {hasDescription && !hasQuote && (
                <section className="restaurant-about-section">
                  <div className="restaurant-about-container">
                    <h2 className="restaurant-section-title">
                      <span className="restaurant-section-title-accent">About</span>
                    </h2>
                    <p className="restaurant-about-text">
                      {restaurant.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Featured Dishes Section */}
              {hasDishes && (
                <section className="restaurant-dishes-section">
                  <div className="restaurant-dishes-container">
                    <div className="restaurant-dishes-header">
                      <div className="restaurant-dishes-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>GUY&apos;S PICKS</span>
                      </div>
                      <h2 className="restaurant-dishes-title">
                        Featured Dishes
                      </h2>
                      <p className="restaurant-dishes-subtitle">
                        The dishes Guy Fieri highlighted on the show
                      </p>
                    </div>

                    <div className="restaurant-dishes-grid">
                      {restaurant.dishes!.map((dish, index) => (
                        <div
                          key={dish.id}
                          className={`restaurant-dish-card ${dish.is_signature_dish ? 'signature' : ''}`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {dish.is_signature_dish && (
                            <div className="restaurant-dish-signature-badge">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              SIGNATURE
                            </div>
                          )}
                          <h3 className="restaurant-dish-name">{dish.name}</h3>
                          {dish.description && (
                            <p className="restaurant-dish-description">{dish.description}</p>
                          )}
                          {dish.guy_reaction && (
                            <p className="restaurant-dish-reaction">
                              &ldquo;{dish.guy_reaction}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Location Section with Map Placeholder */}
              {hasLocation && (
                <section className="restaurant-location-section">
                  <div className="restaurant-location-container">
                    <div className="restaurant-location-info">
                      <h2 className="restaurant-section-title">
                        <span className="restaurant-section-title-accent">Location</span>
                      </h2>

                      {restaurant.address && (
                        <p className="restaurant-location-address">
                          {restaurant.address}
                        </p>
                      )}
                      <p className="restaurant-location-city">
                        {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}
                      </p>

                      <div className="restaurant-location-actions">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="restaurant-location-button"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          GET DIRECTIONS
                        </a>
                      </div>
                    </div>

                    <div className="restaurant-location-map">
                      <MiniMapWrapper
                        lat={restaurant.latitude!}
                        lng={restaurant.longitude!}
                        name={restaurant.name}
                      />
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* More in State Section - Always at bottom */}
          {hasMoreRestaurants && (
            <section className="restaurant-more-section">
              <div className="restaurant-more-container">
                <div className="restaurant-more-header">
                  <div className="restaurant-more-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>NEARBY</span>
                  </div>
                  <h2 className="restaurant-more-title">
                    More in {restaurant.state}
                  </h2>
                  <p className="restaurant-more-subtitle">
                    Other Diners, Drive-ins and Dives restaurants in the area
                  </p>
                </div>

                <div className="restaurant-more-grid">
                  {stateRestaurants.map((r, index) => (
                    <RestaurantCardOverlay
                      key={r.id}
                      restaurant={r}
                      index={index}
                    />
                  ))}
                </div>

                <div className="restaurant-more-cta">
                  <Link
                    href={`/state/${restaurant.state!.toLowerCase()}`}
                    className="restaurant-more-cta-button"
                  >
                    VIEW ALL IN {restaurant.state!.toUpperCase()}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
