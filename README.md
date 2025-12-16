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
│   ├── routes/                  # 文件路由
│   ├── components/shared/       # 共享组件
│   └── lib/graphql/             # GraphQL 客户端配置
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
| `bun build` | 构建生产版本 |
| `bun sync` | 同步（生成 fragment → 编译 ACF → 推送 → codegen） |
| `bun typecheck` | 类型检查 |
| `bun lint` | 代码检查与格式化 |

## 环境变量

复制 `.env.example` 到 `.env.local` 并配置：

```bash
WP_URL=http://your-wordpress.local
GRAPHQL_ENDPOINT=http://your-wordpress.local/graphql
ACF_SYNC_KEY=your-api-key
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
