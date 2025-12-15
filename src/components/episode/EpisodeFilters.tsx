'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import Link from 'next/link';
import { isRecentEpisode } from '@/lib/date-utils';

interface Episode {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  slug: string;
  air_date: string | null;
}

interface EpisodeFiltersProps {
  episodes: Episode[];
  seasons: number[];
}

const CHIP = "font-mono text-sm tracking-wider font-medium px-3 py-1.5 transition-all border flex items-center gap-1.5";

export function EpisodeFilters({ episodes, seasons }: EpisodeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filters from URL
  const searchQuery = searchParams.get('q') || '';
  const selectedSeason = searchParams.get('season') ? Number(searchParams.get('season')) : null;

  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);

  // Filter episodes
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query)
      );
    }

    if (selectedSeason) {
      result = result.filter(e => e.season === selectedSeason);
    }

    return result;
  }, [episodes, searchQuery, selectedSeason]);

  // Group filtered episodes by season
  const episodesBySeason = useMemo(() => {
    return filteredEpisodes.reduce((acc: Record<number, Episode[]>, episode) => {
      const season = episode.season;
      if (!acc[season]) {
        acc[season] = [];
      }
      acc[season].push(episode);
      return acc;
    }, {});
  }, [filteredEpisodes]);

  const filteredSeasons = Object.keys(episodesBySeason)
    .map(Number)
    .sort((a, b) => b - a);

  // Update URL params
  const setFilters = (newFilters: { q?: string; season?: number | null }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.q !== undefined) {
      if (newFilters.q) params.set('q', newFilters.q);
      else params.delete('q');
    }

    if (newFilters.season !== undefined) {
      if (newFilters.season) params.set('season', String(newFilters.season));
      else params.delete('season');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = searchQuery !== '' || selectedSeason !== null;

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setSeasonDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Filter row */}
      <section className="border-b sticky top-16 z-40" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <form className="relative" onSubmit={e => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={e => setFilters({ q: e.target.value })}
                className="w-52 h-8 pl-8 pr-3 font-mono text-sm border transition-colors focus:outline-none focus:border-[#B87333]"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </form>

            <div className="h-4 w-px bg-slate-200" />

            {/* Season dropdown */}
            <div className="relative" ref={seasonDropdownRef}>
              <button
                onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                className={CHIP}
                style={{
                  background: selectedSeason ? 'var(--accent-primary)' : 'transparent',
                  color: selectedSeason ? 'white' : 'var(--text-secondary)',
                  borderColor: selectedSeason ? 'var(--accent-primary)' : 'var(--border-light)',
                }}
              >
                {selectedSeason ? `Season ${selectedSeason}` : 'All Seasons'}
                <ChevronDown className="w-3 h-3" />
              </button>

              {seasonDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-40 border shadow-lg z-50 max-h-72 overflow-y-auto"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                >
                  <button
                    onClick={() => { setFilters({ season: null }); setSeasonDropdownOpen(false); }}
                    className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                    style={{ color: !selectedSeason ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                  >
                    All Seasons
                    {!selectedSeason && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <div className="border-t" style={{ borderColor: 'var(--border-light)' }} />
                  {seasons.map(season => (
                    <button
                      key={season}
                      onClick={() => { setFilters({ season }); setSeasonDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                      style={{
                        color: selectedSeason === season ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: selectedSeason === season ? 600 : 400,
                      }}
                    >
                      <span>Season {season}</span>
                      {selectedSeason === season && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <button
                  onClick={clearFilters}
                  className="font-mono text-sm tracking-wider font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Results count */}
      <div
        className="border-b py-2.5"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-mono text-sm tracking-wider text-slate-500">
            {filteredEpisodes.length === episodes.length ? (
              <span>Showing all <strong className="text-slate-700">{episodes.length}</strong> episodes</span>
            ) : (
              <span>
                <strong className="text-slate-700">{filteredEpisodes.length}</strong> of {episodes.length} episodes
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Episodes grid */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
        {filteredSeasons.length === 0 ? (
          <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
              No episodes found matching your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredSeasons.map(season => (
              <section key={season}>
                <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                  Season {season}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {episodesBySeason[season].map(episode => {
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
                              className="font-mono text-sm font-semibold px-2 py-1 rounded"
                              style={{ background: 'var(--accent-primary)', color: 'white' }}
                            >
                              S{episode.season}E{episode.episode_number}
                            </span>
                            {isNew && (
                              <span
                                className="font-mono text-sm font-semibold px-2 py-1 rounded"
                                style={{ background: '#dc2626', color: 'white' }}
                                aria-label="New episode"
                              >
                                NEW
                              </span>
                            )}
                          </div>
                          {episode.air_date && (
                            <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
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
    </>
  );
}
