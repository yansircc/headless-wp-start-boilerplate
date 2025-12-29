# Project Architecture

## Data Flow Overview

```
src/acf/definitions/     ──── bun sync ────►  WordPress (ACF)
      │                                            │
      │ auto-generate                              │ GraphQL
      ▼                                            ▼
src/graphql/_generated/  ◄──── codegen ────  Schema + Types
      │
      │ import
      ▼
routes/**/-services/     ──── kvFirstFetch ────►  KV + Memory
      │                                              │
      │ loader                      background       │ webhook
      ▼                             revalidate       ▼
routes/**/*.tsx          ◄──── stale data ──── WordPress
```

## KV-First Fallback Architecture

```
Request → Memory Cache (1ms) → Cloudflare KV (50ms) → WordPress

• Memory cache: fastest, per-isolate
• KV: populated via webhook, survives WordPress outage
• WordPress: background revalidation, stale-while-revalidate

When WordPress is down, users see cached data from KV
```

## KV Sync Architecture

```
WordPress 内容变更
       ↓
WordPress 插件发送 Webhook
(action, post_type, slug, locale)
       ↓
Cloudflare Worker (前端 webhook handler)
  1. 清除内存缓存
  2. 用前端 GraphQL 查询获取数据
  3. 通过 Worker Binding 直接写入 KV  ← 无需 API Token！
       ↓
用户请求: Memory → KV → WordPress
```

## i18n SSOT (Single Source of Truth)

```
WordPress Polylang (SSOT)
      │
      │ bun sync
      ▼
GraphQL LanguageCodeEnum
      │
      ├──► intlayer.config.ts (auto-generated)
      │
      └──► src/lib/i18n/language.ts (derived from enum)
                  │
                  └──► toLanguageFilter(), toLanguageCode()
                            │
                            └──► All service files import from here
```
