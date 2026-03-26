# Downlinks

Downlinks service manages scheduled outbound HTTP requests for things and groups. Each downlink defines a target URL, HTTP method, optional headers and payload, and a schedule. When a downlink fires, the service sends the configured HTTP request — enabling the platform to push data or commands to external systems on a timed basis.

Downlinks support cron-like scheduling with automatic time-range parameter injection, making it straightforward to implement periodic data pulls from external APIs without any additional orchestration. On startup, the service loads all persisted downlinks from the database and schedules them according to their configured frequency.

## Scheduling

The `scheduler` object controls when and how often a downlink fires. Supported frequencies are `once`, `minutely`, `hourly`, `daily`, and `weekly`.

One-time downlinks require a `date_time` field in `YYYY-MM-DD HH:MM` format. An optional `time_zone` can be provided — if omitted the system default (UTC) is used.

```json
{
  "scheduler": {
    "frequency": "daily",
    "day_time": "08:00",
    "time_zone": "Europe/Berlin"
  }
}
```

```json
{
  "scheduler": {
    "frequency": "once",
    "date_time": "2026-06-01 08:00"
  }
}
```

For `weekly` frequency, a `week` object can be included to target specific days.

## Time filters

When a downlink needs to carry a time window — for example, fetching external data since the last execution — the optional `time_filter` object configures which query parameters or payload fields receive the start and end of the current schedule interval. The service substitutes these values automatically at execution time.

## Creating and managing downlinks

Downlinks are created per thing. The required fields are `name`, `url`, `method`, and `scheduler`.

```bash
# Create downlinks for a thing
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Push readings to external API",
      "url": "https://api.example.com/ingest",
      "method": "POST",
      "headers": {"Authorization": "Bearer <external_token>"},
      "payload": "{\"source\": \"mainflux\"}",
      "scheduler": {"frequency": "hourly", "hour": 1, "time_zone": "UTC"}
    }
  ]' \
  https://localhost/svcdownlinks/things/<thing_id>/downlinks
```

```json
{
  "downlinks": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Push readings to external API",
      "url": "https://api.example.com/ingest",
      "method": "POST",
      "headers": {"Authorization": "Bearer <external_token>"},
      "payload": "{\"source\": \"mainflux\"}",
      "scheduler": {"frequency": "hourly", "hour": 1, "time_zone": "UTC"},
      "thing_id": "111e4567-e89b-12d3-a456-426614174000",
      "group_id": "211e4567-e89b-12d3-a456-426614174000"
    }
  ]
}
```

```bash
# List downlinks for a thing
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcdownlinks/things/<thing_id>/downlinks

# List downlinks for a group
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcdownlinks/groups/<group_id>/downlinks

# View a specific downlink
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/downlinks/<downlink_id>

# Update a downlink
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Push readings to external API",
    "url": "https://api.example.com/ingest",
    "method": "POST",
    "scheduler": {"frequency": "daily", "day_time": "08:00"}
  }' \
  https://localhost/downlinks/<downlink_id>

# Remove downlinks
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"downlink_ids": ["<downlink_id>"]}' \
  https://localhost/downlinks
```

## Backup and restore

The service exposes backup and restore endpoints for exporting and re-importing all downlink definitions. This is useful for migrations, environment snapshots, or disaster recovery.

```bash
# Export all downlinks
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcdownlinks/backup

# Restore from backup
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/octet-stream" \
  --data-binary '<backup_json>' \
  https://localhost/svcdownlinks/restore
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
