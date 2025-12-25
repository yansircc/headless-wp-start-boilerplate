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
│  • KV: populated via webhook, survives WordPress outage             │
│  • WordPress: background revalidation, stale-while-revalidate      │
│                                                                     │
│  When WordPress is down, users see cached data from KV              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     KV Sync Architecture                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WordPress 内容变更                                                  │
│         ↓                                                           │
│  WordPress 插件发送 Webhook                                          │
│  (action, post_type, slug, locale)                                  │
│         ↓                                                           │
│  Cloudflare Worker (前端 webhook handler)                            │
│    1. 清除内存缓存                                                   │
│    2. 用前端 GraphQL 查询获取数据                                     │
│    3. 通过 Worker Binding 直接写入 KV  ← 无需 API Token！             │
│         ↓                                                           │
│  用户请求: Memory → KV → WordPress                                   │
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
| `src/lib/kv/` | Unified KV module (client, fetch, sync) |
| `src/lib/kv/client.ts` | Cloudflare KV read/write via Worker Binding |
| `src/lib/kv/fetch.ts` | KV-first fetch with stale-while-revalidate |
| `src/lib/kv/sync/` | KV sync logic (webhook → KV, modularized) |
| `src/lib/seo/seo.config.ts` | Site-level SEO config (url, name, defaults) |
| `src/lib/seo/yoast.ts` | Yoast SEO utilities (buildYoastMeta, buildYoastArchiveMeta) |
| `src/lib/seo/static-pages.ts` | Static pages SEO from Yoast Archive Settings |
| `src/graphql/seo/fragments.graphql` | Yoast SEO GraphQL fragments |
| `src/graphql/seo/static-pages.graphql` | Static pages SEO query (Archive Settings) |
| `src/lib/i18n/language.ts` | Language utilities (derived from GraphQL) |
| `src/routes/api/webhook/revalidate.ts` | Webhook handler (invalidate + sync KV) |
| `src/routes/api/kv/sync.ts` | Full KV sync endpoint |
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

# 2. Add SEO config for the route
vim src/lib/seo/seo.config.ts
# Add entry in routes: { "/about": { title: "About", description: "..." } }

# 3. Use buildSeoMeta in the route's head() function
```

### Creating a New Content Type (Generic Pattern)

For any new content type (e.g., `{type}` = "event", "accessory", etc.):

```bash
# 1. ACF Definitions (auto-discovered by bun sync)
mkdir -p src/acf/definitions/{type}
# Create: fields.ts, index.ts, schema.ts (copy from product/)

# 2. Post Type Definition
vim src/acf/post-types/{type}.ts

# 3. GraphQL Queries
mkdir -p src/graphql/{type}s
vim src/graphql/{type}s/queries.graphql
# Naming convention:
#   - Fragment: {Type}Fields
#   - List query: {Type}sList
#   - Single query: {Type}BySlug

# 4. Service Layer (use generic cache keys)
mkdir -p src/routes/{-$locale}/{type}s/-services
vim src/routes/{-$locale}/{type}s/-services/index.ts

# 5. Routes
touch src/routes/{-$locale}/{type}s/index.tsx
touch src/routes/{-$locale}/{type}s/\${type}Slug.tsx

# 6. (Optional) Register KV sync for new type
# See "Registering New Types for KV Sync" below

# 7. Sync to generate types
bun sync
```

**Key Points:**
- ACF definitions are auto-discovered - no need to modify sync script
- Use generic cache keys: `cacheKeys.list("{type}s", locale)`
- Cache invalidation works automatically for new types

---

## Data Fetching Pattern

All data fetching uses server-side cache with locale support. Use **generic cache keys** for any content type:

```typescript
// src/routes/{-$locale}/{type}s/-services/index.ts
// Generic pattern - works for any content type

export const getItems = createServerFn({ method: "GET" })
  .inputValidator((input: { locale?: string }) => input)
  .handler(async ({ data }) => {
    const { locale } = data;
    // Use generic cache key method
    const cacheKey = cacheKeys.list("{type}s", locale);

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const language = toLanguageFilter(locale);
    const result = await graphqlRequest({Type}sListDocument, { first: 20, language });

    cache.set(cacheKey, result.{type}s);
    return result.{type}s;
  });

