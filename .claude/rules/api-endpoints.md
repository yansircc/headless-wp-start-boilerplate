# API Endpoints

## Webhook (Content Changes)

```
POST /api/webhook/revalidate
Header: X-Headless-Bridge-Signature: <HMAC-SHA256>
Body: { action, post_type, post_id, slug, locale, timestamp }

Response: {
  success: true,
  memory_invalidated: 3,
  kv_updated: 3,
  kv_deleted: 0
}
```

## Full Sync

```
POST /api/kv/sync
Header: Authorization: Bearer <WEBHOOK_SECRET>

Response: {
  success: true,
  synced: ["homepage:data:en", "posts:list:en", ...],
  total: 9,
  locales: ["en", "zh", "ja"]
}
```
