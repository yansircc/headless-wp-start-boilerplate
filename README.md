# Headless WordPress + TanStack Start

一个**对 AI Agent 友好**的 Headless WordPress 前端模板。通过 `.claude/CLAUDE.md` 指导 AI 理解项目架构，让 Claude Code 等 AI 工具能够正确地完成开发任务。

## 核心特点

- **AI 可理解** - 项目包含完整的 AI 开发指南，Claude Code 能自主完成常见开发任务
- **类型安全** - ACF 字段定义自动生成 GraphQL Fragment + TypeScript 类型
- **高可用** - KV-first 架构，WordPress 宕机时仍可正常访问
- **i18n 就绪** - Intlayer + Polylang，URL 路由模式 (`/`, `/zh/`, `/ja/`)，SEO 友好

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

`bun run build` 会自动验证 AI 的修改是否符合规则：

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
| `bun run build` | 构建（自动检查） |
| `bun run deploy` | 快照 KV + 构建 + 部署 |
| `bun sync` | ACF 字段同步 + 类型生成 |
| `bun snapshot` | 预填充 Cloudflare KV 缓存 |
| `bun checkall` | 运行所有预构建检查 |
| `bun run test` | 运行单元测试 |

---

## 环境配置

复制 `.env.example` 到 `.env.local` 并填写。变量说明见 `src/env.ts`。

---

## 部署 (Cloudflare Workers)

```bash
npx wrangler login     # 首次登录
bun env:push           # 推送 .env.prod.local 到 Cloudflare
bun run deploy         # 部署
```

---

## WordPress 设置

详见 [wordpress/README.md](./wordpress/README.md)（插件安装、Local 本地开发、生产部署）。

---

## 缓存 & 高可用

KV-first 架构确保 WordPress 宕机时用户仍可正常访问：

```
请求 → 内存缓存(1ms) → Cloudflare KV(50ms) → WordPress(后台刷新)
```

- **内存缓存**: 每个 Worker isolate，最快
- **Cloudflare KV**: 构建时通过 `bun snapshot` 预填充
- **WordPress**: 后台异步刷新，stale-while-revalidate
- **Webhook**: 内容变更时精确失效 (`/api/webhook/revalidate`)

---

## Tech Stack

TanStack Start (React 19) · TanStack Router · TanStack Query · Tailwind CSS v4 · Intlayer · Polylang · Zod · GraphQL Codegen · t3-env · Vitest · Vite · Biome · Bun · Cloudflare Workers

## License

MIT
