'use client';

import { useState } from 'react';
import SearchForm from '@/components/roadtrip/SearchForm';
import RouteMap from '@/components/roadtrip/RouteMap';
import RestaurantList from '@/components/roadtrip/RestaurantList';
import { RestaurantNearRoute } from '@/lib/supabase';

interface RouteData {
  polyline: string;
  polylinePoints: Array<{ lat: number; lng: number }>;
  distanceMeters: number;
  durationSeconds: number;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

interface RoadTripState {
  origin: string;
  destination: string;
  radiusMiles: number;
  route: RouteData | null;
  restaurants: RestaurantNearRoute[];
  isLoading: boolean;
  error: string | null;
  selectedRestaurant: RestaurantNearRoute | null;
}

export default function RoadTripPlanner() {
  const [state, setState] = useState<RoadTripState>({
    origin: '',
    destination: '',
    radiusMiles: 10,
    route: null,
    restaurants: [],
    isLoading: false,
    error: null,
    selectedRestaurant: null
  });

  const planRoute = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/roadtrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: state.origin,
          destination: state.destination,
          radiusMiles: state.radiusMiles
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to plan route');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        route: data.route,
        restaurants: data.restaurants,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to plan route',
        isLoading: false
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            DDD Road Trip Planner
          </h1>
          <p className="mt-2 text-gray-600">
            Find Diners, Drive-ins and Dives restaurants along your route
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchForm
          origin={state.origin}
          destination={state.destination}
          radiusMiles={state.radiusMiles}
          isLoading={state.isLoading}
          onOriginChange={(origin) => setState(prev => ({ ...prev, origin }))}
          onDestinationChange={(destination) => setState(prev => ({ ...prev, destination }))}
          onRadiusChange={(radiusMiles) => setState(prev => ({ ...prev, radiusMiles }))}
          onSubmit={planRoute}
        />

        {state.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{state.error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {state.route && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <RouteMap
                route={state.route}
                restaurants={state.restaurants}
                selectedRestaurant={state.selectedRestaurant}
                onRestaurantSelect={(restaurant) =>
                  setState(prev => ({ ...prev, selectedRestaurant: restaurant }))
                }
              />
            </div>

            {/* Restaurant List */}
            <div className="lg:col-span-1">
              <RestaurantList
                restaurants={state.restaurants}
                selectedRestaurant={state.selectedRestaurant}
                onRestaurantSelect={(restaurant) =>
                  setState(prev => ({ ...prev, selectedRestaurant: restaurant }))
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
