# Diners, Drive-Ins and Dives Directory

**Last Updated:** 2025-12-14  
**Status:** Phase 0 - Research & Planning  
**Repo:** TBD

---

## Executive Summary

A restaurant directory for every location featured on Guy Fieri's "Diners, Drive-Ins and Dives" (DDD). This is the **highest-traffic opportunity** in the portfolio so far - main competitor pulls 263k monthly visitors, 3.5x larger than Shark Tank's 72k.

**Why this works:**
- Same template as cheft.app (restaurant + map + TV show)
- Massive search volume on restaurant names and city searches
- Competitor has grown from 80k → 263k traffic in 12 months (market expanding)
- Clear monetization via restaurant affiliate programs, local ads

---

## Competitor Analysis

### Primary Competitors

| Domain | Monthly Traffic | Backlinks | Keywords Gap |
|--------|----------------|-----------|--------------|
| dinersdriveinsdiveslocations.com | 263,097 | 22,136 | 39,829 |
| flavortownusa.com | 86,392 | 23,570 | 12,211 |

### Traffic Trends
- dinersdriveinsdiveslocations.com: Explosive growth Aug-Nov 2025 (125k → 263k)
- flavortownusa.com: Stable 50-90k range, consistent performer
- Market is clearly expanding, not saturated

### Top Ranking Keywords - dinersdriveinsdiveslocations.com

| Keyword | Volume | Position | Est. Visits | SEO Difficulty |
|---------|--------|----------|-------------|----------------|
| brandys | 246,000 | 97 | 632 | 63 |
| look's | 135,000 | 62 | 284 | 27 |
| dirty water dough | 110,000 | 45 | 231 | 39 |
| runza restaurants | 110,000 | 61 | 231 | 47 |
| drive in and diners | 90,500 | 17 | 507 | 71 |
| diners and dives | 90,500 | 10 | 2,317 | 57 |
| drive in diners and dives | 90,500 | 11 | 1,783 | 68 |
| dine and dives | 90,500 | 15 | 824 | 62 |
| diners savannah ga | 90,500 | 19 | 679 | 39 |
| diners savannah | 90,500 | 30 | 199 | 40 |

### Top Ranking Keywords - flavortownusa.com

| Keyword | Volume | Position | Est. Visits | SEO Difficulty |
|---------|--------|----------|-------------|----------------|
| dirty water dough | 110,000 | 56 | 231 | 39 |
| dives diners and drive | 90,500 | 5 | 5,964 | 52 |
| dine and dives | 90,500 | 3 | 8,806 | 62 |
| drive in diners and dives | 90,500 | 4 | 8,806 | 68 |
| diner and drive ins | 90,500 | 5 | 5,964 | 76 |
| diners drive ins and dives | 90,500 | 3 | 14,661 | 61 |
| san antonio diners | 90,500 | 21 | 462 | 24 |
| diners savannah ga | 90,500 | 28 | 208 | 39 |

### Key Insights

