import { Metadata } from 'next';
import { Suspense } from 'react';
import RoadTripPlanner from './RoadTripPlanner';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Road Trip Planner | Diners, Drive-ins and Dives',
  description: 'Plan your DDD road trip! Find Guy Fieri restaurants along your route.',
  openGraph: {
    title: 'DDD Road Trip Planner',
    description: 'Discover Diners, Drive-ins and Dives restaurants along your route',
    type: 'website'
  }
};

function RoadTripLoading() {
  return (
    <div className="app-container">
      <Header currentPage="roadtrip" />
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
      <Footer />
    </div>
  );
}

export default function RoadTripPage() {
  return (
    <Suspense fallback={<RoadTripLoading />}>
      <RoadTripPlanner />
    </Suspense>
  );
}
