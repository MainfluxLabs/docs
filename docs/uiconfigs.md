# UIConfigs

The UIConfigs service stores and retrieves free-form JSON configuration objects scoped to organizations, groups, and things. It is intended for frontends and dashboards that need to persist display or layout settings without requiring database schema changes.

Each organization, group, and thing has a single config object, all upserted on write, so a PUT always creates or replaces the full config.

## Org configs

Each organization has a single config object. Viewing it requires the org viewer role, and updating it requires the org editor role.

```bash
# Retrieve org config
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/orgs/<org_id>/configs
```

```json
{
  "org_id": "511e4567-e89b-12d3-a456-426614174000",
  "config": {
    "theme": "dark",
    "sidebar": {"collapsed": false},
    "defaultView": "dashboard"
  }
}
```

```bash
# Update org config
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"config": {"theme": "dark", "sidebar": {"collapsed": false}, "defaultView": "dashboard"}}' \
  https://localhost/svcuiconfigs/orgs/<org_id>/configs
```

Any user can list the configs of the organizations they can view. Admin users get the configs of all organizations:

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/orgs/configs
```

## Group configs

Each group has a single config object. Viewing it requires the group viewer role, and updating it requires the group editor role. Group configs are typically used to store group-level dashboard layouts and widget arrangements.

```bash
# Retrieve group config
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/groups/<group_id>/configs
```

```json
{
  "group_id": "321e4567-e89b-12d3-a456-426614174000",
  "config": {
    "dashboardLayout": "grid",
    "widgets": ["chart", "kpi", "map"]
  }
}
```

```bash
# Update group config
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"config": {"dashboardLayout": "grid", "widgets": ["chart", "kpi", "map"]}}' \
  https://localhost/svcuiconfigs/groups/<group_id>/configs
```

Any user can list the configs of the groups they can view. Admin users get the configs of all groups:

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/groups/configs
```

## Thing configs

Each thing has a single config object. Viewing it requires the viewer role in the thing's group, and updating it requires the editor role in the thing's group. Thing configs are typically used to store per-widget display settings in dashboards.

```bash
# Retrieve thing config
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/things/<thing_id>/configs
```

```json
{
  "thing_id": "111e4567-e89b-12d3-a456-426614174000",
  "config": {
    "chartType": "line",
    "unit": "°C",
    "color": "#ff6600"
  }
}
```

```bash
# Update thing config
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"config": {"chartType": "line", "unit": "°C", "color": "#ff6600"}}' \
  https://localhost/svcuiconfigs/things/<thing_id>/configs
```

Any user can list the configs of the things they can view. Admin users get the configs of all things:

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcuiconfigs/things/configs
```

## Backup and restore

The service exposes backup and restore endpoints for exporting and re-importing the full configuration state. This is useful for migrations, environment snapshots, or disaster recovery. Both endpoints are restricted to admin users.

```bash
# Export all configs
curl -s -S -i \
  -H "Authorization: Bearer <admin_token>" \
  https://localhost/svcuiconfigs/backup
```

```json
{
  "orgs_configs": [
    {
      "org_id": "511e4567-e89b-12d3-a456-426614174000",
      "config": {"theme": "dark", "defaultView": "dashboard"}
    }
  ],
  "groups_configs": [
    {
      "group_id": "321e4567-e89b-12d3-a456-426614174000",
      "config": {"dashboardLayout": "grid", "widgets": ["chart", "kpi", "map"]}
    }
  ],
  "things_configs": [
    {
      "thing_id": "111e4567-e89b-12d3-a456-426614174000",
      "group_id": "321e4567-e89b-12d3-a456-426614174000",
      "config": {"chartType": "line", "unit": "°C"}
    }
  ]
}
```

```bash
# Restore from backup
curl -s -S -i -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/octet-stream" \
  -d '<backup_json>' \
  https://localhost/svcuiconfigs/restore
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
