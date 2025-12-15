import { Metadata } from 'next';
import { Suspense } from 'react';
import RoadTripPlanner from './RoadTripPlanner';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { db, RouteWithRestaurantCount } from '@/lib/supabase';
import { RouteCard } from '@/components/roadtrip/RouteCard';

export const metadata: Metadata = {
  title: 'Road Trip Planner | Diners, Drive-ins and Dives',
  description: 'Plan your DDD road trip! Find Guy Fieri restaurants along your route. Browse popular routes or create your own to discover the best DDD restaurants along the way.',
  openGraph: {
    title: 'Road Trip Planner - Diners, Drive-ins and Dives',
    description: 'Discover Diners, Drive-ins and Dives restaurants along your route. Browse popular road trips or plan your own adventure.',
    type: 'website'
  }
};

export const revalidate = 3600; // Revalidate every hour

// Fetch routes on the server
async function getRoutes(): Promise<{
  curatedRoutes: RouteWithRestaurantCount[];
  userRoutes: RouteWithRestaurantCount[];
}> {
  try {
    const [curatedRoutes, userRoutes] = await Promise.all([
      db.getCuratedRoutesWithCounts(),
      db.getUserRoutes(12)
    ]);
    return { curatedRoutes, userRoutes };
  } catch (error) {
    console.error('Error fetching routes:', error);
    return { curatedRoutes: [], userRoutes: [] };
  }
}

function RoadTripLoading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <p className="font-mono text-sm tracking-wider" style={{ color: 'var(--text-muted)' }}>
          LOADING...
        </p>
      </div>
    </main>
  );
}

// Server component for route sections
function PopularRoutesSection({ routes }: { routes: RouteWithRestaurantCount[] }) {
  if (routes.length === 0) return null;

  return (
    <section className="routes-section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="routes-section-header">
          <div>
            <h2 className="routes-section-title">Popular Road Trips</h2>
            <p className="routes-section-subtitle">
              Editor&apos;s picks for the best DDD food adventures
            </p>
          </div>
        </div>

        <div className="routes-grid-featured">
          {routes.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              index={index}
              variant="featured"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function UserRoutesSection({ routes }: { routes: RouteWithRestaurantCount[] }) {
  if (routes.length === 0) return null;

  return (
    <section className="routes-section" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="routes-section-header">
          <div>
            <h2 className="routes-section-title">Recently Searched</h2>
            <p className="routes-section-subtitle">
              Routes other travelers have explored
            </p>
          </div>
        </div>

        <div className="routes-grid-compact">
          {routes.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              index={index}
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function RoadTripPage() {
  const { curatedRoutes, userRoutes } = await getRoutes();

  return (
    <div className="app-container">
      <Header currentPage="roadtrip" />

      {/* Interactive planner section */}
      <Suspense fallback={<RoadTripLoading />}>
        <RoadTripPlanner />
      </Suspense>

      {/* Popular routes section (server-rendered) */}
      <PopularRoutesSection routes={curatedRoutes} />

      {/* User-generated routes section (server-rendered) */}
      <UserRoutesSection routes={userRoutes} />

      <Footer />
    </div>
  );
}
