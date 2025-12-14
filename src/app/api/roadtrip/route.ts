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

    // Get directions from Google API
    const directionsResponse = await getDirections({ origin, destination });

    // Check cache by place IDs
    let cachedRoute = await db.findCachedRoute(
      directionsResponse.originPlaceId,
      directionsResponse.destinationPlaceId
    );

    let routeId: string;
    let cached = false;

    if (cachedRoute) {
      routeId = cachedRoute.id;
      cached = true;
    } else {
      // Save to cache
      routeId = await db.saveRoute(origin, destination, directionsResponse);
    }

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
