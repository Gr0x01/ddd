import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Static top states data - avoids database call on every page view
// Last updated: 2025-12-16 (total restaurants: 1,541)
// To refresh: Query `SELECT state, COUNT(*) FROM restaurants WHERE is_public GROUP BY state ORDER BY count DESC LIMIT 12`
const topStates = [
  { name: 'California', slug: 'california', count: 247 },
  { name: 'Nevada', slug: 'nevada', count: 81 },
  { name: 'Texas', slug: 'texas', count: 79 },
  { name: 'Florida', slug: 'florida', count: 65 },
  { name: 'Arizona', slug: 'arizona', count: 59 },
  { name: 'Oregon', slug: 'oregon', count: 52 },
  { name: 'New York', slug: 'new-york', count: 50 },
  { name: 'Colorado', slug: 'colorado', count: 44 },
  { name: 'Washington', slug: 'washington', count: 43 },
  { name: 'Ohio', slug: 'ohio', count: 39 },
  { name: 'Hawaii', slug: 'hawaii', count: 37 },
  { name: 'Pennsylvania', slug: 'pennsylvania', count: 36 },
];

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

export function Footer() {
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
