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
| [WPGraphQL Polylang](https://github.com/valu-digital/wp-graphql-polylang) | Polylang GraphQL 支持 |
| [Polylang Slug](https://github.com/grappler/polylang-slug) | 不同语言共享相同 slug |

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

## Headless Bridge 插件

项目自带的插件，用于 ACF 同步和 Webhook 通知。

```bash
# 安装到 WordPress
cp -r wordpress/plugins/headless-bridge /path/to/wp-content/plugins/
```

在 **设置 → Headless Bridge** 配置：
- **API Key**: 与 `.env.local` 的 `ACF_SYNC_KEY` 一致
- **Webhook URL**: `https://your-frontend/api/webhook/revalidate`
- **Webhook Secret**: 与 `.env.local` 的 `WEBHOOK_SECRET` 一致

---

## 生产部署

WordPress 需要部署到公网（Cloudflare Workers 无法访问本地）。

推荐方案：
- [Cloudways](https://www.cloudways.com/) - 托管 VPS
- [SpinupWP](https://spinupwp.com/) - 自管服务器
- [WordPress.com Business](https://wordpress.com/pricing/) - 支持插件