export const getItemBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; locale?: string }) => input)
  .handler(async ({ data }) => {
    const { slug, locale } = data;
    // Use generic cache key method
    const cacheKey = cacheKeys.bySlug("{type}s", slug, locale);

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const language = toLanguageCode(locale);
    const result = await graphqlRequest({Type}BySlugDocument, { slug, language });

    const item = result.{type}?.translation;
    if (item) cache.set(cacheKey, item);
    return item;
  });
```

**Key Point:** Use `cacheKeys.list()` and `cacheKeys.bySlug()` - no need to add new shortcuts.

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

## Cache & KV Sync

The project uses a KV-first architecture for resilience:

1. **Memory cache**: Per-isolate, fastest (~1ms)
2. **Cloudflare KV**: Populated via webhook, survives WordPress outages
3. **WordPress GraphQL**: Background revalidation with stale-while-revalidate

### How KV is Populated

| Method | Trigger | Description |
|--------|---------|-------------|
| **Webhook** | Content changes | WordPress plugin sends webhook → Frontend writes to KV |
| **Full Sync** | Manual | WordPress admin button or `POST /api/kv/sync` |
| **Auto-backfill** | User visit | KV miss → fetch from WordPress → write to Memory + KV |

The system is **self-healing**: even if Full Sync is forgotten or webhook fails, user visits will auto-backfill KV.

### Cache Keys (Generic Pattern)

Cache keys are defined in `src/lib/cache/index.ts`. Use **generic methods** for new content types:

```typescript
// Generic methods - use for any content type
cacheKeys.list("events", locale)                    // → "events:list:en"
cacheKeys.bySlug("events", "conf-2024", locale)     // → "events:slug:conf-2024:en"
cacheKeys.byId("events", 123, locale)               // → "events:id:123:en"
cacheKeys.byTaxonomy("events", "category", "tech")  // → "events:category:tech:en"
cacheKeys.page("about", locale)                     // → "about:data:en"

// Backward-compatible shortcuts (internally use generic methods)
cacheKeys.productsList(locale)      // → cacheKeys.list("products", locale)
cacheKeys.postBySlug(slug, locale)  // → cacheKeys.bySlug("posts", slug, locale)
```

**Cache invalidation** handles any `post_type` automatically:
- Known types: `product` → `products:*`, `post` → `posts:*`
- Unknown types: auto-pluralized (e.g., `event` → `events:*`)

For custom pluralization or taxonomies:
```typescript
import { registerPostType, registerTaxonomy } from "@/lib/cache";

registerPostType("accessory", "accessories");  // accessory → accessories:*
registerTaxonomy("event-category", {
  contentType: "events",
  taxonomyKey: "category"
});
```

### Registering New Types for KV Sync

KV sync uses a **registry pattern**. Built-in types (post, product, category, tag, product-category) are pre-registered. For new types:

```typescript
// src/lib/kv/sync/registrations/ or any initialization file
import { registerPostTypeSync, registerTaxonomySync } from "@/lib/kv";

// Register a new post type
registerPostTypeSync("event", {
  bySlugDocument: EventBySlugDocument,
  listDocument: EventsListDocument,
  buildBySlugVars: (slug, language) => ({ slug, language }),
  buildListVars: (language) => ({ first: 20, language }),
  extractSingle: (data) => data.event?.translation ?? null,
  extractList: (data) => data.events,
  getCacheKey: (slug, locale) => cacheKeys.bySlug("events", slug, locale),
  getListCacheKey: (locale) => cacheKeys.list("events", locale),
});

// Register a new taxonomy
registerTaxonomySync("event-category", {
  bySlugDocument: EventCategoryBySlugDocument,
  listDocument: EventCategoriesListDocument,
  contentByTaxonomyDocument: EventsByCategoryDocument,  // optional
  // ... similar config
});
```

**Note:** If you don't register a type, KV sync will log a warning but won't fail. The homepage will still be updated.

---

## API Endpoints

### Webhook (Content Changes)
```
POST /api/webhook/revalidate
Header: X-Headless-Bridge-Signature: <HMAC-SHA256>
Body: { action, post_type, post_id, slug, locale, timestamp }

