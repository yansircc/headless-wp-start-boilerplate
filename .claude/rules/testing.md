# Testing

Unit tests use **Vitest** + **React Testing Library**.

```bash
bun run test        # Run all tests
bun vitest          # Watch mode
bun vitest --coverage  # With coverage report
```

## Test Structure

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

## Writing Tests

- Place tests next to the file being tested (`*.test.ts` or `*.test.tsx`)
- Use `renderWithProviders()` from `@/test/utils` for components needing React Query
- Mock `@tanstack/react-router` when testing components with `Link` or `useRouter`
