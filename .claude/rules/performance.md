# Performance Optimization

## Font Optimization (SSOT)

Fonts use a **Single Source of Truth** architecture:

```
src/lib/fonts/config.ts (SSOT)
       │
       ├──► bun fonts:sync → Downloads to public/fonts/
       │                    → Generates src/lib/fonts/_generated/fonts.css
       │
       ├──► __root.tsx → Uses getFontPreloadLinks() for preload hints
       │
       └──► bun checkall → Validates fonts exist and match config
```

**Configuration:** `src/lib/fonts/config.ts`

```typescript
// Add or modify fonts in fontConfig.fonts[]
{
  family: "Outfit",
  variable: "--font-primary",
  weights: [400, 500, 600, 700],
  display: "swap",
  preload: true,
}
```

**Commands:**
- `bun fonts:sync` - Download fonts from Google Fonts + generate CSS
- Font validation runs automatically with `bun checkall`

## Image Optimization (Cloudflare Image Resizing)

Images are optimized on-the-fly using Cloudflare Image Resizing:

```
<OptimizedImage> → /api/image?src=...&w=500 → Cloudflare Image Resizing → AVIF/WebP
```

**Use the OptimizedImage component:**

```tsx
import { OptimizedImage } from "@/components/optimized-image";

<OptimizedImage
  src={post.featuredImage.node.sourceUrl}
  alt={post.featuredImage.node.altText || ""}
  width={600}
  height={400}
  priority  // For above-the-fold hero images
  sizes="(max-width: 768px) 100vw, 600px"
/>
```

**Features:**
- Auto-generates responsive srcSet
- Format negotiation (AVIF > WebP > original)
- `loading="lazy"` by default, `fetchpriority="high"` with `priority`
- Development fallback (direct URLs when not on Cloudflare)
- Cache: 1 year, immutable

**API Endpoint:** `GET /api/image?src=<url>&w=<width>&h=<height>&fit=<fit>&q=<quality>&f=<format>`
