# WordPress 设置

## 本地开发推荐

使用 [Local](https://localwp.com/) (原 Local by Flywheel)：

1. 创建新站点
2. 安装必需插件（见下方）
3. 开启 **Live Link** 获取公网 URL，如：
   ```
   https://username:password@xxx.localsite.io
   ```
4. 将此 URL 填入 `.env.local` 的 `GRAPHQL_ENDPOINT`

> Live Link 的 URL 包含 Basic Auth，本项目的 GraphQL client 已支持自动解析。

---

## 必需插件

| 插件 | 用途 |
|------|------|
| [ACF PRO](https://www.advancedcustomfields.com/pro/) | 自定义字段 |
| [WPGraphQL](https://www.wpgraphql.com/) | GraphQL API |
| [WPGraphQL for ACF](https://acf.wpgraphql.com/) | ACF 字段暴露到 GraphQL |
| [Polylang](https://polylang.pro/) | 多语言内容管理 |
| [Yoast SEO](https://yoast.com/wordpress/plugins/seo/) | SEO 管理 |
| [WPGraphQL Yoast SEO](https://github.com/ashhitch/wp-graphql-yoast-seo) | Yoast SEO 暴露到 GraphQL |
| **Headless Bridge** (本项目自带) | Polylang GraphQL 支持 + 不同语言共享相同 slug |

> **注意**: Headless Bridge 已内置 WPGraphQL Polylang 和 Polylang Slug 的功能，无需单独安装这两个插件。

---

## 多语言设置 (Polylang)

> 详细的 i18n 架构和 SSOT 说明见 [I18N.md](./I18N.md)

### 1. 添加语言

**Languages → Languages** 添加需要的语言（如 EN、ZH、JA）。

添加后运行 `bun sync`，前端会自动同步语言配置。

### 2. 启用自定义文章类型

**Languages → Settings → Custom post types and Taxonomies**：
- 勾选 `Product` 等自定义文章类型
- 保存后运行 `bun sync` 更新 GraphQL schema

### 3. URL 设置

**Languages → Settings → URL modifications**：
- 选择 **The language is set from the directory name**
- 默认语言隐藏 URL 前缀（EN 为 `/`，其他为 `/zh/`、`/ja/`）

### 4. 创建多语言内容

1. 创建默认语言（EN）的文章
2. 点击文章列表中的 `+` 图标创建其他语言版本
3. Polylang Slug 插件会让所有语言版本共享相同 slug

---

## SEO 设置 (Yoast SEO)

前端使用 Yoast SEO 管理动态内容的 SEO 数据。

### 1. 安装插件

安装 **Yoast SEO** 和 **WPGraphQL Yoast SEO** 插件。

### 2. 全局设置

**SEO → Settings** 配置：
- Site basics（站点名称、标语）
- Social profiles（社交媒体链接）
- Content types（为每种内容类型设置 SEO 模板）

### 3. 内容 SEO

编辑文章/产品时，在 Yoast SEO 面板中设置：
- **SEO title** - 页面标题
- **Meta description** - 页面描述
- **Social** - Open Graph 和 Twitter 卡片设置

### 4. 与 Polylang 配合

Yoast SEO 与 Polylang 有官方集成：
- 每个语言版本有独立的 SEO 设置
- sitemap 自动包含 hreflang 标签
- 根据当前语言显示正确的 SEO 数据

### 前端如何使用

前端通过 GraphQL 查询 Yoast SEO 数据：

```graphql
query PostBySlug($slug: ID!) {
  post(id: $slug, idType: SLUG) {
    seo {
      title
      metaDesc
      opengraphImage { sourceUrl }
      schema { raw }
    }
  }
}
```

- **动态内容**（文章、产品）: 使用 `buildYoastMeta()` 和 `buildYoastSchema()`
- **静态页面**（首页、列表页）: 使用 `seo.config.ts`
- **robots.txt / sitemap.xml**: 自动代理到 WordPress Yoast 生成的版本

---

## Headless Bridge 插件

项目自带的插件，用于 ACF 同步和 Webhook 通知。

### 安装

```bash
# 从 zip 安装
# WordPress 后台 → Plugins → Add New → Upload Plugin
# 选择 wordpress/plugins/headless-bridge.zip

# 或手动复制
unzip wordpress/plugins/headless-bridge.zip -d /path/to/wp-content/plugins/
```

### 配置

在 **设置 → Headless Bridge** 配置：

| 设置 | 说明 | 对应环境变量 |
|------|------|-------------|
| **API Key** | ACF 同步认证 | `ACF_SYNC_KEY` |
| **Webhook URL** | 前端 webhook 地址 | - |
| **Webhook Secret** | HMAC 签名密钥 | `WEBHOOK_SECRET` |
| **Post Types** | 额外的文章类型 | - |

### 功能

#### 1. ACF 同步 API

前端可以通过 REST API 推送/拉取 ACF 配置：

```
POST /wp-json/headless-bridge/v1/push   # 推送 ACF 配置
GET  /wp-json/headless-bridge/v1/pull   # 拉取 ACF 配置
GET  /wp-json/headless-bridge/v1/status # 检查状态
```

#### 2. Content Webhook

当内容变更时自动通知前端：

- **触发时机**: 发布、更新、删除、移入/移出回收站
- **Payload**: `{ action, post_type, post_id, slug, locale, timestamp }`
- **签名**: HMAC-SHA256，header `X-Headless-Bridge-Signature`

前端收到 webhook 后会：
1. 清除内存缓存
2. 从 WordPress 获取最新数据
3. 写入 Cloudflare KV

#### 3. Full KV Sync

手动触发全量同步到 KV 缓存：

- 点击 **Trigger Full Sync** 按钮
- 同步所有语言的首页、文章列表、产品列表

**使用场景**：
- 首次部署后初始化 KV
- KV 数据异常需要重建
- 添加新语言后

---

## 生产部署

WordPress 需要部署到公网（Cloudflare Workers 无法访问本地）。

推荐方案：
- [Cloudways](https://www.cloudways.com/) - 托管 VPS
- [SpinupWP](https://spinupwp.com/) - 自管服务器
- [WordPress.com Business](https://wordpress.com/pricing/) - 支持插件

### 部署检查清单

- [ ] 安装所有必需插件（包括 Yoast SEO + WPGraphQL Yoast SEO）
- [ ] 配置 Polylang 语言
- [ ] 配置 Yoast SEO 全局设置
- [ ] 安装并配置 Headless Bridge 插件
- [ ] 测试 Webhook 连通性（点击 Test Webhook）
- [ ] 触发 Full Sync 初始化 KV
