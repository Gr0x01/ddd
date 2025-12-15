import Link from 'next/link';
import type { RouteCache } from '@/lib/supabase';
import { RouteCard } from '@/components/ui/RouteCard';
import { ArrowRight } from 'lucide-react';

interface PopularRoutesProps {
  routes: RouteCache[];
}

export default function PopularRoutes({ routes }: PopularRoutesProps) {
  if (routes.length === 0) return null;

  return (
    <section className="popular-routes">
      {/* Racing stripe accent */}
      <div className="popular-routes-stripe" />

      <div className="popular-routes-container">
        <div className="popular-routes-header">
          <h2 className="popular-routes-title">
            Popular <span className="popular-routes-title-accent">Road Trips</span>
          </h2>
          <p className="popular-routes-subtitle">
            Curated routes featuring the best Diners, Drive-ins & Dives spots
          </p>
        </div>

        <div className="popular-routes-grid">
          {routes.map((route, index) => (
            <RouteCard key={route.id} route={route} index={index} />
          ))}
        </div>

        {/* View all CTA */}
        <div className="popular-routes-cta">
          <Link href="/roadtrip" className="popular-routes-view-all">
            <span>PLAN YOUR OWN TRIP</span>
            <ArrowRight strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}
