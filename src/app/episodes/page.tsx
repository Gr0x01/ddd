import { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { db, Episode } from '@/lib/supabase';
import { isRecentEpisode } from '@/lib/date-utils';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  try {
    const episodes = await db.getEpisodes();
    const seasonCount = new Set(episodes.map(e => e.season)).size;

    const title = `All ${episodes.length} Diners, Drive-ins and Dives Episodes`;
    const description = `Browse all ${episodes.length} episodes across ${seasonCount} seasons of Guy Fieri's Diners, Drive-ins and Dives. Find restaurants featured in each episode.`;

    return {
      title,
      description,
      alternates: {
        canonical: '/episodes',
      },
      openGraph: {
        title,
        description,
        type: 'website',
        url: '/episodes',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch (error) {
    console.error('Episodes page metadata generation failed:', error);
    return {
      title: 'Browse Diners, Drive-ins and Dives Episodes | Triple D Map',
      description: 'Browse all Diners, Drive-ins and Dives episodes.',
    };
  }
}

export default async function EpisodesPage() {
  let episodes: Episode[] = [];
  let stats = { restaurants: 0, episodes: 0, cities: 0 };

  try {
    [episodes, stats] = await Promise.all([
      db.getEpisodes(),
      db.getStats()
    ]);
  } catch (error) {
    console.error('Failed to load episodes data:', error);
    // Page will render with empty data
  }

  const totalRestaurants = stats.restaurants;

  // Group episodes by season
  const episodesBySeason = episodes.reduce((acc: Record<number, typeof episodes>, episode) => {
    const season = episode.season;
    if (!acc[season]) {
      acc[season] = [];
    }
    acc[season].push(episode);
    return acc;
  }, {});

  const seasons = Object.keys(episodesBySeason)
    .map(Number)
    .sort((a, b) => b - a); // Descending order

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Episodes' },
  ]);

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="episodes" />
        <PageHero
          title="Diners, Drive-ins and Dives Episodes"
          subtitle="Browse all Diners, Drive-ins and Dives episodes"
          stats={[
            { value: episodes.length, label: 'EPISODES' },
            { value: seasons.length, label: 'SEASONS' },
            { value: totalRestaurants, label: 'RESTAURANTS' }
          ]}
          breadcrumbItems={[{ label: 'Episodes' }]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          {seasons.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-ui text-lg" style={{ color: 'var(--text-muted)' }}>
                No episodes found.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {seasons.map(season => (
                <section key={season}>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Season {season}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {episodesBySeason[season].map(episode => {
                      // Check if episode is new (within last 6 months)
                      const isNew = isRecentEpisode(episode.air_date, 6);

                      return (
                        <Link
                          key={episode.id}
                          href={`/episode/${episode.slug}`}
                          className="p-6 rounded-lg border block hover:shadow-lg transition-shadow"
                          aria-label={`View episode: ${episode.title}`}
                          style={{
                            background: 'var(--bg-secondary)',
                            borderColor: 'var(--border-light)'
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-mono text-xs font-semibold px-2 py-1 rounded"
                                style={{ background: 'var(--accent-primary)', color: 'white' }}
                              >
                                S{episode.season}E{episode.episode_number}
                              </span>
                              {isNew && (
                                <span
                                  className="font-mono text-xs font-semibold px-2 py-1 rounded"
                                  style={{ background: '#dc2626', color: 'white' }}
                                  aria-label="New episode"
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            {episode.air_date && (
                              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                                {new Date(episode.air_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          <h3 className="font-display text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            {episode.title}
                          </h3>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
