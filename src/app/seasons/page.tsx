import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { Tv, UtensilsCrossed, Calendar } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Browse by Season | Diners, Drive-ins and Dives Episodes',
  description: 'Explore all seasons of Diners, Drive-ins and Dives. Find episodes and restaurants from every season of Guy Fieri\'s iconic food show.',
  alternates: {
    canonical: '/seasons',
  },
  openGraph: {
    title: 'Browse Diners, Drive-ins and Dives by Season',
    description: 'Explore all seasons of Guy Fieri\'s Diners, Drive-ins and Dives.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Diners, Drive-ins and Dives by Season',
    description: 'Explore all seasons of Guy Fieri\'s Diners, Drive-ins and Dives.',
  },
};

function formatYear(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).getFullYear().toString();
}

export default async function SeasonsPage() {
  const seasons = await db.getSeasonsWithCounts();

  const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodeCount, 0);
  const totalRestaurants = seasons.reduce((sum, s) => sum + s.restaurantCount, 0);

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="episodes" />

        <PageHero
          title="Browse by Season"
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: seasons.length, label: 'SEASONS' },
            { value: totalEpisodes, label: 'EPISODES' },
            { value: totalRestaurants, label: 'RESTAURANTS' }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              Guy Fieri's Diners, Drive-ins and Dives has been traveling the country since 2007.
              Explore episodes and restaurants by season.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season) => {
              const yearRange = season.firstAirDate
                ? season.firstAirDate === season.lastAirDate || !season.lastAirDate
                  ? formatYear(season.firstAirDate)
                  : `${formatYear(season.firstAirDate)}-${formatYear(season.lastAirDate)}`
                : '';

              return (
                <Link
                  key={season.season}
                  href={`/season/${season.season}`}
                  className="p-6 rounded-lg block hover:shadow-lg transition-all group"
                  style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center font-display text-2xl font-black"
                      style={{ background: 'var(--ddd-red)', color: 'white' }}
                    >
                      {season.season}
                    </div>
                    {yearRange && (
                      <span
                        className="font-mono text-xs flex items-center gap-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Calendar className="w-3 h-3" />
                        {yearRange}
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-display text-xl font-bold mb-3 group-hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Season {season.season}
                  </h3>

                  <div className="flex items-center gap-4">
                    <span
                      className="font-mono text-sm flex items-center gap-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Tv className="w-4 h-4" style={{ color: 'var(--ddd-yellow)' }} />
                      {season.episodeCount} episodes
                    </span>
                    <span
                      className="font-mono text-sm flex items-center gap-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--ddd-yellow)' }} />
                      {season.restaurantCount} restaurants
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
