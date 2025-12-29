# ACF Workflow

## Adding a New ACF Field

```bash
# 1. Define the field
vim src/acf/definitions/product/fields.ts

# 2. Add to field group
vim src/acf/definitions/product/index.ts

# 3. Sync (auto-generates fragment + types + pushes to WP)
bun sync

# Done! The field is now available in queries via ...ProductAcfFields
```

## Creating a New Content Type

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
# See cache-kv.md "Registering New Types for KV Sync"

# 7. Sync to generate types
bun sync
```

**Key Points:**
- ACF definitions are auto-discovered - no need to modify sync script
- Use generic cache keys: `cacheKeys.list("{type}s", locale)`
- Cache invalidation works automatically for new types

## Creating a New Page (Static Route)

```bash
# 1. Create the route file
touch src/routes/about.tsx

# 2. Add SEO config for the route
vim src/lib/seo/seo.config.ts
# Add entry in routes: { "/about": { title: "About", description: "..." } }

# 3. Use buildSeoMeta in the route's head() function
```
