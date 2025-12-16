import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import { Calendar, Tv, ChevronLeft, ChevronRight } from 'lucide-react';

interface SeasonPageProps {
  params: Promise<{ season: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: SeasonPageProps): Promise<Metadata> {
  const { season: seasonParam } = await params;
  const seasonNum = parseInt(seasonParam);

  if (isNaN(seasonNum)) {
    return { title: 'Season Not Found | Diners, Drive-ins and Dives' };
  }

  const episodes = await db.getEpisodesBySeason(seasonNum);
  if (episodes.length === 0) {
    return { title: 'Season Not Found | Diners, Drive-ins and Dives' };
  }

  const restaurants = await db.getRestaurantsBySeason(seasonNum);
  const openCount = restaurants.filter(r => r.status === 'open').length;

  const title = `Season ${seasonNum} | Diners, Drive-ins and Dives`;
  const description = `Watch ${episodes.length} episodes from Season ${seasonNum} of Diners, Drive-ins and Dives. Discover ${restaurants.length} restaurants featured by Guy Fieri, ${openCount} still open.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/season/${seasonNum}`,
    },
    openGraph: {
      title: `Season ${seasonNum} | Diners, Drive-ins and Dives`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Season ${seasonNum} | Diners, Drive-ins and Dives`,
      description,
    },
  };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { season: seasonParam } = await params;
  const seasonNum = parseInt(seasonParam);

  if (isNaN(seasonNum)) {
    notFound();
  }

  const [episodes, restaurants, allSeasons, statesData, citiesData] = await Promise.all([
    db.getEpisodesBySeason(seasonNum),
    db.getRestaurantsBySeason(seasonNum),
    db.getSeasonsWithCounts(),
    db.getStatesWithCounts(),
    db.getCitiesWithCounts(),
  ]);

  if (episodes.length === 0) {
    notFound();
  }

  const states = statesData.map((s: { name: string; abbreviation: string; restaurant_count?: number }) => ({
    name: s.name,
    abbreviation: s.abbreviation,
    count: s.restaurant_count ?? 0,
  }));

  const cities = citiesData.map((c: { name: string; state_name: string; restaurant_count?: number }) => ({
    name: c.name,
    state: c.state_name,
    count: c.restaurant_count ?? 0,
  }));

  // Find adjacent seasons for navigation
  const sortedSeasons = allSeasons.sort((a, b) => a.season - b.season);
  const currentIndex = sortedSeasons.findIndex(s => s.season === seasonNum);
  const prevSeason = currentIndex > 0 ? sortedSeasons[currentIndex - 1] : null;
  const nextSeason = currentIndex < sortedSeasons.length - 1 ? sortedSeasons[currentIndex + 1] : null;

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  // Find air date range
  const airDates = episodes
    .map(e => e.air_date)
    .filter((d): d is string => d !== null)
    .sort();
  const firstAirDate = airDates[0];
  const lastAirDate = airDates[airDates.length - 1];

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Seasons', url: '/seasons' },
    { name: `Season ${seasonNum}` },
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
          title={`Season ${seasonNum}`}
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: episodes.length, label: 'EPISODES' },
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'Seasons', href: '/seasons' },
            { label: `Season ${seasonNum}` }
          ]}
        />

        {/* Season Navigation */}
        <section className="max-w-6xl mx-auto px-4 pt-8">
          <div className="flex items-center justify-between">
            {prevSeason ? (
              <Link
                href={`/season/${prevSeason.season}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-mono text-sm">Season {prevSeason.season}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextSeason ? (
              <Link
                href={`/season/${nextSeason.season}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <span className="font-mono text-sm">Season {nextSeason.season}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </section>

        {/* Episodes Section */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2
            className="font-display text-2xl font-bold mb-6 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Tv className="w-6 h-6" style={{ color: 'var(--ddd-red)' }} />
            Episodes
            {firstAirDate && (
              <span className="font-mono text-sm font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                ({new Date(firstAirDate).getFullYear()})
              </span>
            )}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/episode/${episode.slug}`}
                className="p-4 rounded-lg transition-all hover:shadow-md group"
                style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center font-mono text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--ddd-yellow)', color: 'var(--ddd-black)' }}
                  >
                    {episode.episode_number}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="font-ui font-semibold text-sm group-hover:underline truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {episode.title}
                    </h3>
                    {episode.air_date && (
                      <span
                        className="font-mono text-xs flex items-center gap-1 mt-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(episode.air_date)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Restaurants Section */}
        {restaurants.length > 0 && (
          <>
            <section className="max-w-6xl mx-auto px-4 pt-8 pb-4">
              <h2
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Featured Restaurants
              </h2>
              <p className="font-ui mt-2" style={{ color: 'var(--text-secondary)' }}>
                {restaurants.length} restaurants featured in Season {seasonNum}
              </p>
            </section>

            <FilterableRestaurantList
              restaurants={restaurants}
              states={states}
              cities={cities}
              emptyMessage={`No restaurants found for Season ${seasonNum}.`}
            />
          </>
        )}

        {/* Other Seasons */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Explore Other Seasons
          </h2>
          <div className="flex flex-wrap gap-2">
            {allSeasons.slice(0, 20).map((s) => (
              <Link
                key={s.season}
                href={`/season/${s.season}`}
                className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                  s.season === seasonNum ? 'pointer-events-none' : 'hover:opacity-80'
                }`}
                style={{
                  background: s.season === seasonNum ? 'var(--ddd-red)' : 'var(--bg-secondary)',
                  color: s.season === seasonNum ? 'white' : 'var(--text-primary)',
                }}
              >
                S{s.season}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/seasons"
              className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              VIEW ALL SEASONS
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
