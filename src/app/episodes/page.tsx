import { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { EpisodeFilters } from '@/components/episode/EpisodeFilters';
import { db, Episode } from '@/lib/supabase';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';

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
  }

  const totalRestaurants = stats.restaurants;

  // Get unique seasons sorted descending
  const seasons = [...new Set(episodes.map(e => e.season))].sort((a, b) => b - a);

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

        <Suspense fallback={
          <div className="sticky top-16 z-40 py-4 px-4" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
            <div className="max-w-6xl mx-auto">
              <div className="h-12 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
            </div>
          </div>
        }>
          <EpisodeFilters episodes={episodes} seasons={seasons} />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
