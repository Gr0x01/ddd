/**
 * Google Directions API Service
 *
 * SERVER-SIDE ONLY - Contains API keys, must never be imported in client components
 * Handles route generation using Google Maps Directions API
 */

// Runtime check to prevent accidental client-side imports
if (typeof window !== 'undefined') {
  throw new Error('google-directions.ts must only be used server-side. API keys would be exposed in the browser.');
}

import { env } from '../env';

export interface DirectionsRequest {
  origin: string;
  destination: string;
  travelMode?: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT';
}

export interface DirectionsResponse {
  polyline: string;
  polylinePoints: Array<{ lat: number; lng: number }>;
  distanceMeters: number;
  durationSeconds: number;
  originPlaceId: string;
  destinationPlaceId: string;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

/**
 * Get driving directions from Google Directions API
 */
export async function getDirections(
  request: DirectionsRequest
): Promise<DirectionsResponse> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  // Build API URL
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', request.origin);
  url.searchParams.set('destination', request.destination);
  url.searchParams.set('mode', request.travelMode?.toLowerCase() || 'driving');
  url.searchParams.set('key', apiKey);

  // Fetch directions
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Directions API HTTP error: ${response.statusText}`);
  }

  const data = await response.json();

  // Handle API errors
  if (data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No route found between these locations');
    }
    if (data.status === 'NOT_FOUND') {
      throw new Error('One or both locations not found');
    }
    if (data.status === 'INVALID_REQUEST') {
      throw new Error('Invalid origin or destination');
    }
    throw new Error(`Directions API error: ${data.status}`);
  }

  const route = data.routes[0];
  const leg = route.legs[0];
  const polyline = route.overview_polyline.points;

  return {
    polyline,
    polylinePoints: decodePolyline(polyline),
    distanceMeters: leg.distance.value,
    durationSeconds: leg.duration.value,
    originPlaceId: leg.start_location.place_id || '',
    destinationPlaceId: leg.end_location.place_id || '',
    bounds: {
      northeast: {
        lat: route.bounds.northeast.lat,
        lng: route.bounds.northeast.lng
      },
      southwest: {
        lat: route.bounds.southwest.lat,
        lng: route.bounds.southwest.lng
      }
    }
  };
}

/**
 * Decode Google's encoded polyline format to lat/lng array
 * Algorithm from: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const poly: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return poly;
}
