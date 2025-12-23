# Headless WordPress + TanStack Start

一个**对 AI Agent 友好**的 Headless WordPress 前端模板。通过 `.claude/CLAUDE.md` 指导 AI 理解项目架构，让 Claude Code 等 AI 工具能够正确地完成开发任务。

## 核心特点

- **AI 可理解** - 项目包含完整的 AI 开发指南，Claude Code 能自主完成常见开发任务
- **类型安全** - ACF 字段定义自动生成 GraphQL Fragment + TypeScript 类型
- **缓存 + Webhook** - 服务端缓存 + WordPress 内容变更自动失效

## 快速开始

```bash
bun install
cp .env.example .env.local  # 配置 WordPress 地址
bun dev
```

---

## AI Agent 开发

项目的 `.claude/CLAUDE.md` 文件让 AI 能够理解项目规则并正确执行任务。

### 你可以这样告诉 AI

| 你说 | AI 会做 |
|------|---------|
| "给 product 加一个 stock 字段" | 修改 `fields.ts` → 运行 `bun sync` |
| "新建一个 /about 页面" | 创建路由 → 运行 `bun seo` → 添加 SEO 配置 |
| "新增一个 accessories 内容类型" | 创建 ACF 定义 + Post Type + GraphQL + 路由 |

### AI 知道的规则

通过 CLAUDE.md，AI 了解：

- **禁止修改** `_generated/` 目录下的文件
- **必须使用** 自动生成的 GraphQL Fragment
- **必须运行** `bun sync` 在修改 ACF 字段后
- **必须配置** SEO 在添加新路由后

### 验证机制

`bun build` 会自动验证 AI 的修改是否符合规则：

```
✅ No manual modifications to generated files
✅ All GraphQL queries use auto-generated fragments
✅ SEO configuration is valid
```

---

## 工作原理

```
src/acf/definitions/     ─── bun sync ───►  WordPress (ACF)
       │                                          │
       │ auto-generate                            │ GraphQL
       ▼                                          ▼
_generated/              ◄─── codegen ───   Schema + Types
       │
       │ import
       ▼
routes/*.tsx             ─── SSR/CSR ───►   Browser
```

**关键点**：在 `src/acf/definitions/` 定义字段，运行 `bun sync` 后自动同步到 WordPress 并生成类型。

---

## 命令

| 命令 | 说明 |
|------|------|
| `bun dev` | 开发服务器 |
| `bun build` | 构建（自动验证） |
| `bun sync` | ACF 字段同步 + 类型生成 |
| `bun seo` | SEO 验证 + 生成 sitemap |
| `bun run test` | 运行单元测试 |

---

## 环境配置

```bash
# .env.local
WP_URL=http://your-wordpress.local
GRAPHQL_ENDPOINT=http://your-wordpress.local/graphql
ACF_SYNC_KEY=your-api-key
WEBHOOK_SECRET=your-webhook-secret
SITE_URL=https://your-domain.com
SITE_NAME=Your Site Name
```

---

## WordPress 设置

### 必需插件

- [ACF PRO](https://www.advancedcustomfields.com/pro/)
- [WPGraphQL](https://www.wpgraphql.com/)
- [WPGraphQL for ACF](https://acf.wpgraphql.com/)

### Headless Bridge 插件

```bash
unzip wordpress/plugins/headless-bridge.zip -d /path/to/wp-content/plugins/
```

在 **设置 → Headless Bridge** 配置 API Key 和 Webhook。

---

## 缓存

服务端内存缓存，WordPress 内容变更时通过 Webhook 精确失效：

- TTL: 1 小时
- 失效粒度: post_type + slug
- 健康检查: `GET /api/webhook/revalidate`

---

## Tech Stack

TanStack Start (React 19) · TanStack Router · TanStack Query · Tailwind CSS v4 · Zod · GraphQL Codegen · Vitest · Vite · Biome · Bun

## License

MIT
