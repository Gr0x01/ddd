import { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { PageHero } from '@/components/ui/PageHero';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Triple D Map | Your Guide to Diners, Drive-ins and Dives',
  description:
    'Your comprehensive guide to every restaurant featured on Guy Fieri\'s Diners, Drive-ins and Dives. Find locations, check if they\'re still open, and plan your Triple D road trip.',
  openGraph: {
    title: 'About Triple D Map',
    description:
      'Your comprehensive guide to every restaurant featured on Guy Fieri\'s Diners, Drive-ins and Dives.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-auto" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
      <Header currentPage="about" />

      <PageHero
        title="About Triple D Map"
        subtitle="Your guide to Diners, Drive-ins and Dives restaurants"
        breadcrumbItems={[{ label: 'About' }]}
      />

      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <div className="space-y-16">
          <section>
            <h2 className="font-display text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              What is Triple D Map?
            </h2>
            <p className="font-ui text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your comprehensive guide to every restaurant featured on Guy Fieri's hit show "Diners, Drive-ins and Dives." We help you discover, explore, and plan visits to these iconic establishments across the United States and beyond.
            </p>
          </section>

          <section>
            <h2 className="font-display text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Why does this exist?
            </h2>
            <p className="font-ui text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You're watching DDD and Guy visits this amazing-looking burger joint or BBQ spot, and you want to visit it yourself. But finding out where it is, if it's still open, and what to order takes way too much googling. This site saves you that hassle.
            </p>
          </section>

          <section>
            <h2 className="font-display text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              How does it work?
            </h2>
            <p className="font-ui text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              We track every restaurant featured on the show, organize them by location and episode, and keep the information current. Browse by state, search by name, or explore the map to find DDD restaurants near you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Who made this?
            </h2>
            <p className="font-ui text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Just a side project by someone who loves the show and wanted an easy way to find these restaurants. Not affiliated with Food Network, Guy Fieri, or "Diners, Drive-ins and Dives."
            </p>
          </section>

          <section>
            <h2 className="font-display text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              How often is the data updated?
            </h2>
            <p className="font-ui text-lg leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
              Restaurant information is checked regularly for closures, relocations, and other changes. If you notice something's wrong or outdated, feel free to reach out. We're always working to keep things accurate.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-sm font-bold tracking-wide transition-all duration-200 px-6 py-3"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              EXPLORE RESTAURANTS
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
