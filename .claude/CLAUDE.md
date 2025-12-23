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
│  routes/**/-services/     ──── cache ────►  src/lib/cache/         │
│        │                                         │                  │
│        │ loader                                  │ webhook          │
│        ▼                                         ▼                  │
│  routes/**/*.tsx          ◄──── invalidate ──── WordPress          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Files

| Path | Purpose |
|------|---------|
| `src/acf/definitions/` | ACF field definitions (source of truth) |
| `src/graphql/_generated/` | Auto-generated types (DO NOT EDIT) |
| `src/routes/**/-services/` | Data fetching with cache |
| `src/lib/cache/index.ts` | Cache keys and invalidation logic |
| `src/lib/seo/seo.config.ts` | SEO configuration (SSOT) |
| `intlayer.config.ts` | i18n languages (EN/ZH/JA/...) |
| `src/content/*.content.ts` | UI translations (Intlayer) |

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

- **URL routing**: `/` (EN default), `/zh/`, `/ja/`
- **Frontend translations**: `useIntlayer("common")` from `src/content/*.content.ts`
- **WordPress content**: Polylang + WPGraphQL Polylang plugin
- **Data fetching**: Pass `locale` from route params to services

```typescript
// Route loader gets locale from URL params
loader: ({ params }) => getPosts({ data: { locale: params.locale } })

// Service converts locale to GraphQL language filter
const language = toLanguageFilter(locale); // "en" → LanguageCodeFilterEnum.En
```

**Cache keys include locale**: `posts:list:en`, `homepage:data:ja`

### Adding UI Translations

```bash
# 1. Edit src/content/common.content.ts
# 2. Add new translation key with all languages
navigation: {
  newItem: t({
    en: "New Item",
    zh: "新项目",
    ja: "新しい項目",
  }),
}

# 3. Use in component
const { navigation } = useIntlayer("common");
<span>{navigation.newItem}</span>
```

### Adding a New Language

1. Add language in WordPress Polylang
2. Run `bun sync` to update GraphQL schema
3. Update `toLanguageFilter()` and `toLanguageCode()` in services:
   ```typescript
   const localeMap = {
     en: LanguageCodeFilterEnum.En,
     ja: LanguageCodeFilterEnum.Ja,
     zh: LanguageCodeFilterEnum.Zh,
     ko: LanguageCodeFilterEnum.Ko,  // Add new language
   };
   ```
4. Add translations to `src/content/*.content.ts`

---

## Cache Invalidation

WordPress sends webhooks to `/api/webhook/revalidate` when content changes.

Cache keys are defined in `src/lib/cache/index.ts`:

```typescript
export const cacheKeys = {
  productsList: (locale?) => locale ? `products:list:${locale}` : "products:list",
  postsList: (locale?) => locale ? `posts:list:${locale}` : "posts:list",
  postBySlug: (slug, locale?) => locale ? `posts:slug:${slug}:${locale}` : `posts:slug:${slug}`,
  homepage: (locale?) => locale ? `homepage:data:${locale}` : "homepage:data",
};
```

**When adding a new content type**, add its cache keys and update `invalidateByWebhook()`.

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Build for production (runs validate + seo first) |
| `bun env:push` | Push .env.prod.local secrets to Cloudflare |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun sync` | Sync ACF definitions → WordPress → Generate types |
| `bun seo` | Validate SEO config and generate robots.txt/sitemap.xml |
| `bun validate` | Run all pre-build validations |
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

- [ ] Ran `bun sync` after ACF changes
- [ ] Ran `bun seo` after adding routes
- [ ] Ran `bun lint` to fix formatting
- [ ] Ran `bun typecheck` to verify types
- [ ] Ran `bun run test` to verify tests pass
- [ ] Added cache keys for new content types (with locale support)
- [ ] Updated `toLanguageFilter()` if adding new languages
- [ ] Did NOT modify any `_generated` or `.intlayer` files

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
