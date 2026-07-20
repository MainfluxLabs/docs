# Audit

The Audit service consumes Redis Stream events published by every other Mainflux service, persists them to its own PostgreSQL database, and exposes a read-only HTTP API for querying the recorded audit trail. There is no manual event creation through the API — events are generated automatically whenever another service performs an action (e.g. creating a thing, updating an org).

Each event contains the following fields:

| Field         | Description                                                               |
| ------------- | ------------------------------------------------------------------------- |
| `id`          | Unique event identifier                                                   |
| `occurred_at` | RFC 3339 timestamp of when the recorded action occurred                   |
| `operation`   | The operation that triggered the event, e.g. `thing.create`, `org.create` |
| `actor`       | `{id, email}` of the user whose action triggered the event                |
| `org_id`      | Organization the event belongs to (absent if not tied to an org)          |
| `group_id`    | Group the event belongs to (absent if not tied to a group)                |
| `action_data` | Operation-specific payload describing the event (always present)          |

## Querying events

All list endpoints support `offset`, `limit` (max 200), `order` (`id`, `occurred_at`, `operation`, `actor_email`, `org_id`, `group_id`), `dir` (`asc`/`desc`), `email` (filter by actor email), `operation` (filter by operation name), `from`/`to` (Unix timestamp bounds on `occurred_at`), and `action_data` (URL-encoded JSON — returns events whose `action_data` contains all supplied key/value pairs).

```bash
# List all events across the platform — restricted to root administrators
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/svcaudit/events?offset=0&limit=20"
```

```json
{
  "total": 2,
  "offset": 0,
  "limit": 10,
  "events": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "occurred_at": "2026-06-12T14:22:17.357447Z",
      "operation": "thing.create",
      "actor": {
        "id": "574106f7-030e-4881-8ab0-151195c29f94",
        "email": "user@example.com"
      },
      "org_id": "374106f7-030e-4881-8ab0-151195c29f92",
      "group_id": "211e4567-e89b-12d3-a456-426614174000",
      "action_data": {
        "id": "111e4567-e89b-12d3-a456-426614174000",
        "name": "sensor-1",
        "profile_id": "311e4567-e89b-12d3-a456-426614174000"
      }
    }
  ]
}
```

```bash
# List events within an organization — caller must be an org admin (or higher)
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/svcaudit/orgs/<org_id>/events"

# List events within a group — caller must be a group admin (or higher)
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/svcaudit/groups/<group_id>/events"

# Filter by operation and time range
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/svcaudit/orgs/<org_id>/events?operation=thing.create&from=1735689600&to=1738368000"
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
