# Headless WordPress Project Guide

This document serves as the authoritative guide for AI developers working on this project.

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Flow Overview                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  src/acf/definitions/     ──── bun sync ────►  WordPress (ACF)     │
│        │                                            │               │
│        │ auto-generate                              │ GraphQL       │
│        ▼                                            ▼               │
│  src/graphql/_generated/  ◄──── codegen ────  Schema + Types       │
│        │                                                            │
│        │ import                                                     │
│        ▼                                                            │
│  routes/**/-services/     ──── kvFirstFetch ────►  KV + Memory     │
│        │                                              │             │
│        │ loader                      background       │ webhook     │
│        ▼                             revalidate       ▼             │
│  routes/**/*.tsx          ◄──── stale data ──── WordPress          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     KV-First Fallback Architecture                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Request → Memory Cache (1ms) → Cloudflare KV (50ms) → WordPress   │
│                                                                     │
│  • Memory cache: fastest, per-isolate                               │
│  • KV: pre-populated via `bun snapshot`, survives WordPress outage │
│  • WordPress: background revalidation, stale-while-revalidate      │
│                                                                     │
│  When WordPress is down, users see cached data with "stale" banner │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     i18n SSOT (Single Source of Truth)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WordPress Polylang (SSOT)                                          │
│        │                                                            │
│        │ bun sync                                                   │
│        ▼                                                            │
│  GraphQL LanguageCodeEnum  ──────────────────────────────────────►  │
│        │                                                            │
│        ├──► intlayer.config.ts (auto-generated)                     │
│        │                                                            │
│        └──► src/lib/i18n/language.ts (derived from enum)           │
│                    │                                                │
│                    └──► toLanguageFilter(), toLanguageCode()        │
│                              │                                      │
│                              └──► All service files import from here│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Files

| Path | Purpose |
|------|---------|
| `src/acf/definitions/` | ACF field definitions (source of truth) |
| `src/graphql/_generated/` | Auto-generated types (DO NOT EDIT) |
| `src/routes/**/-services/` | Data fetching with KV-first pattern |
| `src/lib/cache/index.ts` | Cache keys and invalidation logic |
| `src/lib/kv/index.ts` | Cloudflare KV access via `cloudflare:workers` |
| `src/lib/kv-first/index.ts` | KV-first fetch with stale-while-revalidate |
| `src/lib/seo/seo.config.ts` | SEO configuration (SSOT) |
| `src/lib/i18n/language.ts` | Language utilities (derived from GraphQL) |
| `scripts/snapshot.ts` | KV snapshot script for build-time data population |
| `scripts/checkall.ts` | Pre-build validation checks |

---

## Development Workflows

### Adding a New ACF Field

```bash
# 1. Define the field
vim src/acf/definitions/product/fields.ts

# 2. Add to field group
vim src/acf/definitions/product/index.ts

# 3. Sync (auto-generates fragment + types + pushes to WP)
bun sync

# Done! The field is now available in queries via ...ProductAcfFields
```

### Creating a New Page (Static Route)

```bash
# 1. Create the route file
touch src/routes/about.tsx

# 2. Run SEO validation to see what config is needed
bun seo

# 3. Copy the suggested config from output to seo.config.ts
vim src/lib/seo/seo.config.ts

# 4. Fill in title and description
```

### Creating a New Content Type

```bash
# For a new content type like "accessories":

# 1. Create ACF definition structure
mkdir -p src/acf/definitions/accessories
# Create fields.ts, index.ts, schema.ts (copy from product/)

# 2. Create post type definition
vim src/acf/post-types/accessories.ts

# 3. Create GraphQL queries
mkdir -p src/graphql/accessories
vim src/graphql/accessories/queries.graphql

# 4. Create service with cache
mkdir -p src/routes/accessories/-services
vim src/routes/accessories/-services/index.ts

# 5. Add cache keys to src/lib/cache/index.ts
#    - accessoriesList: () => "accessories:list"
#    - accessoryBySlug: (slug) => `accessories:slug:${slug}`
#    - Update invalidateByWebhook() to handle "accessories" post_type

# 6. Create routes
touch src/routes/accessories/index.tsx
touch src/routes/accessories/\$accessoryId.tsx

# 7. Sync and validate
bun sync
bun seo
```

---

## Data Fetching Pattern

All data fetching uses server-side cache with locale support:

```typescript
// src/routes/{-$locale}/products/-services/index.ts
export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { locale?: string }) => input)
  .handler(async ({ data }) => {
    const { locale } = data;
    const cacheKey = cacheKeys.productsList(locale);

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const language = toLanguageFilter(locale); // "en" → LanguageCodeFilterEnum.En
    const result = await graphqlRequest(ProductsListDocument, { first: 20, language });

    cache.set(cacheKey, result.products);
    return result.products;
  });
```

**When adding a new content type**, follow this pattern and add corresponding cache keys.

---

## i18n (Multi-language)

> 详细架构说明见 [wordpress/I18N.md](../wordpress/I18N.md)

**SSOT**: WordPress Polylang → GraphQL `LanguageCodeEnum` → `intlayer.config.ts` + `src/lib/i18n/language.ts`

### 快速参考

