# Data Fetching Pattern

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
