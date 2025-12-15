# Road Trip Planner - Project Plan

**Status**: Planning
**Created**: 2025-12-15
**Target**: Phase 4 Feature

---

## Overview

Build a `/roadtrip` page that allows users to enter Point A and Point B, then displays DDD restaurants along the route on an interactive map.

## User Requirements

- **Separate page**: `/roadtrip` (not integrated into homepage)
- **Core functionality**: Enter origin → destination → see restaurants along route
- **Map library**: Mapbox GL JS (better route rendering than Leaflet)
- **Routing API**: Google Directions API (can reuse existing GOOGLE_PLACES_API_KEY)
- **Scope**: Simple A→B routing, just show restaurants (not competing with Google Maps)
- **Mobile**: Responsive design but desktop is priority (not 80% mobile focus)
- **Cost**: Free for users, backend pays minimal API costs

---

## Technical Architecture

### Stack Decisions

**Map Rendering**: Mapbox GL JS
- Better than Leaflet for route polylines
- Smooth mobile performance
- Free tier: 50k loads/month
- Cost after free: $5/1k loads

**Routing Backend**: Google Directions API
- Can reuse existing GOOGLE_PLACES_API_KEY
- Free tier: 40k requests/month ($200 credit)
- Cost after free: $5/1k requests
- Returns polyline + turn-by-turn directions

**Spatial Queries**: PostGIS (already installed)
- Find restaurants within X miles of route
- Uses `ST_DWithin()` for radius search
- Spatial index already exists: `idx_restaurants_geography`

### Data Flow

```
User Input (Origin/Destination)
    ↓
Google Directions API (fetch route polyline)
    ↓
Route Cache (save in Supabase, 30-day TTL)
    ↓
PostGIS Query (find restaurants within 10 miles)
    ↓
Mapbox GL JS (render route + markers)
    ↓
Restaurant List (sidebar with details)
```

### Cost Optimization

