# UIConfigs

UIConfigs service stores and retrieves schema-free JSON configuration objects scoped to organizations and things. It is intended for frontends and dashboards that need to persist display or layout settings without requiring database schema changes.

Configuration objects are free-form JSON — any structure is accepted, allowing frontends to store arbitrary settings without schema constraints. Each organization has a single config object, and each thing has a single config object. Both are upserted on write, so a PUT always creates or replaces the full config.

The service also exposes backup and restore endpoints for exporting and re-importing the full configuration state.

## Org configs

Each organization has a single config object accessible to any member of that org.

```bash
# Retrieve org config
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/orgs/<org_id>/configs
```

```json
{
  "theme": "dark",
  "sidebar": {"collapsed": false},
  "defaultView": "dashboard"
}
```

```bash
# Update org config
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark", "sidebar": {"collapsed": false}, "defaultView": "dashboard"}' \
  https://localhost/svcuiconfigs/orgs/<org_id>/configs
```

Administrators can retrieve configs for all organizations:

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/orgs/configs
```

## Thing configs

Each thing has a single config object, accessible to users authorized for that thing's group. Thing configs are typically used to store per-widget display settings in dashboards.

```bash
# Retrieve thing config
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/things/<thing_id>/configs
```

```json
{
  "chartType": "line",
  "unit": "°C",
  "color": "#ff6600"
}
```

```bash
# Update thing config
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"chartType": "line", "unit": "°C", "color": "#ff6600"}' \
  https://localhost/svcuiconfigs/things/<thing_id>/configs
```

Administrators can retrieve configs for all things:

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/things/configs
```

## Backup and restore

The service exposes backup and restore endpoints for exporting and re-importing the full configuration state. This is useful for migrations, environment snapshots, or disaster recovery.

```bash
# Export all configs
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/backup
```

```json
{
  "org_configs": [
    {
      "org_id": "511e4567-e89b-12d3-a456-426614174000",
      "config": {"theme": "dark", "defaultView": "dashboard"}
    }
  ],
  "thing_configs": [
    {
      "thing_id": "111e4567-e89b-12d3-a456-426614174000",
      "config": {"chartType": "line", "unit": "°C"}
    }
  ]
}
```

```bash
# Restore from backup
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '<backup_json>' \
  https://localhost/svcuiconfigs/restore
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
