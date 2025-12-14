# DDD Restaurant Map

A curated web application that maps and catalogs restaurants featured on Guy Fieri's "Diners, Drive-ins and Dives."

## Project Status

🚧 **Initial Setup** - Project structure created, ready for development

## Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Backend**: Next.js API routes, Supabase PostgreSQL
- **Maps**: Leaflet.js with OpenStreetMap
- **LLM**: OpenAI gpt-4o-mini (Flex tier)
- **Search**: Tavily API
- **Analytics**: PostHog
- **Testing**: Playwright E2E
- **Deployment**: Vercel (planned)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
ddd/
├── memory-bank/          # AI assistant context and documentation
│   ├── core/            # Essential project documentation
│   ├── development/     # Active development context
│   ├── architecture/    # System architecture docs
│   └── archive/         # Historical records
├── src/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/           # Utility functions and clients
│   └── types/         # TypeScript type definitions
├── scripts/            # Data enrichment and management scripts
└── CLAUDE.md          # AI assistant behavioral rules
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run test:e2e` - Run Playwright tests

## Documentation

See the `/memory-bank` directory for comprehensive project documentation:

- **[Quickstart](memory-bank/core/quickstart.md)** - Quick reference and commands
- **[Project Brief](memory-bank/core/projectbrief.md)** - Goals and scope
- **[Tech Stack](memory-bank/architecture/techStack.md)** - Architecture details
- **[Active Context](memory-bank/development/activeContext.md)** - Current work status

## Development Workflow

This project follows a structured development approach with clear architectural patterns. See `CLAUDE.md` for AI assistant guidelines and `memory-bank/` for detailed documentation.

## License

Private project
