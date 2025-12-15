import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/supabase';
import { getDirections } from '@/lib/server/google-directions';

export const dynamic = 'force-dynamic';

// Input validation schema
const requestSchema = z.object({
  origin: z.string().trim().min(1).max(200),
  destination: z.string().trim().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate inputs with Zod
    const { origin, destination } = requestSchema.parse(body);

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

      // Ensure route has a slug (may not exist for older cached routes)
      let slug = (cachedRoute as any).slug;
      if (!slug) {
        slug = await db.ensureRouteHasSlug(routeId, origin, destination);
      }

      if (!slug) {
        return NextResponse.json(
          { error: 'Failed to generate route slug' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        slug,
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

    // Generate slug for redirect (wait for it, don't fire-and-forget)
    const slug = await db.ensureRouteHasSlug(routeId, origin, destination);

    if (!slug) {
      return NextResponse.json(
        { error: 'Failed to generate route slug' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      slug,
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
