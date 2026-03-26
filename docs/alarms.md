# Alarms

Alarms service persists triggered alarms to a database. Alarms are generated automatically by the Rules engine or Lua scripts when a message matches a defined condition — there is no manual alarm creation through the API.

Each alarm record contains the following fields:

| Field       | Description                                               |
|-------------|-----------------------------------------------------------|
| `id`        | Unique alarm identifier                                   |
| `thing_id`  | The thing that triggered the alarm                        |
| `group_id`  | The group the thing belongs to                            |
| `rule_id`   | The rule that triggered the alarm (if rule-based)         |
| `script_id` | The script that triggered the alarm (if script-based)     |
| `subtopic`  | The message subtopic on which the alarm was triggered     |
| `protocol`  | The protocol used (http, mqtt, coap, etc.)                |
| `payload`   | The raw message payload that triggered the alarm          |
| `created`   | Unix nanosecond timestamp of when the alarm was triggered |

## Querying alarms

Alarms can be queried by thing, group, or organization. All list endpoints support `offset` and `limit` pagination query parameters (maximum 200 per page).

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
      "script_id": "323e4567-e89b-12d3-a456-426614174000",
      "subtopic": "temperature",
      "protocol": "mqtt",
      "payload": { "temperature": 85.2, "unit": "C" },
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

## Removing alarms

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"alarm_ids": ["123e4567-e89b-12d3-a456-426614174000"]}' \
  https://localhost/alarms
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
