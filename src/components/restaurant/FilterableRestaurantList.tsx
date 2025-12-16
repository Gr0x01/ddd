'use client';

import { useState, useCallback, useMemo, Suspense, ReactNode } from 'react';
import { RestaurantFilters } from './RestaurantFilters';
import { RestaurantCardCompact } from './RestaurantCardCompact';
import type { RestaurantData } from '@/lib/hooks/useRestaurantFilters';

interface City {
  name: string;
  state: string | null;
  count: number;
}

interface StateOption {
  name: string;
  abbreviation: string;
  count: number;
}

// Restaurant type compatible with what pages pass in
interface RestaurantInput {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  status: 'open' | 'closed' | 'unknown';
  price_tier?: '$' | '$$' | '$$$' | '$$$$' | string | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  photo_url?: string | null;
  photos?: string[] | null;
  cuisines?: Array<{ name: string; slug: string }>;
}

interface FilterableRestaurantListProps {
  restaurants: RestaurantInput[];
  cities?: City[];
  states?: StateOption[];
  hideLocationDropdown?: boolean;
  emptyMessage?: string;
  /** Custom render function for filtered results - receives filtered restaurants and original map */
  children?: (props: {
    filteredRestaurants: RestaurantInput[];
    openRestaurants: RestaurantInput[];
    closedRestaurants: RestaurantInput[];
  }) => ReactNode;
}

// Convert RestaurantInput to RestaurantData for the filter component
function toRestaurantData(restaurant: RestaurantInput): RestaurantData {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    city: restaurant.city,
    state: restaurant.state,
    status: restaurant.status,
    price_tier: (restaurant.price_tier as RestaurantData['price_tier']) || null,
    google_rating: restaurant.google_rating ?? null,
    google_review_count: restaurant.google_review_count ?? null,
    cuisine_tags: restaurant.cuisines?.map(c => c.name) ?? null,
    photos: restaurant.photos ?? null,
    michelin_stars: null,
    chef: null,
  };
}

export function FilterableRestaurantList({
  restaurants,
  cities = [],
  states = [],
  hideLocationDropdown = false,
  emptyMessage = 'No restaurants found matching your filters.',
  children,
}: FilterableRestaurantListProps) {
  // Convert to RestaurantData for filtering
  const restaurantData = useMemo(() =>
    restaurants.map(toRestaurantData),
    [restaurants]
  );

  const [filteredIds, setFilteredIds] = useState<Set<string>>(new Set(restaurants.map(r => r.id)));

  const handleFilteredRestaurantsChange = useCallback((filtered: RestaurantData[]) => {
    setFilteredIds(new Set(filtered.map(r => r.id)));
  }, []);

  // Get filtered restaurants preserving original data
  const filteredRestaurants = useMemo(() =>
    restaurants.filter(r => filteredIds.has(r.id)),
    [restaurants, filteredIds]
  );

  const openRestaurants = useMemo(() =>
    filteredRestaurants.filter(r => r.status === 'open'),
    [filteredRestaurants]
  );

  const closedRestaurants = useMemo(() =>
    filteredRestaurants.filter(r => r.status === 'closed'),
    [filteredRestaurants]
  );

  return (
    <>
      <Suspense fallback={
        <div className="sticky top-16 z-40 py-4 px-4" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="h-12 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          </div>
        </div>
      }>
        <RestaurantFilters
          restaurants={restaurantData}
          totalRestaurants={restaurantData.length}
          cities={cities}
          states={states}
          hideLocationDropdown={hideLocationDropdown}
          onFilteredRestaurantsChange={handleFilteredRestaurantsChange}
        />
      </Suspense>

      {/* Allow custom rendering or default grid */}
      {children ? (
        children({ filteredRestaurants, openRestaurants, closedRestaurants })
      ) : (
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          {filteredRestaurants.length === 0 ? (
            <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
                {emptyMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {openRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Open Now ({openRestaurants.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {openRestaurants.map((restaurant, index) => (
                      <RestaurantCardCompact
                        key={restaurant.id}
                        restaurant={restaurant}
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              )}

              {closedRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Closed ({closedRestaurants.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {closedRestaurants.map((restaurant, index) => (
                      <RestaurantCardCompact
                        key={restaurant.id}
                        restaurant={restaurant}
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      )}
    </>
  );
}