Response: {
  success: true,
  memory_invalidated: 3,
  kv_updated: 3,
  kv_deleted: 0
}
```

### Full Sync
```
POST /api/kv/sync
Header: Authorization: Bearer <WEBHOOK_SECRET>

Response: {
  success: true,
  synced: ["homepage:data:en", "posts:list:en", ...],
  total: 9,
  locales: ["en", "zh", "ja"]
}
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Build for production (runs checkall first) |
| `bun run deploy` | Build + deploy to Cloudflare Workers |
| `bun env:push` | Push .env.prod.local secrets to Cloudflare |
| `bun sync` | Full sync: ACF → WordPress → GraphQL types → i18n config |
| `bun checkall` | Run all pre-build checks |
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

After first deploy, click **Trigger Full Sync** in WordPress admin to populate KV.

---

## Critical Rules

### DO NOT Modify These Files

These files are auto-generated. Changes will be overwritten.

```
❌ src/graphql/_generated/*
❌ src/acf/definitions/*/_generated/*
❌ src/acf/compiled/*
❌ .intlayer/*
❌ intlayer.config.ts (auto-generated from WordPress Polylang)
```

Note: `src/routeTree.gen.ts` is auto-generated by TanStack Router but IS committed (updated when routes change).

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

### SEO Architecture

**All SEO is managed via WordPress Yoast SEO.** No SEO data is stored in frontend code.

**Static pages** (/, /posts, /products): Use Yoast Archive Settings
```typescript
// In route loader - fetch SEO from Yoast Content Type Archive settings
const [data, seoData] = await Promise.all([
  getData({ data: { locale } }),
  getStaticPagesSeo({ data: {} }),
]);
return { ...data, seo: seoData.data };

// In route head()
import { buildYoastArchiveMeta, getArchiveSeo, getDefaultOgImage, seoConfig } from "@/lib/seo";
const archive = getArchiveSeo(loaderData?.seo, "post"); // or "product", "page"
const defaultImage = getDefaultOgImage(loaderData?.seo);
return {
  meta: buildYoastArchiveMeta(archive, { defaultImage, siteUrl: seoConfig.site.url, canonical: "/posts" }),
};
```

**Dynamic content** (posts, products, taxonomies): Use Yoast SEO
```typescript
// GraphQL query includes seo field via ...YoastSeoFields fragment
// In route head()
import { buildYoastMeta, buildYoastSchema } from "@/lib/seo/yoast";
return { meta: buildYoastMeta(post?.seo), scripts: [buildYoastSchema(post?.seo)] };
```

**Category list pages** (/posts/categories, /products/categories): Redirect to parent
```typescript
// These pages have no WordPress equivalent, so they redirect
export const Route = createFileRoute("/{-$locale}/posts/categories/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: params.locale ? `/${params.locale}/posts` : "/posts" });
  },
});
```

**Yoast Settings Locations:**
| Page | Yoast Setting Path |
|------|-------------------|
| Homepage `/` | SEO → Settings → Content types → Homepage |
| Posts `/posts` | SEO → Settings → Content types → Posts → Archive |
| Products `/products` | SEO → Settings → Content types → Products → Archive |
| Single Category | Posts → Categories → Edit → Yoast SEO panel |

**robots.txt & sitemap.xml**: Proxied from WordPress Yoast SEO
- `/robots.txt` → proxies from WordPress
- `/sitemap.xml` → proxies from WordPress sitemap_index.xml

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
- [ ] Ran `bun checkall` to verify all checks pass
- [ ] Used generic cache keys (`cacheKeys.list()`, `cacheKeys.bySlug()`) for new content types
- [ ] Added `seo` field with `...YoastSeoFields` fragment for new content queries
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
│   └── cache/index.test.ts     # Cache utility tests
├── acf/definitions/
│   └── product/schema.test.ts  # Zod schema validation tests
└── components/
    └── *.test.tsx              # Component tests
```

### Writing Tests

- Place tests next to the file being tested (`*.test.ts` or `*.test.tsx`)
- Use `renderWithProviders()` from `@/test/utils` for components needing React Query
- Mock `@tanstack/react-router` when testing components with `Link` or `useRouter`
