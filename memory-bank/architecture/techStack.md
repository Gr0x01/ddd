---
Last-Updated: 2025-12-14
Maintainer: RB
Status: Defined
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
- **Framework**: Next.js 14+ with React 18
- **State Management**: React Context + useState/useReducer (simple state, no external store needed initially)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js with OpenStreetMap (free alternative to Google Maps)
- **UI Components**: Headless UI + custom components
- **Build Tool**: Built into Next.js

### Infrastructure
- **Hosting**: Vercel (seamless Next.js integration)
- **Database Hosting**: Supabase (managed Postgres with vector support)
- **File Storage**: Supabase Storage (photo uploads with RLS policies)
- **CDN**: Vercel Edge Network (included)
- **Analytics**: PostHog (product analytics + session replay)
- **Monitoring**: Vercel Analytics + Supabase monitoring

## Development Tools

### Code Quality
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind plugin
- **Type Checking**: TypeScript (strict mode)
- **Testing**: Jest + React Testing Library (unit tests), Playwright (e2e)

### Development Environment
- **Package Manager**: npm (comes with Node.js, simple and reliable)
- **Version Control**: Git
- **CI/CD**: Vercel automated deployments + GitHub Actions (for tests)
- **Environment**: Local development with Next.js dev server + Supabase local

### Specialized Tools
- **Vector Search**: Supabase vector/embeddings support
- **Geocoding**: Nominatim (OpenStreetMap geocoding service)
- **Data Validation**: Zod for runtime type checking
- **Environment Variables**: Next.js built-in env support
- **Product Analytics**: PostHog (posthog-js v1.302+)
  - Session replay enabled (disabled on /admin routes)
  - Autocapture for pageviews and user interactions
  - Privacy: person_profiles set to 'identified_only', password inputs masked
  - Configuration: `src/lib/posthog.ts`, Provider: `src/components/PostHogProvider.tsx`

### External Data Sources
- **Episode Data**: Food Network, Wikipedia episode lists, fan databases
- **Restaurant Verification**: Google Places API (status, hours, ratings)
- **Web Search**: Tavily API for restaurant details and enrichment
- **Geocoding**: Nominatim for address-to-coordinates conversion
- **Road Trip Routing**: Google Directions API (or Mapbox) for route polylines
- **Ratings**: Google Places API, Yelp API (cross-reference)

## Architecture Decisions

### Database Design
- **PostgreSQL**: Relational structure for restaurant/episode relationships
- **PostGIS Extension**: Geographic data types and spatial queries
  - `geography` type for accurate distance calculations
  - `ST_DWithin` for finding restaurants near routes
  - `ST_Distance` for calculating miles from route
- **Vector Extensions**: Supabase pgvector for semantic search capabilities (future)
- **Normalized Schema**: Separate tables for episodes, restaurants, cuisines, dishes
- **Many-to-Many**: restaurant_episodes, restaurant_cuisines junction tables
- **Soft Deletes**: `status` field (open/closed/unknown) instead of hard deletes
- **Verification Tracking**: `last_verified`, `verification_source` for freshness

### API Design
- **Next.js API Routes**: Server-side API endpoints within same codebase
- **RESTful Design**: Simple GET/POST endpoints for restaurants and search
- **Admin API Routes**: Photo upload/delete, data enrichment triggers
- **Type Safety**: Shared TypeScript types between client and server
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Input Validation**: UUID validation, file type/size checks, URL sanitization

### Security Considerations
- **Environment Variables**: All API keys stored in Vercel env vars
- **CORS**: Next.js default CORS handling for same-origin requests
- **Input Validation**: Zod schemas for all user inputs, UUID validation for admin operations
- **File Upload Security**: Type/size validation (5MB max, jpg/png/webp only), URL sanitization
- **Admin Auth**: Supabase Auth for admin-only enrichment endpoints
- **Rate Limiting**: Vercel automatic rate limiting + custom LLM call limits
- **Storage Security**: RLS policies on Supabase Storage buckets

### Performance Considerations
- **Static Generation**: Pre-generate pages where possible
- **Client-Side Filtering**: Cache full dataset client-side for instant filtering
- **Vector Search Caching**: Cache embeddings, don't regenerate on every query
- **Lazy Loading**: Load restaurant details on demand
- **Bundle Optimization**: Tree-shaking with ES modules, minimize bundle size
- **Database Indexing**: Index on city, state, cuisine_type, status for fast filtering

## Dependencies
```json
{
  "next": "14+",
  "react": "18+",
  "typescript": "5+",
  "tailwindcss": "3+",
  "leaflet": "^1.9.0",
  "react-leaflet": "^4.2.0",
  "@headlessui/react": "^1.7.0",
  "@supabase/supabase-js": "^2.38.0",
  "openai": "^4.20.0",
  "posthog-js": "^1.302.0",
  "zod": "^3.22.0",
  "@googlemaps/google-maps-services-js": "^3.3.0"
}
```

**Note on PostGIS**: Enable in Supabase dashboard under Database > Extensions. No npm package needed - accessed via SQL.

## Environment Configuration
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Tavily (Web Search)
TAVILY_API_KEY=your_tavily_key

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_key      # Verification, status, ratings
GOOGLE_DIRECTIONS_API_KEY=your_directions_key      # Road trip routing (can use same key)

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional: Additional APIs
NOMINATIM_USER_AGENT=ddd_restaurant_map
YELP_API_KEY=your_yelp_key                         # Cross-reference ratings
```

## Deployment Architecture
- **Frontend**: Static generation + ISR where possible on Vercel Edge
- **API Routes**: Vercel serverless functions (Node.js runtime)
- **Database**: Supabase managed PostgreSQL with global CDN
- **Assets**: Vercel CDN for static assets
- **Monitoring**: Vercel Analytics + Supabase monitoring dashboard

## LLM Model Reference
**Primary Model**: OpenAI gpt-4o-mini
- **Purpose**: Restaurant enrichment, episode data extraction
- **Tier**: Flex tier (50% cost savings)
- **Pricing**: ~$0.30 per 1M input tokens, ~$1.20 per 1M output tokens (Flex tier)
- **Configuration**: Set via `X-Model-Tier: flex` header

See `/memory-bank/architecture/llm-models.md` (if created) for detailed model pricing and configurations.
