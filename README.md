# Headless WordPress + TanStack Start

基于 TanStack Start 的 Headless WordPress 前端，使用 Zod Schema 定义 ACF 字段，实现类型安全的全栈开发。

## 快速开始

```bash
bun install
bun dev
```

## 开发流程

修改数据结构时，只需改一处：

```bash
# 1. 修改 ACF 字段定义
vim acf/definitions/product/fields.ts

# 2. 同步（自动生成 fragment + schema + 类型）
bun sync
```

## 项目结构

```
acf/
├── schemas/fields/      # 字段构建器 (textField, numberField, ...)
├── definitions/         # 字段组定义（单一数据源）
├── post-types/          # 文章类型
├── taxonomies/          # 分类法
└── compiled/            # 编译输出 JSON

src/graphql/             # GraphQL 集中管理
├── _generated/          # 自动生成（勿手动修改）
│   ├── product-acf.fragment.graphql
│   └── schema.graphql
├── products/queries.graphql   # 手写查询
├── homepage/queries.graphql
└── fragments/media.graphql

src/routes/
└── products/
    ├── -services/       # Server Functions
    └── -components/     # 组件
```

## 添加新字段

```typescript
// acf/definitions/product/fields.ts
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
| `bun dev` | 开发服务器 |
| `bun build` | 构建 |
| `bun sync` | 同步（生成 fragment → 编译 ACF → 推送 → codegen） |
| `bun typecheck` | 类型检查 |

## 环境变量

```bash
WP_URL=http://your-wordpress.local
ACF_SYNC_KEY=your-api-key
```

## WordPress 依赖

- ACF PRO
- WPGraphQL
- WPGraphQL for ACF
- ACF Sync API（自定义插件）
