---
title: Road Trip Planner - Implementation Complete
created: 2025-12-15
completed: 2025-12-16
status: Completed
---

# Road Trip Planner - Implementation Complete

**Status**: ✅ Completed & Deployed
**Created**: 2025-12-15
**Completed**: 2025-12-16

---

## Overview

The `/roadtrip` page allows users to enter Point A and Point B, then displays DDD restaurants along the route on an interactive map. Individual routes are also available at `/route/[slug]`.

## What Was Built

### Pages
- `/roadtrip` - Main road trip planner with search form and map
- `/route/[slug]` - Individual route pages with two-column hero layout

### Core Features
- **City Autocomplete** - Free fuzzy matching with 1,444 US cities (SimpleMaps data)
- **Route Calculation** - Google Directions API with aggressive caching
- **Restaurant Discovery** - PostGIS spatial queries find restaurants within X miles of route
- **Interactive Map** - MapLibre GL JS with route polylines and restaurant markers
- **Popular Routes** - Pre-calculated curated routes (SF→LA, NYC→Boston, etc.)
- **Route Sharing** - Shareable URLs for any route

---

## Technical Architecture

### Stack Decisions

**Map Rendering**: MapLibre GL JS (FREE)
- Open-source alternative to Mapbox
- Zero cost, unlimited usage
- CartoDB free basemap tiles

**Routing Backend**: Google Directions API
- Reuses existing GOOGLE_PLACES_API_KEY
- Aggressive caching reduces costs 80-90%
- Text-based cache lookup checks BEFORE API call

**Spatial Queries**: PostGIS
- `get_restaurants_near_route()` RPC function
- Finds restaurants within configurable radius (10-100 miles)
- Returns distance from route for each restaurant

**City Autocomplete**: SimpleMaps US Cities (FREE)
- 1,444 major US cities (ranking 1-2)
- Client-side fuzzy matching with Levenshtein distance
- Handles typos, abbreviations (NYC, LA, SF, etc.)
- 77KB uncompressed, ~23KB gzipped

### Data Flow

```
User Input (Origin/Destination via CityAutocomplete)
    ↓
Check Text-Based Cache ($0 cost)
    ↓ (miss)
Google Directions API ($0.005/request)
    ↓
Save to Route Cache (30-day TTL)
    ↓
PostGIS Query (find restaurants within X miles)
    ↓
MapLibre GL JS (render route + markers)
    ↓
Restaurant List (sidebar with details)
```

### Cost Optimization

**Route Caching Strategy**:
- Text-based normalization ("San Francisco, CA" → "san francisco ca")
- Cache checked BEFORE Google API call (not after!)
- 30-day TTL with hit counting
- Estimated 80-90% cache hit rate

**Actual Costs**:
- Google Directions: ~$0 (caching keeps within free tier)
- MapLibre GL: $0 (open source)
- City Autocomplete: $0 (static JSON file)
- **Total: ~$0/month**

---

## Database Schema

### Table: `route_cache`

```sql
CREATE TABLE route_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cache keys (text-based lookup is primary)
    origin_place_id TEXT,
    destination_place_id TEXT,
    origin_text TEXT NOT NULL,
    destination_text TEXT NOT NULL,

    -- Route data
    polyline TEXT NOT NULL,
    polyline_points JSONB NOT NULL,
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,

    -- PostGIS geography for spatial queries
    route_geography geography(LINESTRING, 4326),

    -- SEO & sharing
    slug TEXT UNIQUE,
    is_curated BOOLEAN DEFAULT FALSE,

    -- Metadata
    google_response JSONB,
    hit_count INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

### RPC Functions

- `get_restaurants_near_route(route_id, radius_miles)` - Spatial query with distance
- `get_routes_with_counts()` - Routes with restaurant counts (single query)
- `increment_route_views(route_id)` - Atomic view counter

---

## File Structure

### Backend
- `supabase/migrations/003_roadtrip_schema.sql` - Base schema
- `supabase/migrations/006_route_views.sql` - View counting
- `supabase/migrations/010_route_counts_function.sql` - Restaurant counts
- `supabase/migrations/011_restaurants_near_route.sql` - Enhanced spatial query
- `src/app/api/roadtrip/route.ts` - API endpoint with rate limiting

### Frontend
- `src/app/roadtrip/page.tsx` - Road trip planner page
- `src/app/route/[slug]/page.tsx` - Individual route pages
- `src/components/roadtrip/SearchForm.tsx` - Origin/destination form
- `src/components/roadtrip/CityAutocomplete.tsx` - Smart city autocomplete
- `src/components/roadtrip/RouteMap.tsx` - MapLibre GL JS map
- `src/components/roadtrip/RestaurantList.tsx` - Results list
- `src/components/roadtrip/RouteMapSection.tsx` - Map + list layout

### Data
- `src/lib/cityMatcher.ts` - Fuzzy matching logic
- `public/data/us-cities.min.json` - City lookup data (1,444 cities)
- `scripts/process-cities.ts` - SimpleMaps data processor
- `scripts/populate-curated-routes.ts` - Insert curated routes

---

## Components

### CityAutocomplete
- Full WCAG accessibility (ARIA combobox pattern)
- Keyboard navigation (↑↓ arrows, Enter, Esc)
- Handles 20+ abbreviations (NYC, LA, SF, CHI, etc.)
- Population-weighted scoring (larger cities ranked higher)
- Input sanitization (XSS prevention)

### RouteMap
- MapLibre GL JS with CartoDB basemap
- Blue polyline for route
- Custom markers for start/end points
- Restaurant markers with popups
- Auto-fit bounds to show full route
- Proper cleanup (no memory leaks)

### SearchForm
- Origin/destination inputs with autocomplete
- Radius selector (10/25/50/100 miles)
- Example route buttons for quick start
- Loading states during API calls

---

## Curated Routes

Pre-calculated popular routes for SEO and quick access:

| Route | Distance | Duration |
|-------|----------|----------|
| San Francisco → Los Angeles | ~380 mi | ~6 hrs |
| New York → Boston | ~215 mi | ~4 hrs |
| Chicago → Milwaukee | ~90 mi | ~1.5 hrs |
| Austin → San Antonio | ~80 mi | ~1.5 hrs |
| Portland → Seattle | ~175 mi | ~3 hrs |
| Miami → Key West | ~160 mi | ~4 hrs |
| Nashville → Memphis | ~210 mi | ~3 hrs |
| Denver → Boulder | ~30 mi | ~45 min |

---

## Success Metrics

**Technical Success** ✅:
- Feature works end-to-end
- Cache hit rate tracking implemented
- API costs within free tier
- Zero TypeScript errors

**User Engagement** (tracked via PostHog):
- Route planning events
- Popular routes usage
- Restaurant click-through rate

---

## References

- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- Google Directions API: https://developers.google.com/maps/documentation/directions
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html
- SimpleMaps US Cities: https://simplemaps.com/data/us-cities
