# Code Standards (Ultracite)

This project uses **Ultracite** (Biome-based) for linting and formatting.

```bash
bun lint  # Auto-fix issues
```

## Key Rules

- Use `const` by default, `let` only when needed
- Prefer `for...of` over `.forEach()`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- No `console.log` in production code

## Always Use Auto-Generated Fragments

```graphql
# CORRECT - Use the auto-generated fragment
fragment ProductFields on Product {
  productAcfGroup {
    ...ProductAcfFields  # Auto-generated, always up-to-date
  }
}

# WRONG - Manual field listing gets out of sync
fragment ProductFields on Product {
  productAcfGroup {
    price
    stock
    # Missing new fields!
  }
}
```
