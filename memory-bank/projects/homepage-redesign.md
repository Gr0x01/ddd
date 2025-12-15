---
title: Homepage Redesign - Road Trip First
created: 2025-12-15
status: Planning
priority: High
---

# Homepage Redesign: Road Trip-First Strategy

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

## Homepage Structure (Proposed)

### 1. Hero: Road Trip Planner
**Purpose**: Immediate action, unique value prop

**Elements:**
- [ ] Headline: "Plan Your Guy Fieri Road Trip" (or similar)
- [ ] Start city autocomplete (existing CityAutocomplete component)
- [ ] End city autocomplete
- [ ] Radius slider (5-25 miles)
- [ ] Big CTA: "Find Restaurants" or "Plan Route"
- [ ] Subtext: "1,541 Diners, Drive-ins and Dives locations. 1,151 verified open."

**Design Needs:**
- [ ] Match site aesthetic (not current generic road trip page styling)
- [ ] Mobile-responsive (might need simplified mobile version)
- [ ] Loading states
- [ ] Error handling

---

### 2. Popular Routes (6-8 Cards)
**Purpose**: SEO, social sharing, inspiration, quick wins

**Elements:**
- [ ] Visual cards with mini-map thumbnails (or route icons)
- [ ] Route name: "San Francisco → Los Angeles"
- [ ] Stats: restaurant count, distance, drive time
- [ ] Click → dedicated route page

**Routes to Curate (Initial List):**
- [ ] San Francisco → Los Angeles
- [ ] New York → Boston
- [ ] Chicago → Milwaukee
- [ ] Austin → San Antonio
- [ ] Portland → Seattle
- [ ] Miami → Key West
- [ ] Nashville → Memphis
- [ ] Denver → Boulder

**Technical Needs:**
- [ ] Route pages: `/route/[slug]`
- [ ] Database: add slug, is_curated, view_count, description to route_cache
- [ ] Sitemap: include curated routes
- [ ] Social meta tags for sharing

---

### 3. Latest Episode
**Purpose**: Trust signal - proves site is current, not abandoned

**Elements:**
- [ ] Section heading: "Just Added" or "Latest Episode"
- [ ] Episode info: Season, Episode number, Title, Air date
- [ ] 3-4 restaurants from that episode (cards with photos)
- [ ] "All restaurants verified open ✓" badge (if true)
- [ ] Link to full episode page

**Questions:**
- [ ] Should we auto-update this, or manually curate which episode to feature?
- [ ] What if latest episode has all closed restaurants? Skip the badge?

---

### 4. Featured Restaurants (Hybrid Sections)
**Purpose**: Multiple engagement hooks - trust, discovery, personalization

**Option D: Multiple Sections (PREFERRED)**

#### Section A: "Recently Verified Still Open"
- [ ] 6-8 restaurants with green "OPEN ✓" badges
- [ ] "Verified [date]" timestamp
- [ ] Differentiation: shows we actually maintain data

#### Section B: "Iconic Triple D Spots" or "Fan Favorites"
- [ ] 8-10 hand-picked legendary restaurants
- [ ] Large photos
- [ ] Guy Fieri quotes
- [ ] High engagement potential

#### Section C: "Near You" (Optional - Geolocation)
- [ ] Request location permission
- [ ] Show 5 closest restaurants
- [ ] Personalized experience
- [ ] Fallback: show popular city if denied

**Questions:**
- [ ] How many sections? All three!
- [ ] Order: Which section comes first? C, B, A
- [ ] How do we pick "iconic" spots? (Most popular?)

---

### 5. Browse/Quick Links
**Purpose**: SEO, alternative discovery paths

**Elements:**
- [ ] Browse by State (grid or list)
- [ ] Browse by Cuisine (top 10-15 cuisines)
- [ ] Still Open (1,151 restaurants)
- [ ] Closed (390 restaurants) - curiosity traffic
- [ ] All Episodes (572 episodes)

---

## Competitive Differentiation

