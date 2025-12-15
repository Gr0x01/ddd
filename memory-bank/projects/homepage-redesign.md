---
title: Homepage Redesign - Road Trip First
created: 2025-12-15
completed: 2025-12-16
status: Completed
priority: High
---

# Homepage Redesign: Road Trip-First Strategy

**Status**: ✅ Completed & Deployed

## Project Goal
Transform homepage from generic restaurant map to road trip planning tool. Differentiate from competitor "garbage" static list sites by making the site action-oriented and actually useful.

## Strategic Context

**Market Reality:**
- Top 2 DDD sites: high traffic, garbage UX, outdated data
- Niche competitors: slightly better but still static lists
- **Our moat**: Road trip planner + verified status + modern UX

**User Journey Shift:**
- **Old**: "Browse all restaurants on a map"
- **New**: "Plan a road trip, then browse/discover"

---

## What Was Built

### 1. Hero: Road Trip Planner ✅
**Purpose**: Immediate action, unique value prop

**Implemented:**
- [x] Bold yellow hero section with road trip search form
- [x] Start city autocomplete (CityAutocomplete component)
- [x] End city autocomplete
- [x] Radius selector (10/25/50/100 miles)
- [x] Big CTA: "Plan Your Route"
- [x] Stats display: "1,541 restaurants. 1,151 verified open."
- [x] Mobile-responsive design
- [x] Loading states during search
- [x] Redirects to `/route/[slug]` after search

**Components:**
- `src/components/home/HeroSection.tsx`
- `src/components/home/HeroRoadTrip.tsx`

---

### 2. Popular Routes ✅
**Purpose**: SEO, social sharing, inspiration, quick wins

**Implemented:**
- [x] Visual route cards with stats
- [x] Route name: "San Francisco → Los Angeles"
- [x] Stats: restaurant count, distance, drive time
- [x] Click → dedicated route page
- [x] Curated routes in database

**Curated Routes Built:**
- [x] San Francisco → Los Angeles
- [x] New York → Boston
- [x] Chicago → Milwaukee
- [x] Austin → San Antonio
- [x] Portland → Seattle
- [x] Miami → Key West
- [x] Nashville → Memphis
- [x] Denver → Boulder

**Components:**
- `src/components/homepage/PopularRoutes.tsx`
- `src/components/ui/RouteCard.tsx`
- `src/app/route/[slug]/page.tsx`

**Technical:**
- [x] Route pages: `/route/[slug]`
- [x] Database: `route_cache` table with slug, is_curated, view_count
- [x] Sitemap: curated routes included
- [x] Social meta tags for sharing

---

### 3. Browse Section ✅
**Purpose**: SEO, alternative discovery paths

**Implemented:**
- [x] Browse by State grid
- [x] Browse by Cuisine links
- [x] Still Open page (1,151 restaurants)
- [x] Closed page (390 restaurants)
- [x] All Episodes link (572 episodes)

**Components:**
- `src/components/homepage/BrowseSection.tsx`

---

### 4. Featured Restaurants ✅
**Purpose**: Multiple engagement hooks - trust, discovery

**Implemented:**
- [x] Iconic Triple D Spots section
- [x] Featured restaurants with photos
- [x] Guy Fieri quotes displayed

**Components:**
- `src/components/homepage/IconicSpots.tsx`
- `src/components/homepage/FeaturedWinners.tsx`

---

### 5. Additional Sections ✅

**Discovery Row:**
- [x] Cuisine discovery with visual cards
- `src/components/homepage/DiscoveryRow.tsx`

**Shows Showcase:**
- [x] Episode highlights
- `src/components/homepage/ShowsShowcase.tsx`

**Route Preview:**
- [x] Featured routes preview on homepage
- `src/components/homepage/RoutePreview.tsx`

---

## Technical Implementation ✅

### Phase 1: Route Pages & Database ✅
- [x] Added columns to route_cache: slug, is_curated, view_count
- [x] Created `/app/route/[slug]/page.tsx`
- [x] Built curated routes with SEO-optimized content
- [x] Added routes to sitemap
- [x] Social sharing meta tags

### Phase 2: Homepage Components ✅
- [x] Hero component with road trip search
- [x] Popular routes section (cards component)
- [x] Featured restaurants sections
- [x] Browse/quick links section

### Phase 3: Design System Integration ✅
- [x] Bold yellow hero matching site aesthetic
- [x] Consistent card patterns
- [x] Mobile responsiveness
- [x] Loading states

### Phase 4: Route Saving/Sharing ✅
- [x] User-generated routes get shareable URLs
- [x] Route pages show view counts
- [x] Curated routes promoted on homepage

---

## Competitive Differentiation ✅

| Feature | Garbage Sites | Our Site |
|---------|---------------|----------|
| Data freshness | 2019, outdated | 100% verified Dec 2025 ✅ |
| Road trip planning | None | ✅ Unique feature |
| Status verification | No | ✅ 100% verified |
| Mobile UX | Terrible | Modern, responsive ✅ |
| Actionable | No (just lists) | Yes (plan trips) ✅ |
| Latest episodes | Rarely updated | Current + highlighted ✅ |

---

## Components Created

### Homepage Components
| Component | Path | Purpose |
|-----------|------|---------|
| HeroSection | `src/components/home/HeroSection.tsx` | Bold yellow hero |
| HeroRoadTrip | `src/components/home/HeroRoadTrip.tsx` | Road trip form |
| PopularRoutes | `src/components/homepage/PopularRoutes.tsx` | Route cards grid |
| BrowseSection | `src/components/homepage/BrowseSection.tsx` | State/cuisine browse |
| IconicSpots | `src/components/homepage/IconicSpots.tsx` | Featured restaurants |
| DiscoveryRow | `src/components/homepage/DiscoveryRow.tsx` | Cuisine discovery |
| ShowsShowcase | `src/components/homepage/ShowsShowcase.tsx` | Episode highlights |
| RoutePreview | `src/components/homepage/RoutePreview.tsx` | Featured routes |

### Shared Components
| Component | Path | Purpose |
|-----------|------|---------|
| RouteCard | `src/components/ui/RouteCard.tsx` | Reusable route display |
| PageHero | `src/components/ui/PageHero.tsx` | Page hero sections |

---

## Database Changes

### route_cache Table Additions
- `slug TEXT UNIQUE` - URL-friendly route identifier
- `is_curated BOOLEAN DEFAULT FALSE` - Manual curation flag
- `view_count INTEGER DEFAULT 0` - Page view tracking

### RPC Functions
- `get_routes_with_counts()` - Single-query restaurant counts
- `increment_route_views(route_id)` - Atomic view counter

---

## Decisions Made

1. **Featured Restaurants**: Went with iconic spots + featured winners (2 sections)
2. **Curated Routes**: Built 8 initial routes for popular corridors
3. **Mobile**: Full functionality on mobile, not simplified
4. **Stats Placement**: Prominent in hero section
5. **Restaurant Map**: Moved to `/restaurants` page, not homepage

---

## Success Metrics

**SEO** ✅:
- Route pages indexed
- Homepage optimized for "diners drive-ins and dives" queries
- All curated routes in sitemap

**Engagement** (tracked via PostHog):
- Road trip searches from homepage
- Route page views
- Popular routes click-through

**Trust** ✅:
- "Verified open" stats visible on homepage
- 100% status verification complete

---

## Related Documents

- `/memory-bank/archive/roadtrip-planner.md` - Road trip implementation details
- `/memory-bank/core/quickstart.md` - Current project status
- `/memory-bank/development/activeContext.md` - Active development context
