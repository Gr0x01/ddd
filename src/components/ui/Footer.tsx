import Link from 'next/link';
import { cache } from 'react';
import { db } from '@/lib/supabase';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Cache the footer data to deduplicate calls within the same request
const getTopStates = cache(async () => {
  try {
    const states = await db.getStatesWithCounts();
    return states
      .filter(s => (s.restaurant_count ?? 0) > 0)
      .sort((a, b) => (b.restaurant_count ?? 0) - (a.restaurant_count ?? 0))
      .slice(0, 12)
      .map(s => ({
        name: s.name,
        slug: s.slug,
        count: s.restaurant_count ?? 0,
      }));
  } catch (error) {
    console.error('Footer: Failed to fetch top states', error);
    return [];
  }
});

const columns: FooterColumn[] = [
  {
    title: 'Browse',
    links: [
      { label: 'All Restaurants', href: '/restaurants' },
      { label: 'By State', href: '/states' },
      { label: 'By Cuisine', href: '/cuisines' },
      { label: 'By Budget', href: '/budget' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'By Season', href: '/seasons' },
      { label: 'Featured Dishes', href: '/dishes' },
      { label: 'All Episodes', href: '/episodes' },
      { label: 'Still Open', href: '/still-open' },
    ],
  },
  {
    title: 'Plan Your Trip',
    links: [
      { label: 'Road Trip Planner', href: '/roadtrip' },
      { label: 'Popular Routes', href: '/roadtrip#popular-routes' },
      { label: 'Closed Locations', href: '/closed' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export async function Footer() {
  const topStates = await getTopStates();

  return (
    <footer
      className="border-t"
      style={{
        background: 'var(--bg-dark)',
        borderColor: 'var(--asphalt-medium)',
      }}
    >

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Main Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h3
                className="font-mono text-xs tracking-widest uppercase mb-4 pb-2 border-b"
                style={{
                  color: 'var(--ddd-yellow)',
                  borderColor: 'var(--asphalt-medium)',
                }}
              >
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-ui text-sm transition-colors hover:text-[var(--ddd-yellow)]"
                      style={{ color: 'var(--diner-chrome)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Top States - Horizontal */}
        {topStates.length > 0 && (
          <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--asphalt-medium)' }}>
            <h3
              className="font-mono text-xs tracking-widest uppercase mb-4"
              style={{ color: 'var(--ddd-yellow)' }}
            >
              Top States
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {topStates.map((state) => (
                <Link
                  key={state.slug}
                  href={`/state/${state.slug}`}
                  className="font-ui text-sm transition-colors hover:text-[var(--ddd-yellow)] whitespace-nowrap"
                  style={{ color: 'var(--diner-chrome)' }}
                >
                  {state.name}
                  <span className="opacity-50 ml-1">({state.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div
          className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--asphalt-medium)' }}
        >
          <p
            className="font-mono text-xs tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            NOT AFFILIATED WITH FOOD NETWORK OR GUY FIERI
          </p>
          <p
            className="font-mono text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            &copy; {new Date().getFullYear()} DDD Map
          </p>
        </div>
      </div>
    </footer>
  );
}
