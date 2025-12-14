---
Last-Updated: 2025-12-14
Maintainer: RB
Status: Defined
---

# Project Brief: DDD Restaurant Map + Directory

## Project Overview
A curated web application that maps and catalogs restaurants featured on Guy Fieri's "Diners, Drive-ins and Dives," with natural-language search capabilities powered by a structured database rather than generic web content.

## Market Opportunity
**This is the highest-traffic opportunity in the portfolio:**
- Primary competitor: 263k monthly visitors (3.5x larger than Shark Tank's 72k)
- Market expanding rapidly: 125k → 263k in 3 months (Aug-Nov 2025)
- 39,829 keyword gap shows massive long-tail opportunity
- Clear monetization via display ads ($20 RPM for food/travel)

**Top Competitors:**
- dinersdriveinsdiveslocations.com: 263k monthly traffic, 22k backlinks
- flavortownusa.com: 86k monthly traffic, 23k backlinks

## Core Purpose
Solve the problem of finding reliable information about DDD-featured restaurants without the noise of outdated blog posts, closed establishments, or inaccurate data found through general web search.

**Competitive Advantages:**
1. **Freshness** - Automated verification of open/closed status (competitors lack this)
2. **Map UX** - Interactive map experience (proven with cheft.app)
3. **Road Trip Feature** - Point A → Point B with restaurants along route
4. **Natural Language Search** - "BBQ in Texas that's still open"
5. **Mobile-First** - Modern, fast experience
6. **Speed to Market** - Reusing cheft.app template

## Target Users
- **Food enthusiasts** seeking authentic "Triple D" dining experiences
- **Travelers** wanting to visit Guy Fieri-featured establishments in new cities
- **Fans of DDD** looking to track which restaurants they've visited
- **Locals** discovering featured restaurants in their area
- **Road trippers** planning routes around DDD locations

## Key Features
### Core Functionality
- **Global restaurant map** with DDD locations
- **Advanced filtering** by city, cuisine type, price tier, episode, season
- **Natural-language search** ("Triple D burger joints in Texas under $20")
- **Curated database** with verified, up-to-date information
- **Episode integration** linking restaurants to specific episodes and air dates

### LLM Integration Points
- **Admin enrichment**: Normalize and enhance restaurant data offline
- **Query interpretation**: Convert natural language to structured filters
- **Data quality**: Generate restaurant descriptions and cuisine tags from source material
- **Episode data extraction**: Parse episode lists and restaurant details from show data

## Success Metrics
- **User engagement**: Time spent browsing, searches performed
- **Data quality**: Accuracy of restaurant information vs. competitors
- **Search effectiveness**: Natural language query success rate
- **Coverage growth**: Number of episodes and restaurants in database

## Scope & Boundaries
### In Scope
- Restaurants featured on Diners, Drive-ins and Dives (all seasons, 1,000-1,500+ locations)
- Global coverage with focus on US locations (300+ cities, 50 states)
- Comprehensive restaurant info: location, price tier, cuisine, status, dishes, ratings
- Episode metadata: season, episode number, air date, featured dishes
- Natural language search with advanced filtering
- **Road Trip Planner**: Point A → Point B with restaurants along route
- **Freshness System**: Automated open/closed verification
- City/State landing pages for SEO
- Cuisine filtering and "Near Me" geolocation
- Admin tools for data enrichment and verification

### Out of Scope (MVP)
- Full multi-stop itinerary optimization
- General restaurant recommendations (non-DDD)
- Real-time availability/reservations
- User reviews/ratings (we'll show Google/Yelp ratings)
- Social features (check-ins, sharing)
- Detailed menu information beyond Guy's highlighted dishes

## Timeline & Phases
### Phase 1: MVP (2-3 weeks)
- Database schema with PostGIS for geo queries
- Initial data scrape (Wikipedia + manual)
- Basic restaurant, city, state pages
- Simple map view and search
- **Road Trip Planner**: Point A → Point B with restaurants along route

### Phase 2: Enrichment (1-2 weeks)
- LLM enrichment for descriptions
- Google Places API integration
- Open/closed verification system
- Ratings import (Google/Yelp)

### Phase 3: Polish (1 week)
- Episode pages with all featured restaurants
- Cuisine filtering system
- "Near me" geolocation feature
- Mobile optimization
- Performance tuning

### Phase 4: Launch
- Google Search Console submission
- Reddit promotion (r/DinersDD, r/guyfieri, food subs)
- Social media presence
- Monitor rankings and iterate

## Technical Constraints
- **Budget-conscious LLM usage**: Primarily offline/admin, minimal user-facing
- **Data accuracy requirements**: No hallucinated restaurants or outdated info
- **Performance**: Fast search and filtering for good UX
- **Scalability**: Architecture should support growth to 1,500+ restaurants

## Business Constraints
- Small project scope (solo developer)
- Minimal ongoing costs (Vercel/Supabase free tiers initially)
- Focus on execution speed over feature completeness
- Leverage learnings from chefs and shark-tank projects

## Risks & Assumptions
### Key Risks
- **Data sourcing challenges**: Finding reliable episode lists and restaurant details
- **Maintenance overhead**: Keeping restaurant status current as places open/close
- **LLM cost creep**: Ensuring AI usage stays within budget
- **Episode data accuracy**: Verifying which restaurants appeared in which episodes

### Assumptions
- **Market demand**: DDD fans want curated restaurant information
- **Data availability**: Sufficient public information exists to build meaningful database
- **Technical feasibility**: Next.js/Supabase stack can handle requirements efficiently
- **Show popularity**: DDD has lasting appeal and new episodes continue

## Data Sources
- Food Network episode guides
- Guy Fieri's official website
- Fan-maintained episode databases
- Google Places API for verification
- Tavily search for restaurant details
