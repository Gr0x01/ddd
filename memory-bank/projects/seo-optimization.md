---
title: SEO Optimization - Keyword Gap Analysis
created: 2025-12-25
status: Phase 1 Complete
priority: High
data-source: DataForSEO Labs API
---

# SEO Optimization: Closing the Keyword Gap

**Status**: Phase 3 Complete
**Data Date**: December 25, 2025
**Analysis Tool**: DataForSEO Labs API

## Executive Summary

DataForSEO analysis reveals a massive keyword gap between tripledmap.com and the primary competitor (dinersdriveinsdiveslocations.com). The competitor dominates with 39,377 ranked keywords vs our 57, capturing ~445,000 monthly organic traffic.

**Key Insight**: The competitor ranks well for two primary keyword patterns we're missing:
1. **"[City] diners"** queries (40k-90k volume each)
2. **Show name variations** (90k+ volume)

These represent low-hanging fruit since we already have the content (city pages, restaurant data) - we just need to optimize for these search patterns.

---

## Current State Analysis

### Domain Comparison

| Metric | tripledmap.com | dinersdriveinsdiveslocations.com |
|--------|---------------|----------------------------------|
| Total Keywords | 57 | 39,377 |
| Position #1 | 0 | 1,417 |
| Position 2-3 | 0 | 1,323 |
| Position 4-10 | 4 | 2,617 |
| Position 11-20 | 7 | 6,724 |
| Est. Monthly Traffic | ~32 | ~445,000 |

### Our Current Rankings (Top Performers)
```
Pos  6 | Vol 140 | "pak's green corner"
Pos 16 | Vol 170 | "marla's caribbean cuisine"
Pos 17 | Vol 140 | "mackinaws chehalis"
Pos 17 | Vol 170 | "hey meatball toronto"
Pos 18 | Vol 140 | "pak's green corner duluth"
```

**Pattern**: We rank for specific restaurant names, but miss broader discovery queries.

---

## Keyword Opportunities

### Tier 1: High Volume Show Queries (90,500 vol each)

Competitor ranks #9-17 for these show name variations:

| Keyword | Competitor Pos | Our Target |
|---------|---------------|------------|
| "diners dives" | 9 | Top 10 |
| "drive in diners and dives" | 9 | Top 10 |
| "diners and dives" | 10 | Top 10 |
| "dine and drive" | 11 | Top 10 |
| "dine in drive ins and dives" | 12 | Top 10 |
| "dine and dives" | 15 | Top 10 |
| "diner drive-ins and dives" | 17 | Top 10 |
| "diners drive-ins dive" | 17 | Top 10 |

**Implementation**: Add variations to homepage title, meta description, and H1. Create FAQ schema with common misspellings.

### Tier 2: City + Diners Queries (40k-90k vol)

High-volume local queries where competitor has top 20 positions:

| Keyword | Volume | Competitor Pos |
|---------|--------|---------------|
| "tampa diners" | 90,500 | 4 |
| "ann arbor diners" | 74,000 | 7 |
| "san antonio diners" | 74,000 | 16 |
| "fort lauderdale diners" | 60,500 | 8 |
| "knoxville diners" | 60,500 | 8 |
| "fort worth diners" | 60,500 | 13 |
| "nashville diners" | 60,500 | 19 |
| "kansas city diners" | 49,500 | 8 |
| "virginia beach diners" | 49,500 | 9 |
| "portland diners" | 49,500 | 18 |
| "annapolis diners" | 40,500 | 7 |
| "hoboken diners" | 40,500 | 7 |
| "palm springs diners" | 33,100 | 7 |
| "san jose diners" | 33,100 | 9 |
| "spokane diners" | 33,100 | 9 |

**Implementation**: Optimize city page titles/meta for "[City] diners" pattern.

### Tier 3: Guy Fieri Branded Queries

| Keyword | Volume | Notes |
|---------|--------|-------|
| "guy fieri restaurants" | 33,100 | Primary branded term |
| "guy fieri restaurants las vegas" | 12,100 | Location-specific |
| "guy fieri restaurants near me" | 2,900 | Intent-rich |
| "guy fieri restaurants locations" | 880 | List intent |

**Implementation**: Add "Guy Fieri" to homepage meta, consider dedicated landing page.

### Tier 4: Triple D Branded Queries

| Keyword | Volume |
|---------|--------|
| "triple d restaurants near me" | 1,900 |
| "triple d restaurants" | 1,600 |
| "triple d restaurants list" | 140 |
| "triple d restaurant list by state" | 140 |

**Implementation**: Already aligned with domain (tripledmap.com). Ensure homepage targets these.

### Tier 5: High-Volume Restaurant Names

Competitor ranks for specific restaurant queries. We should optimize our restaurant pages:

| Restaurant | Volume | Competitor Pos |
|------------|--------|---------------|
| "becky's diner" | 33,100 | 17 |
| "becky's diner portland" | 33,100 | 16 |
| "rainbow drive-in honolulu" | 40,500 | 18 |
| "bouldin creek cafe" | 40,500 | 13 |

