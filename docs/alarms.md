# Alarms

Alarms service persists triggered alarms to a database. Alarms are generated automatically by rule `alarm` actions when a message matches the rule conditions — there is no manual alarm creation through the API.

Each alarm record contains the following fields:

| Field       | Description                                               |
|-------------|-----------------------------------------------------------|
| `id`        | Unique alarm identifier                                   |
| `thing_id`  | The thing that triggered the alarm                        |
| `group_id`  | The group the thing belongs to                            |
| `rule_id`   | The rule that triggered the alarm                         |
| `subtopic`  | The message subtopic on which the alarm was triggered     |
| `protocol`  | The protocol used (http, mqtt, coap, etc.)                |
| `rule`      | Snapshot of the rule `conditions` and `operator`          |
| `level`     | Alarm severity, 1–5, taken from the rule action           |
| `status`    | `active`, `noted` or `cleared`; `active` on creation      |
| `created`   | Unix nanosecond timestamp of when the alarm was triggered |

## Querying alarms

Alarms can be queried by thing, group, or organization. All list endpoints support `offset` and `limit` pagination query parameters (maximum 200 per page), `order` (`id`, `created`, `level`, `status`), `dir` (`asc`/`desc`), and the `level`, `status`, `protocol`, `subtopic`, `from` and `to` (Unix nanoseconds) filters.

```bash
# List alarms for a thing
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcalarms/things/<thing_id>/alarms?offset=0&limit=20"
```

```json
{
  "total": 3,
  "offset": 0,
  "limit": 20,
  "alarms": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "thing_id": "111e4567-e89b-12d3-a456-426614174000",
      "group_id": "211e4567-e89b-12d3-a456-426614174000",
      "rule_id": "323e4567-e89b-12d3-a456-426614174000",
      "subtopic": "temperature",
      "protocol": "mqtt",
      "rule": {
        "conditions": [
          { "type": "threshold", "field": "temperature", "comparator": ">", "threshold": 80 }
        ]
      },
      "level": 3,
      "status": "active",
      "created": 1774342578003142691
    }
  ]
}
```

```bash
# List alarms for a group
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcalarms/groups/<group_id>/alarms"

# List alarms for an organization
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcalarms/orgs/<org_id>/alarms"

# View a specific alarm
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/alarms/<alarm_id>"
```

## Updating alarm status

The status of an alarm can be set to `noted` or `cleared`.

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "noted"}' \
  https://localhost/alarms/<alarm_id>
```

## Exporting alarms

Alarms of a thing can be exported as a file. The `convert` query parameter selects the format (`json` or `csv`, default `json`), and `time_format=rfc3339` exports timestamps in RFC 3339 instead of Unix nanoseconds. The list filters above also apply.

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcalarms/things/<thing_id>/alarms/export?convert=csv"
```

## Removing alarms

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"alarm_ids": ["123e4567-e89b-12d3-a456-426614174000"]}' \
  https://localhost/alarms
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
