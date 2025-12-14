import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { db } from '@/lib/supabase';
import Link from 'next/link';

export const metadata = {
  title: 'Browse DDD Episodes | Triple D Map',
  description: 'Browse all Diners, Drive-ins and Dives episodes. Find restaurants featured in each episode of the show.',
};

export const revalidate = 3600; // Revalidate every hour

export default async function EpisodesPage() {
  // Fetch all episodes (using existing method)
  const episodes = await db.getEpisodes();

  // Get total restaurant count
  const allRestaurants = await db.getRestaurants();
  const totalRestaurants = allRestaurants.length;

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

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="episodes" />
        <PageHero
          title="DDD Episodes"
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
                    {episodesBySeason[season].map(episode => (
                      <div
                        key={episode.id}
                        className="p-6 rounded-lg border"
                        style={{
                          background: 'var(--bg-secondary)',
                          borderColor: 'var(--border-light)'
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className="font-mono text-xs font-semibold px-2 py-1 rounded"
                            style={{ background: 'var(--accent-primary)', color: 'white' }}
                          >
                            S{episode.season}E{episode.episode_number}
                          </span>
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
                        {/* Note: Restaurant count would require a join or separate query */}
                      </div>
                    ))}
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