**Implementation**: Ensure restaurant pages have proper schema, internal linking.

---

## Implementation Plan

### Phase 1: Quick Wins (Meta Optimization) ✅ COMPLETE

**Estimated Impact**: +500-2,000 monthly traffic
**Effort**: Low
**Completed**: December 25, 2025

#### 1.1 Homepage Meta Optimization

**Current Title** (assumed):
```
Triple D Map - Diners, Drive-ins and Dives Restaurant Finder
```

**Optimized Title**:
```
Diners, Drive-ins and Dives Restaurants | Guy Fieri Triple D Map
```

**Optimized Meta Description**:
```
Find 1,151 verified open restaurants from Diners, Drive-ins and Dives.
Browse Guy Fieri's Triple D picks by city, cuisine, or plan a road trip.
Updated December 2025.
```

**H1 Tag**:
```
Diners, Drive-ins and Dives Restaurant Map
```

**Secondary H2**:
```
Find Guy Fieri's Triple D Restaurants Near You
```

#### 1.2 City Page Meta Template

**Current Pattern** (assumed):
```
title: "[City], [State] - Triple D Restaurants"
```

**Optimized Pattern**:
```
title: "[City] Diners from Triple D | Diners, Drive-ins and Dives in [City], [State]"
meta: "Discover [X] restaurants in [City], [State] featured on Guy Fieri's
       Diners, Drive-ins and Dives. [X] still open. Find the best diners in [City]."
```

#### 1.3 State Page Meta Template

**Optimized Pattern**:
```
title: "[State] Diners | Diners, Drive-ins and Dives Restaurants in [State]"
meta: "All [X] Triple D restaurants in [State]. Browse by city, see which are
       still open, and plan your Guy Fieri food tour."
```

### Phase 2: Schema Markup Enhancement ✅ COMPLETE

**Estimated Impact**: +10-20% CTR improvement
**Effort**: Medium
**Completed**: December 25, 2025

#### 2.1 Restaurant Page Schema

Add comprehensive Restaurant schema to each restaurant page:

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Restaurant Name",
  "image": "...",
  "address": { "@type": "PostalAddress", ... },
  "geo": { "@type": "GeoCoordinates", ... },
  "telephone": "...",
  "priceRange": "$-$$$$",
  "servesCuisine": ["American", "BBQ"],
  "aggregateRating": { ... },
  "openingHoursSpecification": [ ... ],
  "isAccessibleForFree": true,
  "sameAs": ["yelp_url", "google_maps_url"]
}
```

#### 2.2 FAQ Schema for Homepage

Add FAQ schema targeting show name variations:

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Diners, Drive-ins and Dives?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Diners, Drive-ins and Dives (Triple D or DDD) is a Food Network show..."
      }
    },
    {
      "@type": "Question",
      "name": "How many restaurants are on Triple D?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Guy Fieri has featured over 1,541 restaurants across 572 episodes..."
      }
    }
  ]
}
```

#### 2.3 BreadcrumbList Schema

Ensure all pages have proper breadcrumb schema:

```
Home > California > Los Angeles > Restaurant Name
Home > Cuisines > BBQ > Restaurant Name
```

### Phase 3: Content Optimization ✅ COMPLETE

**Estimated Impact**: +1,000-5,000 monthly traffic
**Effort**: Medium-High
**Completed**: December 25, 2025

#### 3.1 City Page Content Enhancement ✅

Added introductory paragraph to city pages targeting "[City] diners" queries:
- Dynamic text mentions restaurant count, open count, and top cuisines
- Uses proper SEO-friendly language with keyword variations
- Example: "Looking for the best diners in Las Vegas? We've mapped all 42 restaurants in Las Vegas, NV that have been featured on Guy Fieri's Diners, Drive-ins and Dives. 35 are still open and serving the dishes that made them famous, including American, Mexican, and BBQ and more."

#### 3.2 State Page Content Enhancement ✅

Added state-level overview content:
- Dynamic text mentions restaurant count, city count, and top cuisines
- Internal link to road trip planner for cross-linking
- Example: "California is home to 298 restaurants featured on Guy Fieri's Diners, Drive-ins and Dives, from American to Mexican and BBQ, Seafood. Browse 87 cities below or use our road trip planner to visit multiple Triple D spots on your next trip."

#### 3.3 Homepage Content Sections ✅

Added text content sections to homepage:
- **"Popular Cities for Triple D Diners"** - Grid of top 12 cities by restaurant count with links
- **"About Diners, Drive-ins and Dives"** - 3 paragraphs explaining the show and our database
- **"How to Use Triple D Map"** - 3-column grid explaining Browse by Location, Plan a Road Trip, and Verified Status features

### Phase 4: Internal Linking

**Estimated Impact**: Improved crawlability, page authority distribution
**Effort**: Medium
**Timeline**: 3-4 days

