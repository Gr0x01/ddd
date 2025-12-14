'use client';

import { RestaurantNearRoute } from '@/lib/supabase';
import Link from 'next/link';

interface RestaurantListProps {
  restaurants: RestaurantNearRoute[];
  selectedRestaurant: RestaurantNearRoute | null;
  onRestaurantSelect: (restaurant: RestaurantNearRoute) => void;
}

export default function RestaurantList({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No restaurants found along this route.</p>
        <p className="text-sm text-gray-500 mt-2">
          Try increasing the search radius or choosing a different route.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {restaurants.length} Restaurant{restaurants.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedRestaurant?.id === restaurant.id
                ? 'bg-red-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onRestaurantSelect(restaurant)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {restaurant.city}, {restaurant.state}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    {restaurant.distance_miles.toFixed(1)} mi from route
                  </span>
                  {restaurant.price_tier && (
                    <span className="text-xs text-gray-600">{restaurant.price_tier}</span>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      restaurant.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {restaurant.status}
                  </span>
                </div>
              </div>
            </div>

            {restaurant.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {restaurant.description}
              </p>
            )}

            <Link
              href={`/restaurant/${restaurant.slug}`}
              className="inline-block mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
