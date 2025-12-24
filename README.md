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

### 自动化命令

这些命令专为 AI 协作设计，提供清晰的错误提示让 AI 能自主修复：

| 命令 | AI 用途 |
|------|---------|
| `bun sync` | ACF 变更后同步到 WordPress + 生成类型 |
| `bun checkall` | 构建前验证，失败时输出修复指引 |
| `bun seo` | 新路由后检查 SEO 配置 |

**工作流示例**：AI 添加字段 → 运行 `bun sync` → 失败 → 看错误 → 自主修复

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
| `bun run deploy` | 构建 + 部署到 Cloudflare Workers |
| `bun sync` | ACF 字段同步 + 类型生成 |
| `bun checkall` | 运行所有预构建检查 |
| `bun run test` | 运行单元测试 |

---

## 环境配置

复制 `.env.example` 到 `.env.local` 并填写。变量说明见 `src/env.ts`。

---

## 部署 (Cloudflare Workers)

### 费用说明

| 服务 | 免费额度 | 说明 |
|------|----------|------|
| **Workers** | 10万次/天 | 足够中小型站点 |
| **KV** | 10万次读/天，1000次写/天 | 写入主要来自 webhook |

> 对于大多数项目，**免费套餐完全够用**。超出后按量计费，非常便宜。

### 部署步骤

```bash
# 1. 首次设置
npx wrangler login                    # 登录 Cloudflare
npx wrangler kv namespace create FALLBACK_KV  # 创建 KV namespace

# 2. 配置 wrangler.jsonc
# 将上一步输出的 id 填入 wrangler.jsonc 的 kv_namespaces

# 3. 配置生产环境变量
cp .env.example .env.prod.local       # 创建生产配置
vim .env.prod.local                   # 填入生产 WordPress 地址和密钥

# 4. 部署
bun env:push                          # 推送密钥到 Cloudflare
bun run deploy                        # 构建 + 部署
```

### 环境变量说明

`.env.prod.local` 需要配置：

```bash
GRAPHQL_ENDPOINT=https://your-wordpress.com/graphql  # WordPress GraphQL 地址
ACF_SYNC_KEY=your-sync-key                           # ACF 同步密钥（与 WP 插件一致）
WEBHOOK_SECRET=your-webhook-secret                   # Webhook 签名密钥
```

> `.env.prod.local` 会被 `bun env:push` 推送到 Cloudflare Secrets，不会出现在代码中。

### 部署后

1. 在 WordPress 后台 **Settings → Headless Bridge** 配置 Webhook URL
2. 点击 **Test Webhook** 验证连通性
3. 点击 **Trigger Full Sync** 初始化 KV 缓存（可选，系统会自动回填）

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
- **Cloudflare KV**: 通过 Webhook 自动同步，无需手动维护
- **WordPress**: 后台异步刷新，stale-while-revalidate
- **Webhook**: 内容变更时自动同步到 KV (`/api/webhook/revalidate`)

### KV 同步方式

| 方式 | 触发时机 | 说明 |
|------|----------|------|
| **Webhook** | 内容变更时 | WordPress 插件自动发送，前端写入 KV |
| **Full Sync** | 手动触发 | WordPress 后台按钮 或 `POST /api/kv/sync` |
| **Auto-backfill** | 用户访问时 | KV miss → WordPress → 写入 Memory + KV |

系统具有**自愈能力**：即使忘记 Full Sync 或 Webhook 失败，用户访问时会自动回填 KV。

---

## Tech Stack

TanStack Start (React 19) · TanStack Router · TanStack Query · Tailwind CSS v4 · Intlayer · Polylang · Zod · GraphQL Codegen · t3-env · Vitest · Vite · Biome · Bun · Cloudflare Workers

## License

MIT