#### 4.1 City Page Cross-Links

Link between nearby cities:
```
"Also explore: [Nearby City 1] diners, [Nearby City 2] diners"
```

#### 4.2 Restaurant Page Related Links

- Link to other restaurants in same city
- Link to other restaurants with same cuisine
- Link to episode page
- Link to "still open" or "closed" page

#### 4.3 Cuisine Page City Links

```
"Top cities for [Cuisine]: [City 1], [City 2], [City 3]"
```

### Phase 5: New Landing Pages (Optional)

**Estimated Impact**: +2,000-10,000 monthly traffic
**Effort**: High
**Timeline**: 1-2 weeks

#### 5.1 "Guy Fieri Restaurants" Landing Page

Dedicated page at `/guy-fieri-restaurants`:
- Title: "Guy Fieri's Restaurants | Complete List of Triple D Locations"
- Target: "guy fieri restaurants", "guy fieri restaurants near me"
- Content: Map, stats, search, featured restaurants

#### 5.2 "Near Me" Functionality

Add geolocation-based page at `/near-me`:
- Title: "Diners, Drive-ins and Dives Near Me | Triple D Restaurants"
- Target: "triple d restaurants near me", "ddd restaurants near me"
- Content: Geolocation prompt, nearest restaurants, radius filter

#### 5.3 Regional Landing Pages

Create regional hub pages:
- `/west-coast` - California, Oregon, Washington restaurants
- `/east-coast` - NY, MA, FL restaurants
- `/midwest` - Chicago, Minneapolis, etc.
- `/south` - Texas, Tennessee, etc.

---

## Technical Requirements

### Meta Tag Updates

Files to modify:
- `src/app/page.tsx` - Homepage
- `src/app/city/[state]/[city]/page.tsx` - City pages
- `src/app/state/[state]/page.tsx` - State pages
- `src/app/restaurant/[slug]/page.tsx` - Restaurant pages
- `src/lib/seo/meta-templates.ts` (create) - Centralized meta templates

### Schema Implementation

Files to modify:
- `src/lib/schema.ts` - Add Restaurant, FAQ schemas
- `src/app/restaurant/[slug]/page.tsx` - Restaurant schema
- `src/app/page.tsx` - FAQ schema
- `src/components/seo/Breadcrumbs.tsx` - Breadcrumb schema

### Content Components

Files to create:
- `src/components/seo/CityIntro.tsx` - City page intro text
- `src/components/seo/StateIntro.tsx` - State page intro text
- `src/components/seo/AboutSection.tsx` - Homepage about section

---

## Success Metrics

### Primary KPIs

| Metric | Current | 30-Day Target | 90-Day Target |
|--------|---------|---------------|---------------|
| Ranked Keywords | 57 | 200 | 1,000 |
| Top 10 Keywords | 4 | 20 | 100 |
| Organic Traffic | ~32 | 500 | 5,000 |

### Secondary KPIs

- Google Search Console impressions
- Click-through rate (CTR)
- Average position for target keywords
- Pages indexed

### Tracking

1. **DataForSEO**: Run `our-keywords` command weekly
2. **Google Search Console**: Monitor impressions, clicks, CTR
3. **PostHog**: Track organic landing pages

---

## Risk Assessment

### Low Risk
- Meta optimization (reversible, standard practice)
- Schema markup (Google recommended)
- Internal linking (improves UX)

### Medium Risk
- Significant title changes (may affect existing rankings)
- New landing pages (could cannibalize existing pages)

### Mitigation
- Implement Phase 1 first, monitor for 2 weeks
- A/B test major title changes if possible
- Use canonical tags to prevent cannibalization

---

## Scripts & Tools

### DataForSEO Analysis Script

```bash
# Check current rankings
npx tsx scripts/seo/dataforseo-analysis.ts our-keywords

# Check competitor keywords
npx tsx scripts/seo/dataforseo-analysis.ts competitor-keywords

# Find keyword opportunities
npx tsx scripts/seo/dataforseo-analysis.ts gap

# Get related keywords
npx tsx scripts/seo/dataforseo-analysis.ts related "guy fieri restaurants"
```

### Future: Rank Tracking Script

Create `scripts/seo/track-rankings.ts` to:
- Track target keywords weekly
- Store results in Supabase
- Alert on significant position changes

---

## References

- DataForSEO API: https://docs.dataforseo.com/v3/
- Schema.org Restaurant: https://schema.org/Restaurant
- Google Search Console: https://search.google.com/search-console
- Competitor: dinersdriveinsdiveslocations.com

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-25 | Phase 3 complete: Content optimization for city, state, and homepage |
| 2025-12-25 | Phase 2 complete: FAQ schema added to homepage, WebSite schema added |
| 2025-12-25 | Phase 1 complete: Meta optimization for homepage, city, state pages |
| 2025-12-25 | Initial analysis and plan created |
