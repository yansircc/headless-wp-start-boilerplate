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

All data fetching uses server-side cache:

```typescript
// src/routes/products/-services/index.ts
export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const cacheKey = cacheKeys.productsList();

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch from WordPress
  const data = await graphqlRequest(ProductsListDocument, { first: 20 });

  // Store in cache
  cache.set(cacheKey, data.products);
  return data.products;
});
```

**When adding a new content type**, follow this pattern and add corresponding cache keys.

---

## Cache Invalidation

WordPress sends webhooks to `/api/webhook/revalidate` when content changes.

Cache keys are defined in `src/lib/cache/index.ts`:

```typescript
export const cacheKeys = {
  productsList: () => "products:list",
  productBySlug: (slug: string) => `products:slug:${slug}`,
  postsList: () => "posts:list",
  postBySlug: (slug: string) => `posts:slug:${slug}`,
  homepage: () => "homepage:data",
};
```

**When adding a new content type**, add its cache keys and update `invalidateByWebhook()`.

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production (runs validate + seo first) |
| `bun sync` | Sync ACF definitions → WordPress → Generate types |
| `bun seo` | Validate SEO config and generate robots.txt/sitemap.xml |
| `bun validate` | Run all pre-build validations |
| `bun typecheck` | TypeScript type checking |
| `bun lint` | Lint and format code |
| `bun run test` | Run unit tests (Vitest) |

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
- [ ] Added cache keys for new content types
- [ ] Did NOT modify any `_generated` files

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
