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
