# Headless WordPress Project

TanStack Start + WordPress (ACF/Polylang/Yoast) + Cloudflare Workers

## Key Files

| Path | Purpose |
|------|---------|
| `src/acf/definitions/` | ACF field definitions (source of truth) |
| `src/graphql/_generated/` | Auto-generated types (DO NOT EDIT) |
| `src/routes/**/-services/` | Data fetching with KV-first pattern |
| `src/lib/cache/index.ts` | Cache keys and invalidation logic |
| `src/lib/kv/` | Unified KV module (client, fetch, sync) |
| `src/lib/seo/` | SEO utilities (Yoast integration) |
| `src/lib/i18n/language.ts` | Language utilities (derived from GraphQL) |
| `src/lib/fonts/config.ts` | Font configuration (SSOT) |
| `src/components/optimized-image.tsx` | OptimizedImage component |

## Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Build for production |
| `bun run deploy` | Build + deploy to Cloudflare Workers |
| `bun sync` | Full sync: ACF → WordPress → GraphQL types |
| `bun fonts:sync` | Download fonts + generate CSS |
| `bun checkall` | Run all pre-build checks |
| `bun lint` | Lint and format code |
| `bun run test` | Run unit tests |

## Critical Rules

### DO NOT Modify (Auto-generated)

```
src/graphql/_generated/*
src/acf/definitions/*/_generated/*
src/acf/compiled/*
src/lib/fonts/_generated/*
.intlayer/*
intlayer.config.ts
```

### Environment Variables

Managed with **t3-env**. See `src/env.ts` for schema.
- Server-only: `import { env } from "@/env"`
- Client: `import.meta.env.VITE_*`

## Quick Checklist

Before committing:
- [ ] Ran `bun sync` after ACF/language changes
- [ ] Ran `bun fonts:sync` after font config changes
- [ ] Ran `bun checkall` to verify all checks pass
- [ ] Used `<OptimizedImage>` for new images
- [ ] Used `cacheKeys.list()` / `cacheKeys.bySlug()` for cache keys
- [ ] Added `...YoastSeoFields` fragment for new content queries
- [ ] Did NOT modify any `_generated` files
