---
Last-Updated: 2025-12-16
Maintainer: RB
Status: Production
---

# Technology Stack: DDD Restaurant Map

## Core Technologies
Modern web stack optimized for rapid development and minimal operational overhead. Inheriting proven architecture from chefs project.

### Backend
- **Runtime**: Node.js 18+ (via Next.js API routes)
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL with PostGIS for geographic queries)
- **Geo Extensions**: PostGIS for location-based queries, route distance calculations
- **Storage**: Supabase Storage (for restaurant photos)
- **Authentication**: Supabase Auth (for admin tools)
- **LLM**: OpenAI API (primary: gpt-4o-mini for enrichment with Flex tier for 50% cost savings)

### Frontend
- **Framework**: Next.js 14+ with React 18+
- **State Management**: React Context + useState/useReducer (simple state, no external store needed)
- **Styling**: Tailwind CSS 4
- **Maps**: MapLibre GL JS (free, open-source) + Leaflet.js
- **UI Components**: Custom components + Lucide React icons
- **Build Tool**: Built into Next.js

### Infrastructure
- **Hosting**: Vercel (seamless Next.js integration)
- **Database Hosting**: Supabase (managed Postgres with PostGIS)
- **File Storage**: Supabase Storage (photo uploads with RLS policies)
- **CDN**: Vercel Edge Network (included)
- **Analytics**: PostHog (product analytics + session replay)
- **Monitoring**: Vercel Analytics + Supabase monitoring

## Map Technologies

### MapLibre GL JS (Primary for Road Trip)
- **Version**: 5.14.0
- **Purpose**: Road trip planner maps, route visualization
- **Cost**: FREE (open-source)
- **Basemap**: CartoDB free tiles (no API key required)
- **Features**: Route polylines, custom markers, popups

### Leaflet.js (Secondary for Restaurant Maps)
- **Version**: 1.9.4
- **Purpose**: Restaurant detail pages, clustering
- **Cost**: FREE (open-source)
- **Basemap**: OpenStreetMap

## Development Tools

### Code Quality
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind plugin
- **Type Checking**: TypeScript 5 (strict mode)
- **Testing**: Playwright (e2e)

### Development Environment
- **Package Manager**: npm
- **Version Control**: Git
- **CI/CD**: Vercel automated deployments
- **Environment**: Local development with Next.js dev server

### Specialized Tools
- **Data Validation**: Zod for runtime type checking
- **Toast Notifications**: Sonner
- **Icons**: Lucide React
- **Product Analytics**: PostHog (posthog-js v1.302+)

### External Data Sources
- **Episode Data**: Wikipedia episode lists (cached via Tavily)
- **Restaurant Verification**: Google Places API (status, hours, ratings)
- **Web Search**: Tavily API for restaurant details and enrichment
- **Road Trip Routing**: Google Directions API for route polylines
- **City Autocomplete**: SimpleMaps US Cities (free, 1,444 cities)

## Architecture Decisions

### Database Design
- **PostgreSQL**: Relational structure for restaurant/episode relationships
- **PostGIS Extension**: Geographic data types and spatial queries
  - `geography` type for accurate distance calculations
  - `ST_DWithin` for finding restaurants near routes
  - `ST_Distance` for calculating miles from route
- **Migrations**: 14 migrations total
- **Normalized Schema**: Separate tables for episodes, restaurants, cuisines, dishes
- **Many-to-Many**: restaurant_episodes, restaurant_cuisines junction tables
- **Route Caching**: route_cache table with 30-day TTL

### API Design
- **Next.js API Routes**: Server-side API endpoints within same codebase
- **RESTful Design**: Simple GET/POST endpoints for restaurants and routes
- **Rate Limiting**: Custom limits on roadtrip API (10/min per IP)
- **Type Safety**: Shared TypeScript types between client and server
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Input Validation**: Zod schemas for all user inputs

### Security Considerations
- **Environment Variables**: All API keys stored in Vercel env vars
- **Input Validation**: Zod schemas for all user inputs
- **Rate Limiting**: Vercel automatic + custom limits on expensive APIs
- **XSS Protection**: Sanitized JSON-LD structured data

### Performance Considerations
- **Route Caching**: Text-based cache lookup BEFORE Google API calls (80-90% savings)
- **ISR**: Incremental Static Regeneration on dynamic pages
- **Database Indexing**: Spatial indexes for PostGIS, text indexes for search
- **RPC Functions**: Single-query patterns to avoid N+1 issues

## Dependencies (Current)
```json
{
  "next": "16.0.10",
  "react": "19.2.1",
  "typescript": "5",
  "tailwindcss": "4",
  "maplibre-gl": "5.14.0",
  "leaflet": "1.9.4",
  "react-leaflet": "4.2.1",
  "@supabase/supabase-js": "2.86.0",
  "openai": "6.9.1",
  "posthog-js": "1.302.2",
  "zod": "3.23.0",
  "lucide-react": "latest",
  "sonner": "latest",
  "@playwright/test": "1.57.0"
}
```

## Environment Configuration
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM & Search (Required for enrichment)
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key

# Google APIs (Required for road trip + verification)
GOOGLE_PLACES_API_KEY=your_google_key  # Used for Directions API too

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Deployment Architecture
- **Frontend**: Static generation + ISR on Vercel Edge
- **API Routes**: Vercel serverless functions (Node.js runtime)
- **Database**: Supabase managed PostgreSQL with PostGIS
- **Assets**: Vercel CDN for static assets
- **Monitoring**: Vercel Analytics + PostHog

## Cost Summary

### One-Time (Enrichment)
- LLM enrichment: ~$6.78 for 1,541 restaurants
- Tavily search: Included in above
- Google Places: Minimal

### Ongoing (Monthly)
- Google Directions API: ~$0 (caching keeps within free tier)
- MapLibre GL: $0 (open source)
- Supabase: Free tier
- Vercel: Free tier
- **Total: ~$0/month**

## LLM Model Reference
**Primary Model**: OpenAI gpt-4o-mini
- **Purpose**: Restaurant enrichment, status verification
- **Tier**: Flex tier (50% cost savings)
- **Configuration**: Set via `X-Model-Tier: flex` header

See `/memory-bank/archive/llm-models.md` for detailed model pricing (managed separately).
