import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/supabase';
import { getDirections } from '@/lib/server/google-directions';

export const dynamic = 'force-dynamic';

// Input validation schema
const requestSchema = z.object({
  origin: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  radiusMiles: z.number().min(5).max(25).optional().default(10)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate inputs with Zod
    const validatedBody = requestSchema.parse(body);
    const { origin, destination, radiusMiles } = validatedBody;

    // Check cache FIRST (by text, before calling Google API)
    let cachedRoute = await db.findCachedRouteByText(origin, destination);
    let routeId: string;
    let cached = false;

    if (cachedRoute) {
      // Cache hit! Use cached route
      routeId = cachedRoute.id;
      cached = true;

      // Log cache hit for analytics
      console.log('[CACHE HIT]', {
        origin,
        destination,
        routeId,
        hit_count: (cachedRoute as any).hit_count || 0,
        age_hours: Math.floor(
          (Date.now() - new Date((cachedRoute as any).created_at).getTime()) / (1000 * 60 * 60)
        ),
        timestamp: new Date().toISOString()
      });

      // Get restaurants near route
      const restaurants = await db.getRestaurantsNearRoute(routeId, radiusMiles);

      return NextResponse.json({
        route: {
          polyline: cachedRoute.polyline,
          polylinePoints: cachedRoute.polyline_points,
          distanceMeters: cachedRoute.distance_meters,
          durationSeconds: cachedRoute.duration_seconds,
          bounds: (cachedRoute as any).google_response?.bounds || null
        },
        restaurants,
        cached
      });
    }

    // Cache miss - call Google Directions API
    console.log('[CACHE MISS]', {
      origin,
      destination,
      timestamp: new Date().toISOString()
    });

    const directionsResponse = await getDirections({ origin, destination });

    // Save to cache for next time
    routeId = await db.saveRoute(origin, destination, directionsResponse);

    // Get restaurants near route
    const restaurants = await db.getRestaurantsNearRoute(routeId, radiusMiles);

    return NextResponse.json({
      route: {
        polyline: directionsResponse.polyline,
        polylinePoints: directionsResponse.polylinePoints,
        distanceMeters: directionsResponse.distanceMeters,
        durationSeconds: directionsResponse.durationSeconds,
        bounds: directionsResponse.bounds
      },
      restaurants,
      cached
    });
  } catch (error) {
    console.error('Road trip API error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to plan route';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
