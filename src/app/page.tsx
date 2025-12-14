import { db } from '@/lib/supabase';

export default async function Home() {
  // Fetch stats from database with error handling
  let stats;
  try {
    stats = await db.getStats();
  } catch (error) {
    console.error('Error fetching stats:', error);
    stats = { restaurants: 0, episodes: 0, cities: 0 };
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center p-8 py-20" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-4xl w-full space-y-8 text-center">
          <h1 className="font-display text-6xl font-bold" style={{ color: 'var(--text-primary)' }}>
            DDD Restaurant Map
          </h1>
          <p className="font-ui text-xl" style={{ color: 'var(--text-secondary)' }}>
            Find restaurants featured on Guy Fieri&apos;s <span style={{ color: 'var(--accent-primary)' }} className="font-bold">Diners, Drive-ins and Dives</span>
          </p>

          {/* Stats */}
          <div className="flex gap-6 justify-center mt-12 flex-wrap">
            <div className="p-8 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}>
              <p className="font-mono text-5xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.restaurants}</p>
              <p className="font-mono text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Restaurants</p>
            </div>
            <div className="p-8 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}>
              <p className="font-mono text-5xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.episodes}</p>
              <p className="font-mono text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Episodes</p>
            </div>
            <div className="p-8 rounded-lg" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}>
              <p className="font-mono text-5xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.cities}</p>
              <p className="font-mono text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Cities</p>
            </div>
          </div>

          {/* Coming Soon Badge */}
          {stats.restaurants === 0 && (
            <div className="mt-8 inline-block px-6 py-3 rounded-full" style={{ background: 'var(--accent-primary)', color: 'white' }}>
              <p className="font-ui text-sm font-semibold">🚀 Coming Soon - Database setup in progress</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="p-8 py-16" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
            What&apos;s Coming
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <h3 className="font-ui text-xl font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>📍 Interactive Map</h3>
              <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
                Browse all DDD restaurants on an interactive map. Filter by city, state, cuisine type, and more.
              </p>
            </div>
            <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <h3 className="font-ui text-xl font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>🗺️ Road Trip Planner</h3>
              <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
                Plan your road trip from Point A to Point B and discover DDD restaurants along your route.
              </p>
            </div>
            <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <h3 className="font-ui text-xl font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>✅ Verified Status</h3>
              <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
                Know which restaurants are still open with our automated verification system.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