| Feature | Garbage Sites | Our Site |
|---------|---------------|----------|
| Data freshness | 2019, outdated | 100% verified Dec 2025 |
| Road trip planning | None | ✅ Unique feature |
| Status verification | No | ✅ 100% verified |
| Mobile UX | Terrible | Modern, responsive |
| Actionable | No (just lists) | Yes (plan trips) |
| Latest episodes | Rarely updated | Current + highlighted |

---

## Technical Implementation Plan

### Phase 1: Route Pages & Database (SEO Quick Win)
- [ ] Add columns to route_cache: slug, is_curated, view_count, description
- [ ] Create `/app/route/[slug]/page.tsx`
- [ ] Build 10-20 curated routes with SEO-optimized content
- [ ] Add routes to sitemap
- [ ] Social sharing meta tags

### Phase 2: Homepage Components (UX Win)
- [ ] Hero component with road trip search (reuse existing components)
- [ ] Popular routes section (cards component)
- [ ] Latest episode section
- [ ] Featured restaurants sections (decide which ones)
- [ ] Browse/quick links section

### Phase 3: Design System Integration
- [ ] Audit existing site design (colors, typography, spacing)
- [ ] Apply design system to all new components
- [ ] Mobile responsiveness testing
- [ ] Loading states, error states, empty states

### Phase 4: Route Saving/Sharing
- [ ] User-generated routes get shareable links
- [ ] Route page shows "X people searched this route"
- [ ] Popular routes auto-promotion (e.g., >100 searches → suggest curation)

---

## Open Decisions

### Critical Decisions (Need User Input)

1. **Featured Restaurants Philosophy:**
   - All three sections (verified open + iconic + near you)?
   - Just two sections? Which two?
   - Order/priority?

2. **Curated Routes Priority:**
   - Build route pages first (SEO) or homepage first (UX)?
   - How many initial routes? 10, 20, 50?

3. **Latest Episode:**
   - Auto-update to always show newest?
   - Manually curate which episode to feature?

4. **Mobile Priority:**
   - Road trip planning on mobile, or just browse?
   - Simplified mobile hero?

5. **Stats Placement:**
   - Prominent in hero subtext?
   - Separate stats section?
   - Subtle footer?

6. **Restaurant Map:**
   - Move to `/map` or `/browse` or `/restaurants`?
   - Keep in main nav, or bury it?

### Design Decisions (Can Decide Later)

- [ ] Visual style for route cards (map thumbnails vs. icons vs. photos)
- [ ] How to pick "iconic" restaurants (criteria?)
- [ ] Color scheme for "verified open" badges
- [ ] Loading skeleton designs
- [ ] Error message copy

---

## Success Metrics

**SEO:**
- Route pages indexed
- Ranking for "[city] to [city] guy fieri" queries
- Backlinks to route pages

**Engagement:**
- Road trip searches (track in analytics)
- Route shares (social + direct links)
- Time on site (longer = more engaged)

**Trust:**
- "Verified open" badge visibility
- Latest episode keeps people coming back

---

## Next Steps

1. **Discuss & Decide** (This Doc):
   - [ ] Narrow down featured restaurants sections (all 3, or which 2?)
   - [ ] Decide route pages vs homepage priority
   - [ ] Clarify mobile strategy

2. **Build Route Pages** (SEO Quick Win):
   - [ ] Database migration
   - [ ] Create route template page
   - [ ] Generate 10-20 curated routes

3. **Redesign Homepage** (UX Win):
   - [ ] Design audit (existing site colors/typography)
   - [ ] Build components
   - [ ] Integration testing

4. **Polish & Launch:**
   - [ ] Playwright tests
   - [ ] Deploy
   - [ ] Submit route pages to Google Search Console

---

## Related Documents

- `/memory-bank/core/quickstart.md` - Current project status
- `/memory-bank/development/activeContext.md` - Road trip planner context
- `/memory-bank/projects/roadtrip-autocomplete.md` - City autocomplete implementation

---

## Notes & Ideas

- Route pages could have "Download as PDF" for printing
- "Email me this route" feature for planning later
- Route pages could show gas stations, hotels along route (future)
- User accounts to save favorite routes (future, not MVP)
- Comments on routes? (probably not - complexity)
