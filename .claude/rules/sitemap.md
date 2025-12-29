# Sitemap URL Transformation

WordPress URLs are automatically transformed to frontend URLs when proxying sitemaps.

## Transformation Rules

| WordPress | Frontend |
|-----------|----------|
| `/$slug` | `/posts/$slug` |
| `/ja/$slug` | `/ja/posts/$slug` |
| `/blog/` | `/posts/` |
| `/ja/home/` | `/ja/` |
| `/category/$slug` | `/posts/categories/$slug` |
| `/tag/$slug` | `/posts/tags/$slug` |
| `/product/$slug` | `/products/$slug` |
| `/product-category/$slug` | `/products/categories/$slug` |

**Configuration:** `src/lib/sitemap/proxy.ts`

## Validation

The `bun checkall` command validates all sitemap URLs to ensure they won't 404 after transformation.
