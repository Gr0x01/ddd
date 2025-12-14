'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '../seo/Breadcrumbs';
// Inline helper to get restaurant status
function getRestaurantStatus(status: 'open' | 'closed' | 'unknown') {
  if (status === 'open') {
    return { displayStatus: 'OPEN', isOpen: true, isClosed: false };
  } else if (status === 'closed') {
    return { displayStatus: 'CLOSED', isOpen: false, isClosed: true };
  }
  return { displayStatus: 'UNKNOWN', isOpen: false, isClosed: false };
}

interface Episode {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  slug: string;
}

interface Cuisine {
  id: string;
  name: string;
}

interface RestaurantHeroProps {
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  restaurant: {
    name: string;
    address?: string | null;
    city: string;
    state?: string | null;
    country?: string | null;
    price_tier?: string | null;
    status: 'open' | 'closed' | 'unknown';
    google_rating?: number | null;
    google_review_count?: number | null;
    photos?: string[] | null;
    description?: string | null;
    phone?: string | null;
    website_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    updated_at?: string;
    episodes?: Episode[];
    cuisines?: Cuisine[];
  };
}

export function RestaurantHero({ restaurant, breadcrumbItems }: RestaurantHeroProps) {
  const status = getRestaurantStatus(restaurant.status);

  const photos = (restaurant.photos || []).filter(Boolean);
  const photoCount = photos.length;

  const fullAddress = [
    restaurant.address,
    restaurant.city,
    restaurant.state,
  ].filter(Boolean).join(', ');

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--slate-900)' }}>
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'var(--accent-primary)' }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            {breadcrumbItems && (
              <Breadcrumbs
                items={breadcrumbItems}
                className="[&_a]:text-white/50 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/30"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 min-w-0">
            <span 
              className="font-mono text-[10px] font-bold tracking-widest px-3 py-1.5 inline-block mb-3"
              style={{ 
                background: status.isOpen ? 'var(--accent-success)' : 
                           status.isClosed ? '#dc2626' : 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            >
              {status.displayStatus}
            </span>
            <h1 
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-none tracking-tight"
            >
              {restaurant.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {restaurant.google_rating && (
                <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                  <svg className="w-4 h-4" style={{ color: '#f59e0b' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="font-mono text-sm font-bold text-white">{restaurant.google_rating}</span>
                  {restaurant.google_review_count && (
                    <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      ({restaurant.google_review_count.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}
              {restaurant.price_tier && (
                <span 
                  className="font-mono text-sm font-bold px-3 py-1.5"
                  style={{ background: 'rgba(211, 94, 15, 0.2)', color: 'var(--accent-primary)' }}
                >
                  {restaurant.price_tier}
                </span>
              )}
            </div>

            {restaurant.cuisines && restaurant.cuisines.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {restaurant.cuisines.map((cuisine) => (
                  <span
                    key={cuisine.id}
                    className="font-mono text-xs tracking-wide px-3 py-1"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {cuisine.name}
                  </span>
                ))}
              </div>
            )}

            {restaurant.description && (
              <p 
                className="mt-6 font-ui text-base leading-relaxed max-w-2xl"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {restaurant.description}
              </p>
            )}

            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-2">
                  <svg 
                    className="w-5 h-5 mt-0.5 flex-shrink-0" 
                    style={{ color: 'var(--accent-primary)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-ui text-sm text-white">{fullAddress}</p>
                    <div className="flex items-center gap-8 mt-1">
                      {(restaurant.latitude && restaurant.longitude) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs tracking-wide inline-block transition-colors hover:text-white"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          GET DIRECTIONS →
                        </a>
                      )}
                      {restaurant.website_url && (
                        <a
                          href={restaurant.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs tracking-wide inline-block transition-colors hover:text-white"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          WEBSITE →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {restaurant.phone && (
                  <div className="flex items-center gap-2">
                    <svg 
                      className="w-5 h-5 flex-shrink-0" 
                      style={{ color: 'var(--accent-primary)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a 
                      href={`tel:${restaurant.phone}`}
                      className="font-mono text-sm text-white hover:text-[var(--accent-primary)] transition-colors"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}
              </div>
              
            </div>
          </div>

          {photoCount > 0 && (
            <div className="flex-shrink-0 w-full lg:w-[420px] space-y-3">
              <div>
              {photoCount === 1 && (
                <a
                  href={photos[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-80 relative overflow-hidden group cursor-pointer"
                  style={{
                    border: '4px solid var(--accent-primary)',
                    boxShadow: '8px 8px 0 var(--accent-primary)'
                  }}
                  aria-label="View photo in full size"
                >
                  <Image
                    src={photos[0]}
                    alt={restaurant.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 420px"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </a>
              )}
              
              {photoCount === 2 && (
                <div className="grid grid-rows-2 gap-2 h-80">
                  {photos.slice(0, 2).map((photo, i) => (
                    <a
                      key={i}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative overflow-hidden group cursor-pointer"
                      style={{ border: '2px solid var(--accent-primary)' }}
                      aria-label={`View photo ${i + 1} in full size`}
                    >
                      <Image
                        src={photo}
                        alt={`${restaurant.name} - Photo ${i + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 420px"
                        priority={i === 0}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
              
              {photoCount >= 3 && (
                <div className="space-y-2 h-80">
                  <a
                    href={photos[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative overflow-hidden w-full h-48 group cursor-pointer"
                    style={{ border: '2px solid var(--accent-primary)' }}
                    aria-label="View photo 1 in full size"
                  >
                    <Image
                      src={photos[0]}
                      alt={`${restaurant.name} - Photo 1`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 420px"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </a>
                  <div className="grid grid-cols-2 gap-2" style={{ height: 'calc(20rem - 12rem - 0.5rem)' }}>
                    {photos.slice(1, photoCount >= 5 ? 5 : photoCount).map((photo, i) => (
                      <a
                        key={i + 1}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative overflow-hidden group cursor-pointer"
                        style={{ border: '2px solid var(--accent-primary)' }}
                        aria-label={`View photo ${i + 2} in full size`}
                      >
                        <Image
                          src={photo}
                          alt={`${restaurant.name} - Photo ${i + 2}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 1024px) 50vw, 210px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        {i === 3 && photoCount > 5 && (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.7)' }}
                          >
                            <span className="font-mono text-xl font-bold text-white">
                              +{photoCount - 5}
                            </span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              </div>
              
              <div className="flex items-center justify-between" style={{ opacity: 0.5 }}>
                {restaurant.updated_at && (
                  <span className="font-mono text-[10px] text-white">
                    Updated {new Date(restaurant.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {restaurant.episodes && restaurant.episodes.length > 0 && (
          <div
            className="mt-10 pt-8 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: 'var(--accent-primary)' }}>
              FEATURED ON DDD
            </p>
            <div className="flex flex-wrap gap-3">
              {restaurant.episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/episode/${episode.slug}`}
                  className="group/episode inline-flex items-center gap-2 px-4 py-2 rounded transition-colors hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    S{episode.season}E{episode.episode_number}
                  </span>
                  <span className="font-ui text-sm text-white/80 group-hover/episode:text-white transition-colors">
                    {episode.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'var(--accent-primary)' }}
      />
    </section>
  );
}
