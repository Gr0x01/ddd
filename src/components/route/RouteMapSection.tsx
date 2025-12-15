'use client';

import dynamic from 'next/dynamic';
import type { RestaurantNearRoute } from '@/lib/supabase';

const RouteMap = dynamic(() => import('@/components/roadtrip/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="map-loading" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>Loading map...</div>
    </div>
  )
});

interface RouteMapSectionProps {
  polylinePoints: Array<{ lat: number; lng: number }>;
  restaurants: RestaurantNearRoute[];
}

export default function RouteMapSection({ polylinePoints, restaurants }: RouteMapSectionProps) {
  // Calculate bounds from polyline points
  const lats = polylinePoints.map(p => p.lat);
  const lngs = polylinePoints.map(p => p.lng);

  const bounds = {
    northeast: {
      lat: Math.max(...lats),
      lng: Math.max(...lngs)
    },
    southwest: {
      lat: Math.min(...lats),
      lng: Math.min(...lngs)
    }
  };

  return (
    <RouteMap
      route={{
        polylinePoints,
        bounds
      }}
      restaurants={restaurants}
      selectedRestaurant={null}
      onRestaurantSelect={() => {}}
    />
  );
}