1. **Restaurant names are massive** - Individual restaurant searches (brandys 246k, look's 135k) dwarf show terms
2. **City searches are gold** - "diners savannah ga", "san antonio diners" have 90k volume with medium difficulty
3. **Brand term competition is real** - flavortownusa.com owns position 3-5 for core "diners drive ins and dives" variants
4. **Long tail is wide open** - 39k+ keyword gap means tons of uncontested terms

### What Competitors Do Well

**dinersdriveinsdiveslocations.com:**
- Comprehensive coverage (appears to have most/all locations)
- Strong on individual restaurant pages
- Growing fast (someone is investing in SEO)

**flavortownusa.com:**
- Owns brand terms (position 3-5)
- Clean, focused site
- Good city pages

### Where They're Weak (Our Opportunities)

1. **No "still open" verification** - Restaurants close constantly. "Last verified: [date]" is a trust signal neither has.

2. **Weak map experience** - Static or basic maps. A proper interactive map (like cheft.app) is differentiated.

3. **No dish-level search** - "Best burger diners drive ins and dives" / "DDD mac and cheese" - nobody owns this.

4. **Episode freshness** - New episodes air, who's fastest to publish? DDD still produces new content.

5. **No "nearby" intelligence** - "DDD restaurants near me" requires geolocation. Neither does this well.

6. **City guides are shallow** - "Complete guide to DDD restaurants in Austin" as a real content piece, not just a list.

7. **No cuisine filtering** - BBQ, Mexican, breakfast spots, burgers - users want to filter by food type.

8. **Mobile UX** - Both are dated. Modern, fast mobile experience wins.

---

## Content Strategy

### High-Priority Pages

1. **Restaurant pages** - Every restaurant gets a page with:
   - Open/closed status + last verified date
   - Episode(s) featured in
   - Dishes highlighted on show
   - Location + map
   - Hours, website, phone (when available)
   - Photos
   
2. **City/State pages** - Geographic browse:
   - All DDD restaurants in [City]
   - All DDD restaurants in [State]
   - Interactive map for region
   - "Still open" filter prominent

3. **Episode pages** - For fans browsing by show:
   - Season/episode info
   - All restaurants from that episode
   - Air date
   - Guy's route (if multi-city episode)

4. **Cuisine pages** - Browse by food type:
   - DDD BBQ spots
   - DDD breakfast diners
   - DDD burger joints
   - DDD Mexican restaurants

5. **"Best of" pages** - Curated lists:
   - Best DDD restaurants still open
   - Guy's favorite spots (most revisits)
   - Highest rated on Google/Yelp
   - Best DDD restaurants by state

### Long-tail Keyword Opportunities

- "[restaurant name] diners drive ins and dives"
- "[restaurant name] ddd"
- "[restaurant name] guy fieri"
- "ddd restaurants near me"
- "diners drive ins and dives [city]"
- "best ddd restaurants [state]"
- "ddd [cuisine type]" (bbq, burgers, tacos, etc.)
- "is [restaurant name] still open"
- "ddd restaurants that closed"
- "guy fieri restaurants [city]"

### Content Differentiators

1. **Freshness** - Automated verification of open/closed status
2. **Completeness** - Every episode, every restaurant, every dish
3. **Search** - Natural language: "BBQ in Texas that's still open"
4. **Maps** - Interactive, filterable, beautiful (cheft.app quality)

---

## Data Model

### Core Tables

**restaurants**
- Basic: name, slug, address, city, state, zip, country
- Location: latitude, longitude, neighborhood
- Contact: phone, website_url, social_urls (jsonb)
- Hours: hours_json, hours_notes
- Status: status (open/closed/unknown), last_verified, verification_source
- Episode: first_episode_id, episodes[] (array), first_air_date
- Content: description, dishes_featured[], guy_quote
- Media: photo_url, photos[] (jsonb)
- Ratings: google_rating, yelp_rating, google_review_count
- SEO: meta_description
- Enrichment: enrichment_status, last_enriched_at

**episodes**
- Basic: season, episode_number, title, slug
- Meta: air_date, description, meta_description
- Content: episode_summary, cities_visited[]

**cuisines** (categories)
- Basic: name, slug, description
- SEO: meta_description
- Hierarchy: parent_id (optional, for subcategories)

**dishes**
- Basic: name, slug, description
- Link: restaurant_id, episode_id
- Content: guy_reaction, is_signature_dish

**restaurant_cuisines** (junction)
- restaurant_id, cuisine_id

**restaurant_episodes** (junction)
- restaurant_id, episode_id
- segment_notes (what Guy said/featured)

**states**
- Basic: name, abbreviation, slug
- SEO: meta_description
- Stats: restaurant_count (computed)

**cities**
- Basic: name, slug, state_id
- SEO: meta_description
- Stats: restaurant_count (computed)

### Views

- `restaurants_full` - Restaurants with cuisines, episodes, city/state aggregated
- `city_stats` - Cities with restaurant counts, open/closed breakdown
- `state_stats` - States with restaurant counts
- `episode_restaurants` - Episodes with all restaurants listed

### Seed Data Sources

1. **Wikipedia** - Episode lists with restaurant names and locations
2. **Food Network** - Official episode guides
3. **Existing competitors** - Validate completeness
4. **Google Places API** - Verify open/closed, get ratings

---

## Site Architecture

### Core Pages
```
/                               Homepage (map + search + browse)
/restaurants                    All restaurants (filterable grid)
/restaurants/[slug]             Individual restaurant page
/cities                         Browse by city
/cities/[state]/[city]          City page with map
/states                         Browse by state
/states/[state]                 State page with all cities
/episodes                       Episode archive
/episodes/[season]              Season page
/episodes/[season]/[episode]    Episode page
/cuisines                       Browse by cuisine
/cuisines/[slug]                Cuisine page (all BBQ spots, etc.)
```

### High-Value Content Pages
```
/still-open                     Verified open restaurants (trust signal)
/closed                         Closed restaurants (curiosity traffic)
/near-me                        Geolocation-based discovery
/roadtrip                       Road trip planner
/roadtrip/[origin]-to-[dest]    Shareable trip URL
/best                           Best of / curated lists
/best/[state]                   Best in state
/best/[cuisine]                 Best by cuisine type
/map                            Full-screen interactive map
/new                            Recently featured restaurants
```

### Restaurant Page Must-Haves
```
- Status badge: ✅ Open | ⚠️ Unverified | ❌ Closed
- Last verified date
- Episode(s) featured with air date
- Dishes Guy loved
- Map with location
- Hours, phone, website
- Google/Yelp ratings
- Nearby DDD restaurants
- "Directions" button (Google Maps link)
```

### Filters We Need
```
- Status: Open / Closed / All
- Cuisine: Multi-select
- State: Multi-select or search
- City: Search
- Season: Range or multi-select
- Rating: Minimum stars
- Distance: If using geolocation
```

---

## Road Trip Feature

### MVP Scope
Point A → Point B with shareable URLs. Simple and useful.

### User Flow
1. User lands on `/roadtrip`
2. Enter origin city and destination city
3. Click "Find restaurants"
4. See route on map with DDD restaurants within 10mi of route
5. Results show: restaurant name, distance from route, cuisine, status
6. URL updates to `/roadtrip/austin-to-houston` (shareable)

### Technical Implementation

**API Requirements:**
- Google Directions API (or Mapbox) - get route polyline
- PostGIS - query restaurants near the route linestring

**Core Query:**
```sql
SELECT r.*, 
  ST_Distance(r.location::geography, route.geom::geography) / 1609.34 as miles_from_route
FROM restaurants r, route
WHERE ST_DWithin(r.location::geography, route.geom::geography, 16093)  -- 10 miles
  AND r.status = 'open'
ORDER BY miles_from_route;
```

**URL Structure:**
- `/roadtrip` - Empty planner
- `/roadtrip/austin-tx-to-houston-tx` - Shareable with results
- Query params for filters: `?cuisine=bbq&maxDetour=20`

**Map Display:**
- Route line (polyline from Directions API)
- Restaurant markers along route
- Click marker → restaurant card popup
- "Open in Google Maps" for navigation

### Cost Estimate
- Google Directions API: 40k free requests/month, then $5/1k
- Supabase PostGIS: Included in free tier
- Expected usage: Well under free tier initially

### SEO Opportunity
Pre-generate popular routes as static pages:
- `/roadtrip/los-angeles-to-las-vegas` 
- `/roadtrip/dallas-to-austin`
- `/roadtrip/miami-to-orlando`

These can rank for "road trip diners [route]" searches.

---

## Freshness Strategy

### What Goes Stale
- Open/closed status (restaurants close constantly)
- Hours of operation
- Phone numbers
- Websites (domains expire)
- Ratings (change over time)
- Ownership (restaurants get sold)

### Verification Cadence
- **Weekly**: Top 100 restaurants by traffic
- **Monthly**: All restaurants with recent page views
- **Quarterly**: Full database sweep
- **On-demand**: User reports, Google Places API batch

### Verification Methods
1. **Google Places API** - Business status, hours, ratings
2. **Website check** - Is the domain still active?
3. **Yelp API** - Cross-reference status
4. **User reports** - "Report closed" button on each page

---

## Technical Architecture

### Stack
- **Frontend**: Next.js (same as cheft.app)
- **Database**: Supabase (Postgres + PostGIS for geo)
- **Maps**: Mapbox or Leaflet (same as cheft.app)
- **Enrichment**: LLM pipeline for data normalization
- **Verification**: Cron jobs hitting Google Places API

### Reuse from cheft.app
- Map component
- Restaurant card component
- Filter sidebar
- Search interface
- Mobile-responsive layout
- LLM enrichment pipeline

### New Components Needed
- Cuisine filter system
- Episode browsing
- Dish showcase
- City/State pages
- "Near me" geolocation

---

## Monetization Strategy

### Phase 1: Traffic Building
- Focus on SEO and content
- No monetization until 10k+ monthly visitors

### Phase 2: Display Ads
- Mediavine or AdThrive (when traffic qualifies)
- Estimated RPM: $15-25 for food/travel content

### Phase 3: Affiliate & Local
- Restaurant reservation affiliates (Resy, OpenTable)
- Local advertising for featured restaurants
- "Claim your listing" for restaurant owners

### Revenue Projections (Conservative)
- 50k visitors @ $20 RPM = $1,000/month
- 100k visitors @ $20 RPM = $2,000/month
- 200k visitors @ $20 RPM = $4,000/month

---

## Launch Strategy

### Phase 1: MVP (2-3 weeks)
- [ ] Database schema deployed
- [ ] Initial data scrape (Wikipedia + manual)
- [ ] Basic restaurant pages
- [ ] City/state pages
- [ ] Simple map view
- [ ] Search functionality
- [ ] Road trip planner (Point A → Point B with restaurants along route)

### Phase 2: Enrichment (1-2 weeks)
- [ ] LLM enrichment for descriptions
- [ ] Google Places API integration
- [ ] Open/closed verification
- [ ] Ratings import

### Phase 3: Polish (1 week)
- [ ] Episode pages
- [ ] Cuisine filtering
- [ ] "Near me" geolocation
- [ ] Mobile optimization
- [ ] Performance tuning

### Phase 4: Launch
- [ ] Submit to Google Search Console
- [ ] Reddit communities (r/DinersDD, r/guyfieri, food subs)
- [ ] Social media presence
- [ ] Monitor rankings

---

## Open Questions

- [ ] Domain name - flavortownmap.com? dddmap.com? tripledfinder.com?
- [ ] How many restaurants total? (estimate: 1,000-1,500+)
- [ ] How many episodes? (30+ seasons!)
- [ ] Photo sourcing strategy - Google Places? User submitted?
- [ ] Handle international locations? (show has filmed abroad)
- [ ] Guy's own restaurants vs. featured restaurants - separate or together?

---

## Competitive Advantages

1. **Freshness** - Automated verification competitors lack
2. **Map UX** - Interactive map (cheft.app proven)
3. **Search** - Natural language with filters
4. **Speed** - Modern stack, fast loading
5. **Mobile** - Mobile-first design
6. **Template reuse** - Faster to market using cheft.app patterns

---

## Notes

- Show has been running since 2007 - massive backlog of content
- Still producing new episodes - ongoing content pipeline
- Guy Fieri is a cultural phenomenon - strong brand association
- Food Network audience skews older, but searches are universal
- "Triple D" is common shorthand for the show
- Potential crossover with cheft.app (some chefs appear on both)