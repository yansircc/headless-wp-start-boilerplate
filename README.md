# Headless WordPress + TanStack Start

基于 TanStack Start 的 Headless WordPress 前端，使用 Zod Schema 定义 ACF 字段，实现类型安全的全栈开发。

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19) |
| Routing | [TanStack Router](https://tanstack.com/router) (File-based) |
| Data Fetching | [TanStack Query](https://tanstack.com/query) + [GraphQL Request](https://github.com/graffle-js/graphql-request) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Schema Validation | [Zod](https://zod.dev/) |
| Code Generation | [GraphQL Codegen](https://the-guild.dev/graphql/codegen) |
| Build Tool | [Vite](https://vitejs.dev/) |
| Linting | [Biome](https://biomejs.dev/) via [Ultracite](https://github.com/haydenbleasel/ultracite) |
| Runtime | [Bun](https://bun.sh/) |

## 快速开始

```bash
# 1. 安装依赖
bun install

# 2. 配置环境变量
cp .env.example .env.local

# 3. 启动开发服务器
bun dev
```

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Data Flow                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ACF Definitions    ─── bun sync ───►    WordPress (ACF)           │
│         │                                      │                     │
│         │ auto-generate                        │ GraphQL             │
│         ▼                                      ▼                     │
│   _generated/        ◄─── codegen ───    Schema + Types             │
│         │                                                            │
│         │ import                                                     │
│         ▼                                                            │
│   routes/*.tsx       ─── TanStack ───►   Browser (SSR/CSR)          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 项目结构

```
├── src/
│   ├── acf/
│   │   ├── schemas/fields/      # 字段构建器 (textField, numberField, ...)
│   │   ├── definitions/         # 字段组定义（单一数据源）
│   │   │   └── product/
│   │   │       ├── fields.ts    # 字段定义
│   │   │       ├── index.ts     # 字段组配置
│   │   │       └── _generated/  # 自动生成（禁止修改）
│   │   ├── post-types/          # 自定义文章类型
│   │   ├── taxonomies/          # 自定义分类法
│   │   └── compiled/            # 编译输出 JSON（禁止修改）
│   ├── graphql/
│   │   ├── _generated/          # 自动生成（禁止修改）
│   │   ├── products/queries.graphql
│   │   └── fragments/media.graphql
│   ├── routes/                  # 文件路由
│   ├── lib/
│   │   ├── graphql/             # GraphQL 客户端
│   │   └── seo/
│   │       └── seo.config.ts    # SEO 配置（SSOT）
│   └── routeTree.gen.ts         # 自动生成（禁止修改）
├── scripts/
│   ├── sync.ts                  # ACF 同步脚本
│   ├── generate-seo-files.ts    # SEO 生成脚本
│   └── validate.ts              # 构建前验证脚本
├── public/
│   ├── robots.txt               # 自动生成（禁止修改）
│   └── sitemap.xml              # 自动生成（禁止修改）
└── .claude/
    └── CLAUDE.md                # AI 开发指南
```

## 命令

| 命令 | 说明 |
|------|------|
| `bun dev` | 开发服务器 (port 3008) |
| `bun build` | 构建生产版本（自动运行 validate） |
| `bun sync` | ACF 同步：生成 fragment → 编译 → 推送 WP → codegen |
| `bun seo` | 验证 SEO 配置 + 生成 robots.txt/sitemap.xml |
| `bun validate` | 运行所有构建前检查 |
| `bun typecheck` | TypeScript 类型检查 |
| `bun lint` | 代码检查与格式化 |

## 开发流程

### 添加新 ACF 字段

```bash
# 1. 定义字段
vim src/acf/definitions/product/fields.ts

# 2. 添加到字段组
vim src/acf/definitions/product/index.ts

# 3. 同步（自动生成 fragment + schema + 类型）
bun sync

# 完成！新字段自动出现在 GraphQL 查询中
```

### 添加新页面

```bash
# 1. 创建路由文件
touch src/routes/about.tsx

# 2. 运行 SEO 验证，获取需要添加的配置
bun seo

# 3. 复制输出的配置到 seo.config.ts
vim src/lib/seo/seo.config.ts

# 4. 填写 title 和 description
```

## 构建前验证

`bun validate` 会自动检查：

```
────────────────────────────────────────────────────────────
  Check 1: Auto-generated files
────────────────────────────────────────────────────────────
  ✅ No manual modifications to generated files

────────────────────────────────────────────────────────────
  Check 2: Generated files exist
────────────────────────────────────────────────────────────
  ✅ All critical generated files exist

────────────────────────────────────────────────────────────
  Check 3: Fragment usage
────────────────────────────────────────────────────────────
  ✅ All GraphQL queries use auto-generated fragments correctly

────────────────────────────────────────────────────────────
  Check 4: SEO configuration
────────────────────────────────────────────────────────────
  ✅ SEO configuration is valid
```

**验证失败会阻塞构建**，确保代码质量。

## SEO 配置

项目使用 `src/lib/seo/seo.config.ts` 作为 SEO 配置的 Single Source of Truth。

```typescript
export const seoConfig = {
  site: {
    url: process.env.SITE_URL,
    name: process.env.SITE_NAME,
    tagline: "你的网站标语",
    language: "zh-CN",
    separator: "-",
  },
  routes: {
    "/": { title: "", description: "首页描述" },
    "/posts": { title: "博客", description: "文章列表描述" },
  },
  dynamicRoutes: {
    "/posts/$postId": { fallbackTitle: "文章", type: "article" },
  },
  robots: {
    rules: [{ userAgent: "*", allow: ["/"], disallow: ["/api"] }],
  },
};
```

### Title 格式

遵循 Yoast/RankMath 行业标准：
- 首页: `{siteName} - {tagline}`
- 其他页面: `{pageTitle} - {siteName}`

### 添加新路由时

运行 `bun seo` 会输出可复制的配置代码：

```bash
❌ Missing Route Configs

│  👉 Add this to seo.config.ts → routes: {
│
│      "/about": {
│        title: "About", // TODO: 填写页面标题
│        description: "", // TODO: 填写页面描述
│      },
```

## 自动生成文件（禁止修改）

以下文件由脚本自动生成，手动修改会被覆盖或导致验证失败：

```
❌ src/graphql/_generated/*
❌ src/acf/definitions/*/_generated/*
❌ src/acf/compiled/*
❌ src/routeTree.gen.ts
❌ public/robots.txt
❌ public/sitemap.xml
```

## 环境变量

```bash
WP_URL=http://your-wordpress.local
GRAPHQL_ENDPOINT=http://your-wordpress.local/graphql
ACF_SYNC_KEY=your-api-key
SITE_URL=https://your-domain.com
SITE_NAME=Your Site Name
```

## WordPress 设置

### 必需插件

- [ACF PRO](https://www.advancedcustomfields.com/pro/)
- [WPGraphQL](https://www.wpgraphql.com/)
- [WPGraphQL for ACF](https://acf.wpgraphql.com/)

### ACF Sync API 插件

```bash
# 将插件复制到 WordPress
cp -r wordpress/plugins/acf-sync-api /path/to/wordpress/wp-content/plugins/
```

在 `wp-config.php` 中配置 API Key：

```php
define('ACF_SYNC_API_KEY', 'your-api-key');
```

## AI 开发

本项目包含详细的 AI 开发指南：`.claude/CLAUDE.md`

该文件包含：
- 项目架构图
- 文件依赖关系
- 开发流程 checklist
- 禁止事项
- 常见任务示例
- 故障排查指南

## License

MIT