**Route Caching Strategy**:
- Cache key: `origin_place_id` + `destination_place_id`
- TTL: 30 days (routes don't change often)
- Hit counter tracks popular routes
- Estimated 60%+ cache hit rate after first week

**Estimated Monthly Costs**:
- Google Directions: $0 (within 40k free tier with caching)
- Mapbox GL: $0 (within 50k free tier)
- Total: **$0/month** for first few months

---

## Database Schema

### New Table: `route_cache`

```sql
CREATE TABLE route_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cache keys
    origin_place_id TEXT NOT NULL,
    destination_place_id TEXT NOT NULL,
    origin_text TEXT NOT NULL,
    destination_text TEXT NOT NULL,

    -- Route data from Google
    polyline TEXT NOT NULL,
    polyline_points JSONB NOT NULL,
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,

    -- PostGIS geography for spatial queries
    route_geography geography(LINESTRING, 4326),

    -- Metadata
    google_response JSONB,
    hit_count INTEGER DEFAULT 1,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

    UNIQUE(origin_place_id, destination_place_id)
);

-- Indexes
CREATE INDEX idx_route_cache_geography ON route_cache USING GIST(route_geography);
CREATE INDEX idx_route_cache_expires ON route_cache(expires_at);
CREATE INDEX idx_route_cache_lookup ON route_cache(origin_place_id, destination_place_id);
```

### PostGIS Function

```sql
CREATE OR REPLACE FUNCTION get_restaurants_near_route(
  route_id UUID,
  radius_miles DECIMAL DEFAULT 10.0
)
RETURNS TABLE(...) AS $$
  -- Find restaurants within X miles of route using ST_DWithin
  -- Order by distance from route
  -- Limit to 200 results
$$;
```

---

## File Structure

### New Files to Create

**Backend:**
1. `/supabase/migrations/003_roadtrip_schema.sql` - Database migration
2. `/src/lib/google-directions.ts` - Google Directions API client
3. `/src/app/api/roadtrip/route.ts` - API endpoint (POST)

**Frontend:**
4. `/src/app/roadtrip/page.tsx` - Page component (SEO metadata)
5. `/src/app/roadtrip/RoadTripPlanner.tsx` - Main client component
6. `/src/components/roadtrip/SearchForm.tsx` - Origin/destination form
7. `/src/components/roadtrip/RouteMap.tsx` - Mapbox GL JS map
8. `/src/components/roadtrip/RestaurantList.tsx` - Sidebar list

**Total: 8 new files**

### Files to Modify

1. `/src/lib/env.ts` - Add `NEXT_PUBLIC_MAPBOX_TOKEN` validation
2. `/src/lib/supabase.ts` - Add route cache helpers to `db` object

**Total: 2 modified files**

---

## Component Architecture

### Search Form
- Origin input (text, required)
- Destination input (text, required)
- Swap button (reverse origin/destination)
- Search radius slider (5-25 miles, default 10)
- "Plan My Route" button

### Route Map
- Mapbox GL JS instance
- Blue polyline for route
- Red markers for open restaurants
- Gray markers for closed restaurants
- Popups with restaurant info + "View Details" link
- Auto-fit bounds to show full route

### Restaurant List
- Sidebar (desktop) showing all restaurants
- Sorted by distance from route
- Display: name, city/state, distance, status, price tier
- Click card → center map on marker
- "View Details" link → navigate to restaurant page

---

## API Design

### Endpoint: `POST /api/roadtrip`

**Request:**
```json
{
  "origin": "San Francisco, CA",
  "destination": "Los Angeles, CA",
  "radiusMiles": 10
}
```

**Response:**
```json
{
  "route": {
    "polyline": "encoded_polyline_string",
    "polylinePoints": [{"lat": 37.7, "lng": -122.4}, ...],
    "distanceMeters": 615000,
    "durationSeconds": 21600,
    "bounds": {
      "northeast": {"lat": 37.8, "lng": -118.2},
      "southwest": {"lat": 34.0, "lng": -122.5}
    }
  },
  "restaurants": [
    {
      "id": "uuid",
      "name": "Restaurant Name",
      "slug": "restaurant-slug",
      "city": "Santa Barbara",
      "state": "CA",
      "latitude": 34.4,
      "longitude": -119.7,
      "status": "open",
      "price_tier": "$$",
      "distance_miles": 2.3
    }
  ],
  "cached": true
}
```

**Logic:**
1. Validate origin/destination
2. Call Google Directions API
3. Check route cache (by place IDs)
4. If cached: increment hit count, return cached route
5. If not cached: save route to cache
6. Query restaurants using PostGIS function
7. Return route + restaurants

---

## State Management

**Component State** (simple React useState, no Redux):

```typescript
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
```

**No complex state needed** - this is a simple form → API → display flow.

---

## User Flow

1. **User visits `/roadtrip`**
   - Empty state: Search form + description
   - Optional: Show example routes (SF→LA, NYC→Boston)

2. **User enters origin/destination**
   - Type city names (no autocomplete for MVP)
   - Adjust search radius slider
   - Click "Plan My Route"

3. **Loading state**
   - Disable form
   - Show spinner
   - API call to `/api/roadtrip`

4. **Results displayed**
   - Map shows route polyline + restaurant markers
   - Sidebar shows restaurant list sorted by distance
   - User interactions:
     - Click marker → highlight in list + show popup
     - Click restaurant card → center map on marker
     - Click "View Details" → navigate to restaurant page

5. **Modify search**
   - Change origin/destination
   - Adjust radius
   - Re-plan route (new API call)

---

## Mobile Responsive Design

**Desktop (≥1024px):**
- Two-column layout: Map (66%) | List (33%)
- Full search form visible

**Tablet (768-1023px):**
- Map full width (50vh)
- List below map (scrollable)

**Mobile (<768px):**
- Map full width (60vh)
- Collapsible search form
- List as bottom drawer (swipe up)

**Note**: Desktop is priority, mobile is "good enough" responsive.

---

## Environment Setup

### Required Env Vars

**Mapbox Token** (new):
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```
Get from: https://account.mapbox.com/

**Google API Key** (already exists):
```bash
GOOGLE_PLACES_API_KEY=AIza...
```
Can be used for both Places API and Directions API.

### Installation

```bash
# Install Mapbox GL JS
npm install mapbox-gl
npm install --save-dev @types/mapbox-gl

# No other deps needed (Google Directions uses fetch)
```

---

## Implementation Phases

### Phase 1: Database & API (2-3 days)
- [ ] Create migration: `003_roadtrip_schema.sql`
- [ ] Run migration: `npx tsx scripts/db/apply-migration.ts`
- [ ] Build Google Directions service: `/src/lib/google-directions.ts`
- [ ] Extend Supabase helpers: route cache methods in `/src/lib/supabase.ts`
- [ ] Build API route: `/src/app/api/roadtrip/route.ts`
- [ ] Test API with Postman/curl

### Phase 2: Frontend Core (3-4 days)
- [ ] Create page structure: `/src/app/roadtrip/page.tsx`
- [ ] Build main component: `RoadTripPlanner.tsx`
- [ ] Build search form: `SearchForm.tsx`
- [ ] Get Mapbox token, add to env
- [ ] Build map component: `RouteMap.tsx`
- [ ] Test route rendering

### Phase 3: Restaurant Display (2-3 days)
- [ ] Build restaurant list: `RestaurantList.tsx`
- [ ] Add restaurant markers to map
- [ ] Implement marker/list interaction
- [ ] Add popups with restaurant info
- [ ] Test full flow

### Phase 4: Polish & Deploy (1-2 days)
- [ ] Mobile responsive CSS
- [ ] Error handling (invalid addresses, no results)
- [ ] Loading states
- [ ] SEO metadata
- [ ] Deploy to Vercel
- [ ] Test production

**Total: 8-12 days** for full implementation

---

## Testing Plan

### Manual Testing

**Happy Path:**
- [ ] Enter "San Francisco, CA" → "Los Angeles, CA" → see route + restaurants
- [ ] Click marker → restaurant highlighted in list
- [ ] Click restaurant card → map centers on marker
- [ ] Adjust radius → new results
- [ ] "View Details" → navigates to restaurant page

**Edge Cases:**
- [ ] Invalid address → error message
- [ ] No restaurants found → empty state
- [ ] Same origin/destination → error
- [ ] Very long route (>500 miles) → performance ok

**Cache Testing:**
- [ ] First request → Google API called
- [ ] Second request (same route) → cache hit
- [ ] Check database: `hit_count` incremented

### E2E Testing (Optional)

Use Playwright to test full flow:
```typescript
test('Road trip planner', async ({ page }) => {
  await page.goto('/roadtrip');
  await page.fill('[name="origin"]', 'San Francisco, CA');
  await page.fill('[name="destination"]', 'Los Angeles, CA');
  await page.click('button:text("Plan My Route")');
  await page.waitForSelector('[data-testid="route-map"]');
  expect(await page.locator('[data-testid="restaurant-card"]').count()).toBeGreaterThan(0);
});
```

---

## Future Enhancements

**Phase 2 (if user demand):**
- Google Places Autocomplete for inputs
- Multi-stop routing (A → B → C)
- Save routes (user accounts)
- Share routes (URL sharing)
- Export to Google Maps button

**Advanced (if scaling):**
- Route optimization (minimize detours)
- Time-based planning (breakfast/lunch/dinner stops)
- Alternative routes
- Social features (route reviews)

---

## Open Questions

- [ ] Should we add Google Places Autocomplete for inputs? (Adds complexity + cost)
- [ ] Default radius: 10 miles ok? Or make it 5 miles?
- [ ] Should we show route distance/duration in UI?
- [ ] Should we add "Get Directions" button that opens Google Maps?

---

## Success Metrics

**MVP Success:**
- Feature works end-to-end
- No errors in production
- Cache hit rate >50% after week 1
- API costs stay within free tier

**User Engagement:**
- Track route planning events in PostHog
- Monitor popular routes (SF→LA, NYC→Boston, etc.)
- Measure conversion: searches → restaurant page views

---

## References

- Mapbox GL JS Docs: https://docs.mapbox.com/mapbox-gl-js/
- Google Directions API: https://developers.google.com/maps/documentation/directions
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html
- Existing homepage map: `/src/components/RestaurantMapPins.tsx`
