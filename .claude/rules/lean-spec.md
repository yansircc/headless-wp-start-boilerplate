# LeanSpec Workflow

## Before ANY Task

1. **Discover context** → Use `board` tool to see project state
2. **Search for related work** → Use `search` tool before creating new specs
3. **Never create files manually** → Always use `create` tool for new specs

## MCP Tools (Preferred)

| Action | MCP Tool | CLI Fallback |
|--------|----------|--------------|
| Project status | `board` | `lean-spec board` |
| List specs | `list` | `lean-spec list` |
| Search specs | `search` | `lean-spec search "query"` |
| View spec | `view` | `lean-spec view <spec>` |
| Create spec | `create` | `lean-spec create <name>` |
| Update spec | `update` | `lean-spec update <spec> --status <status>` |
| Link specs | `link` | `lean-spec link <spec> --depends-on <other>` |
| Dependencies | `deps` | `lean-spec deps <spec>` |
| Token count | `tokens` | `lean-spec tokens <spec>` |

## Core Rules

| Rule | Details |
|------|---------|
| **NEVER edit frontmatter manually** | Use `update`, `link`, `unlink` for metadata |
| **ALWAYS link spec references** | Content mentions another spec → use `link` |
| **Track status transitions** | `planned` → `in-progress` → `complete` |

## SDD Workflow

```
BEFORE: board → search → check existing specs
DURING: update status to in-progress → code → document decisions → link dependencies
AFTER:  update status to complete → document learnings
```

**Status tracks implementation, NOT spec writing.**

## When to Use Specs

| Write spec | Skip spec |
|------------|-----------|
| Multi-part features | Bug fixes |
| Breaking changes | Trivial changes |
| Design decisions | Self-explanatory refactors |

## Token Thresholds

| Tokens | Status |
|--------|--------|
| <2,000 | Optimal |
| 2,000-3,500 | Good |
| 3,500-5,000 | Consider splitting |
| >5,000 | Must split |
