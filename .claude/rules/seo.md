# SEO Architecture

**All SEO is managed via WordPress Yoast SEO.** No SEO data is stored in frontend code.

## Static Pages (/, /posts, /products)

Use Yoast Archive Settings:

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

## Dynamic Content (posts, products, taxonomies)

Use Yoast SEO:

```typescript
// GraphQL query includes seo field via ...YoastSeoFields fragment
// In route head()
import { buildYoastMeta, buildYoastSchema } from "@/lib/seo/yoast";
return { meta: buildYoastMeta(post?.seo), scripts: [buildYoastSchema(post?.seo)] };
```

## Category List Pages (/posts/categories, /products/categories)

Redirect to parent:

```typescript
// These pages have no WordPress equivalent, so they redirect
export const Route = createFileRoute("/{-$locale}/posts/categories/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: params.locale ? `/${params.locale}/posts` : "/posts" });
  },
});
```

## Yoast Settings Locations

| Page | Yoast Setting Path |
|------|-------------------|
| Homepage `/` | SEO → Settings → Content types → Homepage |
| Posts `/posts` | SEO → Settings → Content types → Posts → Archive |
| Products `/products` | SEO → Settings → Content types → Products → Archive |
| Single Category | Posts → Categories → Edit → Yoast SEO panel |

## robots.txt & sitemap.xml

Proxied from WordPress Yoast SEO:
- `/robots.txt` → proxies from WordPress
- `/sitemap.xml` → proxies from WordPress sitemap_index.xml
