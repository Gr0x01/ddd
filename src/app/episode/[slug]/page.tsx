import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, Restaurant, getCachedEpisode } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateBreadcrumbSchema, generateEpisodeSchema, safeStringifySchema } from '@/lib/schema';
import { Star, UtensilsCrossed } from 'lucide-react';

interface EpisodePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

// Pre-render all episode pages at build time
export async function generateStaticParams() {
  try {
    const episodes = await db.getEpisodeSlugs();
    console.log(`✓ Generating ${episodes.length} episode pages`);
    return episodes.map((episode) => ({
      slug: episode.slug,
    }));
  } catch (error) {
    console.error('✗ Error generating episode static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const episode = await getCachedEpisode(slug);

    if (!episode) {
      return {
        title: 'Episode Not Found | Diners, Drive-ins and Dives',
      };
    }

    const airDateText = episode.air_date
      ? ` (${new Date(episode.air_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`
      : '';

    const title = `${episode.title} - S${episode.season}E${episode.episode_number} | Diners, Drive-ins and Dives`;
    const description = episode.description
      ? episode.description.substring(0, 160)
      : `Watch restaurants featured in ${episode.title}${airDateText} on Guy Fieri's Diners, Drive-ins and Dives.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/episode/${slug}`,
      },
      openGraph: {
        title: `${episode.title} | Diners, Drive-ins and Dives`,
        description,
        type: 'video.episode',
        url: `/episode/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${episode.title} | Diners, Drive-ins and Dives`,
        description,
      },
    };
  } catch (error) {
    console.error('Episode page metadata generation failed:', error);
    return {
      title: 'Episode Not Found | Diners, Drive-ins and Dives',
    };
  }
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params;
  const episode = await getCachedEpisode(slug);

  if (!episode) {
    notFound();
  }

  // Fetch restaurants and dishes for this episode in parallel
  let restaurants: Restaurant[] = [];
  let dishes: Awaited<ReturnType<typeof db.getDishesByEpisode>> = [];

  try {
    [restaurants, dishes] = await Promise.all([
      db.getRestaurantsByEpisode(episode.id),
      db.getDishesByEpisode(episode.id),
    ]);
  } catch (error) {
    console.error('Failed to load episode data:', error);
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');
  const closedRestaurants = restaurants.filter(r => r.status === 'closed');

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Episodes', url: '/episodes' },
    { name: episode.title },
  ]);

  const episodeSchema = generateEpisodeSchema(episode, restaurants);

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(episodeSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="episodes" />

        <PageHero
          title={episode.title}
          subtitle={`Season ${episode.season}, Episode ${episode.episode_number}`}
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            ...(episode.air_date
              ? [{
                  value: new Date(episode.air_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }),
                  label: 'AIR DATE'
                }]
              : [])
          ]}
          breadcrumbItems={[
            { label: 'Episodes', href: '/episodes' },
            { label: episode.title }
          ]}
        />

        {/* Episode Description */}
        {episode.description && (
          <section className="max-w-6xl mx-auto px-4 pt-12">
            <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              About This Episode
            </h2>
            <p
              className="font-ui text-lg leading-relaxed max-w-4xl mb-8"
              style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}
            >
              {episode.description}
            </p>
          </section>
        )}

        {/* Featured Dishes */}
        {dishes.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-6">
              <UtensilsCrossed size={28} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Featured Dishes ({dishes.length})
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dishes.map((dish) => (
                <Link
                  key={dish.id}
                  href={`/dish/${dish.slug}`}
                  className="group p-5 rounded-lg transition-all hover:shadow-lg"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
                >
                  {dish.is_signature_dish && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold mb-2"
                      style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                      <Star size={12} fill="currentColor" />
                      SIGNATURE
                    </div>
                  )}
                  <h3 className="font-display text-lg font-bold mb-1 group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                    {dish.name}
                  </h3>
                  <p className="font-ui text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    at {dish.restaurant_name}
                  </p>
                  {dish.guy_reaction && (
                    <p className="font-ui text-sm italic line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      &ldquo;{dish.guy_reaction}&rdquo;
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Restaurants */}
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          {restaurants.length === 0 ? (
            <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
                No restaurants found for this episode yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {openRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Open Now ({openRestaurants.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {openRestaurants.map((restaurant, index) => (
                      <RestaurantCardCompact
                        key={restaurant.id}
                        restaurant={restaurant}
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              )}

              {closedRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Closed ({closedRestaurants.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                    {closedRestaurants.map((restaurant, index) => (
                      <RestaurantCardCompact
                        key={restaurant.id}
                        restaurant={restaurant}
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>

        {/* Navigation to other episodes */}
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <div className="pt-8 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <Link
              href="/episodes"
              className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
              style={{
                background: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              VIEW ALL EPISODES
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
