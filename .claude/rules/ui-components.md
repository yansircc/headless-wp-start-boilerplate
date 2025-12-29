# UI Components (shadcn)

This project uses **shadcn/ui** for consistent, accessible UI components.

## Configuration

- **Config file:** `components.json`
- **Style:** Nova
- **Theme:** Teal (primary color)
- **Icons:** lucide-react
- **Radius:** 0 (sharp corners)

## Adding Components

```bash
bunx --bun shadcn@latest add <component-name>
```

Available components: https://ui.shadcn.com/docs/components

## Installed Components

```
src/components/ui/
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── dropdown-menu.tsx
├── navigation-menu.tsx
├── separator.tsx
└── skeleton.tsx
```

## Styling Conventions

Use semantic color tokens instead of hardcoded Tailwind colors:

| Use | Instead of |
|-----|------------|
| `text-foreground` | `text-black`, `text-gray-900` |
| `text-muted-foreground` | `text-gray-400`, `text-gray-500` |
| `bg-background` | `bg-white` |
| `bg-muted` | `bg-gray-50`, `bg-gray-100` |
| `bg-card` | `bg-white` (for cards) |
| `border-border` | `border-gray-100`, `border-gray-200` |
| `text-primary` | `text-blue-500`, `text-blue-600` |
| `text-destructive` | `text-red-500`, `text-red-600` |

## Component Usage Patterns

### Button

```tsx
import { Button } from "@/components/ui/button";

// As a link
<Button asChild variant="ghost" size="sm">
  <LocalizedLink to="/posts">
    <ArrowLeft className="h-4 w-4" />
    Back
  </LocalizedLink>
</Button>

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="secondary">Category</Badge>
<Badge variant="destructive">Out of Stock</Badge>
<Badge variant="outline">#tag</Badge>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={avatarUrl} alt="Name" />
  <AvatarFallback>AB</AvatarFallback>
</Avatar>
```

### Separator

```tsx
import { Separator } from "@/components/ui/separator";

<Separator className="my-4" />
<Separator orientation="vertical" />
```

## Dark Mode

Color tokens automatically adapt to dark mode. The theme is configured in `src/styles.css` using oklch colors with CSS variables.

## Important Rules

1. **DO NOT modify `src/components/ui/*`** - These are shadcn-generated
2. **Use semantic colors** - Enables proper dark mode support
3. **Use lucide-react icons** - Consistent with shadcn configuration
4. **Extend via className** - Don't edit component files, use className prop
