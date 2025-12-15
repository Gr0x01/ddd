'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RestaurantNearRoute } from '@/lib/supabase';

interface RouteMapProps {
  route: {
    polylinePoints: Array<{ lat: number; lng: number }>;
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  restaurants: RestaurantNearRoute[];
  selectedRestaurant: RestaurantNearRoute | null;
  onRestaurantSelect: (restaurant: RestaurantNearRoute) => void;
}

export default function RouteMap({
  route,
  restaurants,
  selectedRestaurant,
  onRestaurantSelect
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const routeMarkers = useRef<maplibregl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add route polyline and start/end markers
  useEffect(() => {
    if (!map.current || !route) return;

    const mapInstance = map.current;

    const setupRoute = () => {
      // Remove existing route if present
      if (mapInstance.getSource('route')) {
        mapInstance.removeLayer('route');
        mapInstance.removeSource('route');
      }

      // Add route source
      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.polylinePoints.map(p => [p.lng, p.lat])
          }
        }
      });

      // Add route layer
      mapInstance.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });

      // Clear existing route markers
      routeMarkers.current.forEach(marker => marker.remove());
      routeMarkers.current = [];

      // Add start marker (green)
      const start = route.polylinePoints[0];
      const startPopup = document.createElement('div');
      startPopup.className = 'p-2';
      const startText = document.createElement('strong');
      startText.textContent = 'Start';
      startPopup.appendChild(startText);

      const startMarker = new maplibregl.Marker({ color: '#10b981' })
        .setLngLat([start.lng, start.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(startPopup))
        .addTo(mapInstance);
      routeMarkers.current.push(startMarker);

      // Add end marker (red)
      const end = route.polylinePoints[route.polylinePoints.length - 1];
      const endPopup = document.createElement('div');
      endPopup.className = 'p-2';
      const endText = document.createElement('strong');
      endText.textContent = 'Destination';
      endPopup.appendChild(endText);

      const endMarker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([end.lng, end.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(endPopup))
        .addTo(mapInstance);
      routeMarkers.current.push(endMarker);

      // Fit bounds to show entire route
      const bounds = new maplibregl.LngLatBounds(
        [route.bounds.southwest.lng, route.bounds.southwest.lat],
        [route.bounds.northeast.lng, route.bounds.northeast.lat]
      );
      mapInstance.fitBounds(bounds, { padding: 50 });
    };

    if (mapInstance.isStyleLoaded()) {
      setupRoute();
    } else {
      mapInstance.on('load', setupRoute);
    }
  }, [route]);

  // Add restaurant markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    restaurants.forEach(restaurant => {
      if (!restaurant.latitude || !restaurant.longitude) return;

      // Create popup content using DOM to prevent XSS
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';

      const title = document.createElement('h3');
      title.className = 'font-bold text-sm';
      title.textContent = restaurant.name;
      popupContent.appendChild(title);

      const location = document.createElement('p');
      location.className = 'text-sm text-gray-600';
      location.textContent = `${restaurant.city}, ${restaurant.state}`;
      popupContent.appendChild(location);

      const distance = document.createElement('p');
      distance.className = 'text-sm text-gray-500 mt-1';
      distance.textContent = `${restaurant.distance_miles.toFixed(1)} mi from route`;
      popupContent.appendChild(distance);

      const link = document.createElement('a');
      link.href = `/restaurant/${restaurant.slug}`;
      link.className = 'text-sm text-blue-600 hover:underline';
      link.textContent = 'View Details →';
      popupContent.appendChild(link);

      const marker = new maplibregl.Marker({
        color: restaurant.status === 'closed' ? '#94a3b8' : '#dc2626'
      })
        .setLngLat([restaurant.longitude, restaurant.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent))
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onRestaurantSelect(restaurant);
      });

      markers.current.push(marker);
    });
  }, [restaurants, onRestaurantSelect]);

  // Highlight selected restaurant
  useEffect(() => {
    if (!map.current || !selectedRestaurant) return;

    if (selectedRestaurant.latitude && selectedRestaurant.longitude) {
      map.current.flyTo({
        center: [selectedRestaurant.longitude, selectedRestaurant.latitude],
        zoom: 13,
        duration: 1000
      });
    }
  }, [selectedRestaurant]);

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
