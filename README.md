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

## 开发流程

修改数据结构时，只需改一处：

```bash
# 1. 修改 ACF 字段定义
vim src/acf/definitions/product/fields.ts

# 2. 同步（自动生成 fragment + schema + 类型）
bun sync
```

## 项目结构

```
├── src/
│   ├── acf/
│   │   ├── schemas/fields/      # 字段构建器 (textField, numberField, ...)
│   │   ├── definitions/         # 字段组定义（单一数据源）
│   │   ├── post-types/          # 文章类型
│   │   ├── taxonomies/          # 分类法
│   │   └── compiled/            # 编译输出 JSON
│   ├── graphql/                 # GraphQL 集中管理
│   │   ├── _generated/          # 自动生成（勿手动修改）
│   │   ├── products/queries.graphql
│   │   └── fragments/media.graphql
│   ├── routes/                  # 文件路由（SEO 的 SSOT）
│   ├── components/shared/       # 共享组件
│   ├── lib/
│   │   ├── graphql/             # GraphQL 客户端配置
│   │   └── seo/                 # SEO 工具函数
│   └── routeTree.gen.ts         # 自动生成的路由树
├── scripts/
│   └── generate-seo-files.ts    # SEO 文件生成脚本
├── public/
│   ├── robots.txt               # 自动生成
│   └── sitemap.xml              # 自动生成
└── wordpress/
    └── plugins/
        └── acf-sync-api/        # WordPress 插件（需复制到 WP）
```

## 添加新字段

```typescript
// src/acf/definitions/product/fields.ts
export const priceField = textField({
  key: "field_price",
  name: "price",
  label: "价格",
  required: true,
  prepend: "¥",
});
```

运行 `bun sync` 后，字段自动出现在：
- `_generated/product-acf.fragment.graphql`
- 生成的 TypeScript 类型中

## 命令

| 命令 | 说明 |
|------|------|
| `bun dev` | 开发服务器 (port 3008) |
| `bun build` | 构建生产版本（自动生成 SEO 文件） |
| `bun sync` | 同步（生成 fragment → 编译 ACF → 推送 → codegen） |
| `bun seo` | 生成 robots.txt 和 sitemap.xml |
| `bun typecheck` | 类型检查 |
| `bun lint` | 代码检查与格式化 |

## SEO

项目内置完全自动化的 SEO 支持，以 `routeTree.gen.ts` 为 Single Source of Truth。

### 自动生成

- **robots.txt** - 自动生成，包含 sitemap 链接
- **sitemap.xml** - 自动发现所有路由和动态内容

### 工作原理

```
routeTree.gen.ts (SSOT)
    │
    ├── /about           → 静态页面
    ├── /posts           → 列表页面
    ├── /posts/$postId   → 动态内容 → GraphQL: posts
    └── /products/$id    → 动态内容 → GraphQL: products
```

### 添加新内容类型

只需创建路由文件，SEO 自动适配：

```bash
# 1. 创建路由
touch src/routes/accessories/index.tsx
touch src/routes/accessories/\$accessoryId.tsx

# 2. 重新生成（或等待 build 自动执行）
bun seo
```

脚本会自动：
- 发现 `/accessories` 是列表页
- 发现 `/accessories/$accessoryId` 需要从 GraphQL `accessories` 查询获取数据
- 生成完整的 sitemap

### 页面级 SEO

每个路由使用 `head()` 配置 meta 标签：

```typescript
// src/routes/posts/$postId.tsx
export const Route = createFileRoute("/posts/$postId")({
  head: ({ loaderData: post }) => ({
    meta: buildSeoMeta({
      title: post?.title,
      description: generateDescription(post?.content),
      type: "article",
    }, seoConfig.siteUrl),
  }),
});
```

## 环境变量

复制 `.env.example` 到 `.env.local` 并配置：

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

本项目包含一个自定义 WordPress 插件，用于接收前端推送的 ACF 字段定义：

```bash
# 将插件复制到 WordPress
cp -r wordpress/plugins/acf-sync-api /path/to/wordpress/wp-content/plugins/
```

然后在 WordPress 后台启用插件，并在 `wp-config.php` 中配置 API Key：

```php
define('ACF_SYNC_API_KEY', 'your-api-key');
```

确保 `.env.local` 中的 `ACF_SYNC_KEY` 与此值匹配。

## License

MIT
