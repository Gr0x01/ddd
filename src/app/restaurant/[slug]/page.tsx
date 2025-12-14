import { db } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = await db.getRestaurant(slug);

  if (!restaurant) {
    notFound();
  }

  const statusColor = restaurant.status === 'open' ? 'var(--accent-success)' :
                       restaurant.status === 'closed' ? 'var(--accent-primary)' :
                       'var(--text-muted)';

  return (
    <main className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/" className="font-ui" style={{ color: 'var(--text-muted)' }}>
            Home
          </Link>
          <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="font-ui" style={{ color: 'var(--text-primary)' }}>{restaurant.name}</span>
        </nav>

        {/* Restaurant Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {restaurant.name}
              </h1>
              <p className="font-ui text-xl" style={{ color: 'var(--text-secondary)' }}>
                {restaurant.city}, {restaurant.state || restaurant.country}
              </p>
            </div>
            <div className="px-4 py-2 rounded-full font-ui text-sm font-semibold" style={{ background: statusColor, color: 'white' }}>
              {restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {restaurant.price_tier && (
              <span className="px-3 py-1 rounded-full font-mono text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {restaurant.price_tier}
              </span>
            )}
            {restaurant.cuisines?.map((cuisine) => (
              <span key={cuisine.id} className="px-3 py-1 rounded-full font-ui text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {cuisine.name}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {restaurant.description && (
              <section className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>About</h2>
                <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {restaurant.description}
                </p>
              </section>
            )}

            {/* Guy's Quote */}
            {restaurant.guy_quote && (
              <section className="p-6 rounded-lg" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                <p className="font-display text-lg italic mb-2">&quot;{restaurant.guy_quote}&quot;</p>
                <p className="font-ui text-sm opacity-90">— Guy Fieri</p>
              </section>
            )}

            {/* Featured Dishes */}
            {restaurant.dishes && restaurant.dishes.length > 0 && (
              <section className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Featured Dishes</h2>
                <div className="space-y-3">
                  {restaurant.dishes.map((dish) => (
                    <div key={dish.id} className="pb-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <h3 className="font-ui font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {dish.name}
                        {dish.is_signature_dish && (
                          <span className="ml-2 text-sm" style={{ color: 'var(--accent-primary)' }}>⭐</span>
                        )}
                      </h3>
                      {dish.description && (
                        <p className="font-ui text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{dish.description}</p>
                      )}
                      {dish.guy_reaction && (
                        <p className="font-ui text-sm italic mt-1" style={{ color: 'var(--text-secondary)' }}>
                          &quot;{dish.guy_reaction}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Episodes */}
            {restaurant.episodes && restaurant.episodes.length > 0 && (
              <section className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Featured on DDD</h2>
                <div className="space-y-2">
                  {restaurant.episodes.map((episode) => (
                    <div key={episode.id} className="font-ui" style={{ color: 'var(--text-secondary)' }}>
                      Season {episode.season}, Episode {episode.episode_number}: {episode.title}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Info Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Information</h2>

              {/* Address */}
              {restaurant.address && (
                <div className="mb-4">
                  <h3 className="font-ui text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Address</h3>
                  <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {restaurant.address}<br />
                    {restaurant.city}, {restaurant.state} {restaurant.zip}
                  </p>
                </div>
              )}

              {/* Phone */}
              {restaurant.phone && (
                <div className="mb-4">
                  <h3 className="font-ui text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Phone</h3>
                  <a href={`tel:${restaurant.phone}`} className="font-ui text-sm" style={{ color: 'var(--accent-primary)' }}>
                    {restaurant.phone}
                  </a>
                </div>
              )}

              {/* Website */}
              {restaurant.website_url && (
                <div className="mb-4">
                  <h3 className="font-ui text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Website</h3>
                  <a
                    href={restaurant.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-ui text-sm"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    Visit Website →
                  </a>
                </div>
              )}

              {/* Ratings */}
              {restaurant.google_rating && (
                <div className="mb-4">
                  <h3 className="font-ui text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Google Rating</h3>
                  <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ⭐ {restaurant.google_rating}/5
                    {restaurant.google_review_count && (
                      <span className="ml-1">({restaurant.google_review_count} reviews)</span>
                    )}
                  </p>
                </div>
              )}

              {/* Last Verified */}
              {restaurant.last_verified && (
                <div className="pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <p className="font-ui text-xs" style={{ color: 'var(--text-muted)' }}>
                    Last verified: {new Date(restaurant.last_verified).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
