'use client';

import { useState, useEffect } from 'react';
import SearchForm from '@/components/roadtrip/SearchForm';
import RouteMap from '@/components/roadtrip/RouteMap';
import RestaurantList from '@/components/roadtrip/RestaurantList';
import { RestaurantNearRoute } from '@/lib/supabase';
import type { City } from '@/lib/cityMatcher';

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
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);
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

  // Load cities data on mount with abort controller
  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      try {
        const response = await fetch('/data/us-cities.min.json', {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to load cities: ${response.statusText}`);
        }

        const data = await response.json();
        setCities(data);
        setCitiesError(null);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to load city data';

        console.error('Failed to load cities:', error);
        setCitiesError(errorMessage);
      } finally {
        setCitiesLoading(false);
      }
    }

    loadCities();

    return () => {
      controller.abort();
    };
  }, []);

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
          <p className="mt-1 text-xs text-gray-500">
            City data by{' '}
            <a
              href="https://simplemaps.com/data/us-cities"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700 underline"
            >
              SimpleMaps
            </a>
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {citiesLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Loading city data...
          </div>
        ) : citiesError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Failed to Load City Data</h3>
            <p className="text-red-700 mb-4">{citiesError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        ) : (
          <SearchForm
            origin={state.origin}
            destination={state.destination}
            radiusMiles={state.radiusMiles}
            isLoading={state.isLoading}
            cities={cities}
            onOriginChange={(origin) => setState(prev => ({ ...prev, origin }))}
            onDestinationChange={(destination) => setState(prev => ({ ...prev, destination }))}
            onRadiusChange={(radiusMiles) => setState(prev => ({ ...prev, radiusMiles }))}
            onSubmit={planRoute}
          />
        )}

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
