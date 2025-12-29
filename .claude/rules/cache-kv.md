# Cache & KV Sync

The project uses a KV-first architecture for resilience:

1. **Memory cache**: Per-isolate, fastest (~1ms)
2. **Cloudflare KV**: Populated via webhook, survives WordPress outages
3. **WordPress GraphQL**: Background revalidation with stale-while-revalidate

## How KV is Populated

| Method | Trigger | Description |
|--------|---------|-------------|
| **Webhook** | Content changes | WordPress plugin sends webhook → Frontend writes to KV |
| **Full Sync** | Manual | WordPress admin button or `POST /api/kv/sync` |
| **Auto-backfill** | User visit | KV miss → fetch from WordPress → write to Memory + KV |

The system is **self-healing**: even if Full Sync is forgotten or webhook fails, user visits will auto-backfill KV.

## Cache Keys (Generic Pattern)

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

## Registering New Types for KV Sync

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