```typescript
// 服务层使用共享模块
import { toLanguageFilter, toLanguageCode } from "@/lib/i18n/language";

const language = toLanguageFilter(locale); // "en" → LanguageCodeFilterEnum.En
```

### 添加新语言

```bash
# 1. WordPress Polylang 添加语言
# 2. 运行同步（自动更新所有配置）
bun sync
# 3. 添加 UI 翻译到 src/content/*.content.ts
```

### 添加 UI 翻译

```typescript
// src/content/common.content.ts
navigation: {
  newItem: t({
    en: "New Item",
    zh: "新项目",
    ja: "新しい項目",
  }),
}
```

---

## Cache & KV Fallback

The project uses a KV-first architecture for resilience:

1. **Memory cache**: Per-isolate, fastest (~1ms)
2. **Cloudflare KV**: Pre-populated via `bun snapshot`, survives WordPress outages
3. **WordPress GraphQL**: Background revalidation with stale-while-revalidate

Cache keys are defined in `src/lib/cache/index.ts`:

```typescript
// Keys always include locale (defaults to "en")
export const cacheKeys = {
  productsList: (locale?) => `products:list:${locale ?? "en"}`,
  postBySlug: (slug, locale?) => `posts:slug:${slug}:${locale ?? "en"}`,
  homepage: (locale?) => `homepage:data:${locale ?? "en"}`,
};
```

**When adding a new content type**, add its cache keys and update `invalidateByWebhook()`.

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Build for production (runs checkall first) |
| `bun run deploy` | Snapshot KV + build + deploy to Cloudflare Workers |
| `bun env:push` | Push .env.prod.local secrets to Cloudflare |
| `bun sync` | Full sync: ACF → WordPress → GraphQL types → i18n config |
| `bun snapshot` | Populate Cloudflare KV with WordPress data |
| `bun checkall` | Run all pre-build checks |
| `bun seo` | Validate SEO config and generate robots.txt/sitemap.xml |
| `bun typecheck` | TypeScript type checking |
| `bun lint` | Lint and format code |
| `bun run test` | Run unit tests (Vitest) |

---

## Environment Variables

Managed with **t3-env** for type safety. See `src/env.ts` for schema.

- **Server-only**: `import { env } from "@/env"` → `env.GRAPHQL_ENDPOINT`
- **Client-available**: `import.meta.env.VITE_*` (for code shared between server/client)

---

## Deployment

```bash
bun env:push    # Push .env.prod.local to Cloudflare
bun run deploy  # Deploy to Cloudflare Workers
```

---

## Critical Rules

### DO NOT Modify These Files

These files are auto-generated. Changes will be overwritten.

```
❌ src/graphql/_generated/*
❌ src/acf/definitions/*/_generated/*
❌ src/acf/compiled/*
❌ src/routeTree.gen.ts
❌ public/robots.txt
❌ public/sitemap.xml
❌ .intlayer/*
❌ intlayer.config.ts (auto-generated from WordPress Polylang)
```

### Always Use Auto-Generated Fragments

```graphql
# ✅ CORRECT - Use the auto-generated fragment
fragment ProductFields on Product {
  productAcfGroup {
    ...ProductAcfFields  # Auto-generated, always up-to-date
  }
}

# ❌ WRONG - Manual field listing gets out of sync
fragment ProductFields on Product {
  productAcfGroup {
    price
    stock
    # Missing new fields!
  }
}
```

### SEO Config is Required

Every static route must have SEO configuration:

```typescript
// src/lib/seo/seo.config.ts
routes: {
  "/about": {
    title: "About Us",      // Required
    description: "...",     // Required
  },
}
```

Build will fail if SEO config is incomplete.

---

## Code Standards (Ultracite)

This project uses **Ultracite** (Biome-based) for linting and formatting.

```bash
bun lint  # Auto-fix issues
```

Key rules:
- Use `const` by default, `let` only when needed
- Prefer `for...of` over `.forEach()`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- No `console.log` in production code

---

## Quick Checklist

Before committing:

- [ ] Ran `bun sync` after ACF changes or WordPress language changes
- [ ] Ran `bun seo` after adding routes
- [ ] Ran `bun checkall` to verify all checks pass
- [ ] Added cache keys for new content types (with locale support)
- [ ] Did NOT modify any `_generated`, `.intlayer`, or `intlayer.config.ts` files

---

## Testing

Unit tests use **Vitest** + **React Testing Library**.

```bash
bun run test        # Run all tests
bun vitest          # Watch mode
bun vitest --coverage  # With coverage report
```

### Test Structure

```
src/
├── test/
│   ├── setup.ts      # Test environment setup
│   └── utils.tsx     # Test utilities (renderWithProviders)
├── lib/
│   ├── cache/index.test.ts     # Cache utility tests
│   └── seo/*.test.ts           # SEO utility tests
├── acf/definitions/
│   └── product/schema.test.ts  # Zod schema validation tests
└── components/
    └── *.test.tsx              # Component tests
```

### Writing Tests

- Place tests next to the file being tested (`*.test.ts` or `*.test.tsx`)
- Use `renderWithProviders()` from `@/test/utils` for components needing React Query
- Mock `@tanstack/react-router` when testing components with `Link` or `useRouter`
