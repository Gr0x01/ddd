import React from 'react';
import Link from 'next/link';

interface BrowseSectionProps {
  stats: { restaurants: number; episodes: number; cities: number };
}

export function BrowseSection({ stats }: BrowseSectionProps) {
  return (
    <section className="py-16 px-8" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
          Browse Diners, Drive-ins and Dives Locations
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/restaurants" className="p-6 rounded-lg hover:shadow-lg transition-shadow" style={{ background: 'var(--bg-secondary)' }}>
            <h3 className="font-ui text-xl font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>
              🍔 All Restaurants
            </h3>
            <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
              Browse all {stats.restaurants} Diners, Drive-ins and Dives restaurants
            </p>
          </Link>
          <div className="p-6 rounded-lg opacity-50" style={{ background: 'var(--bg-secondary)' }}>
            <h3 className="font-ui text-xl font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>
              📍 By City
            </h3>
            <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
              Coming soon: Browse by {stats.cities} cities
            </p>
          </div>
          <div className="p-6 rounded-lg opacity-50" style={{ background: 'var(--bg-secondary)' }}>
            <h3 className="font-ui text-xl font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>
              📺 Episodes
            </h3>
            <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
              Coming soon: View all {stats.episodes} episodes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}