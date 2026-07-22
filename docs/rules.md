# Rules

The Rules service provides two complementary automation engines for processing incoming device messages: a **rule engine** for threshold-based condition matching, and a **Lua scripting engine** for arbitrary message processing logic.

Both engines are driven by the same event stream: every message published by a thing is evaluated against all rules and scripts assigned to that thing. Rules and scripts are created within a group and then assigned to individual things.

**Prerequisite:** the thing's profile must have `rule_enabled: true` set in its `config` (see [Dispatcher Flags](messaging.md#dispatcher-flags)) — otherwise its messages never reach the rules engine, and assigned rules/scripts simply never fire.

## Rules

A rule evaluates a set of conditions against an incoming payload. When conditions are met according to the configured operator (`AND` or `OR`), the rule triggers one or more actions.

| Field         | Description                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | Unique rule identifier                                                                                                                               |
| `group_id`    | ID of the group the rule belongs to                                                                                                                  |
| `name`        | Human-readable rule name                                                                                                                             |
| `description` | Optional free-form description                                                                                                                       |
| `input`       | What triggers evaluation — `type` (`message` or `alarm`), `thing_ids`, and an optional `config` (e.g. `subtopic` filter)                             |
| `conditions`  | List of `{field, comparator, threshold}` comparisons. `comparator` is one of `==`, `>=`, `<=`, `>`, `<`                                              |
| `operator`    | `AND` or `OR` — required when more than one condition is defined                                                                                     |
| `actions`     | List of `{type, id, level}` — `type` is `alarm`, `smtp`, or `smpp`; `id` is the notifier ID for `smtp`/`smpp`; `level` (1–5) is required for `alarm` |

### Create Rules

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "name": "Temperature and Humidity Alert",
        "description": "Triggers when temperature exceeds 45°C and humidity drops below 20%",
        "input": {
          "type": "message",
          "thing_ids": ["123e4567-e89b-12d3-a456-426614174000"]
        },
        "conditions": [
          {"field": "temperature", "comparator": ">", "threshold": 45},
          {"field": "humidity", "comparator": "<", "threshold": 20}
        ],
        "operator": "AND",
        "actions": [
          {"type": "smtp", "id": "513e2557-e09b-42d3-s456-425614175403"},
          {"type": "alarm", "level": 3}
        ]
      }
    ]
  }' \
  http://localhost/groups/<group_id>/rules
```

### List Rules by Group

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/groups/<group_id>/rules?offset=0&limit=20"
```

List endpoints support `offset`, `limit` (max 200), `order=name`, `dir` (`asc`/`desc`), `name` (partial match), and `input_type` (`message`/`alarm`) query parameters.

### List Rules by Thing

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/things/<thing_id>/rules"
```

### View a Rule

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/rules/<rule_id>
```

### Update a Rule

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Temperature Alert",
    "input": {"type": "message"},
    "conditions": [{"field": "temperature", "comparator": ">", "threshold": 50}],
    "actions": [{"type": "alarm", "level": 3}]
  }' \
  http://localhost/rules/<rule_id>
```

Updating a rule does not affect its thing assignments — use the assign/unassign endpoints below for that.

### Assign Things to a Rule

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"thing_ids": ["123e4567-e89b-12d3-a456-426614174000"]}' \
  http://localhost/rules/<rule_id>/things
```

### Unassign Things from a Rule

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"thing_ids": ["123e4567-e89b-12d3-a456-426614174000"]}' \
  http://localhost/rules/<rule_id>/things
```

### List Things Assigned to a Rule

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/rules/<rule_id>/things
```

### Delete Rules

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"rule_ids": ["789e4567-e89b-12d3-a456-426614174abc"]}' \
  http://localhost/rules
```

## Lua Scripts

Lua scripts provide a programmable alternative to condition-based rules. A script is arbitrary Lua code that runs once per incoming message (or once per array element, for array payloads), and can read the message payload, make decisions, and call platform API functions.

**Note:** the Lua scripting engine is disabled by default — set `MF_RULES_SCRIPTS_ENABLED=true` on the rules service to enable it.

### Execution Environment

Each script execution receives an isolated Lua environment with an `mfx` global:

| Field / Function               | Description                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `mfx.message.payload`          | Parsed message payload (JSON object or array item)                             |
| `mfx.message.subtopic`         | Message subtopic                                                               |
| `mfx.message.created`          | Message creation timestamp (Unix)                                              |
| `mfx.message.publisher_id`     | Thing ID that published the message                                            |
| `mfx.smtp_notify(notifier_id)` | Triggers an SMTP notification via the specified notifier. Max 2 calls per run. |
| `mfx.create_alarm(level)`      | Creates an alarm at the given level (1–5). Max 1 call per run.                 |
| `mfx.log(message)`             | Appends a message to the run log (max 256 lines, 2048 chars each).             |

Available Lua standard libraries: `base`, `math`, `string`, `table`. The `print` function is disabled. Scripts are capped at 1,000,000 instructions and 65,535 bytes of source.

Example script:

```lua
local payload = mfx.message.payload
local temp = tonumber(payload["temperature"])
local hum  = tonumber(payload["humidity"])

if not temp or not hum or hum <= 0 then
  mfx.log("Invalid or missing fields")
  return
end

local gamma = math.log(hum / 100.0) + (17.625 * temp) / (243.04 + temp)
local dew_point = 243.04 * gamma / (17.625 - gamma)
local spread = temp - dew_point

if spread <= 2.0 then
  mfx.log("Condensation risk: spread=" .. string.format("%.1f", spread) .. "°C")
  mfx.create_alarm(3)
  mfx.smtp_notify("654e4567-e89b-12d3-a456-426614174999")
end
```

### Create Scripts

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scripts": [
      {
        "name": "Low temperature notifier",
        "description": "Creates alarm and executes SMTP notifier on low temperature reading",
        "script": "local payload = mfx.message.payload\n..."
      }
    ]
  }' \
  http://localhost/groups/<group_id>/scripts
```

### List Scripts by Group

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/groups/<group_id>/scripts
```

### Assign Scripts to a Thing

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"script_ids": ["456e4567-e89b-12d3-a456-426614174abc"]}' \
  http://localhost/things/<thing_id>/scripts
```

### Unassign Scripts from a Thing

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"script_ids": ["456e4567-e89b-12d3-a456-426614174abc"]}' \
  http://localhost/things/<thing_id>/scripts
```

### View a Script

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/scripts/<script_id>
```

### Update a Script

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Enhanced Temperature Transformation", "script": "..."}' \
  http://localhost/scripts/<script_id>
```

### Delete Scripts

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"script_ids": ["456e4567-e89b-12d3-a456-426614174abc"]}' \
  http://localhost/scripts
```

## Script Runs

Every script execution is recorded as a run, capturing the outcome, logs, and any runtime error.

| Field         | Description                                  |
| ------------- | -------------------------------------------- |
| `id`          | Unique run identifier                        |
| `script_id`   | ID of the script that was executed           |
| `thing_id`    | ID of the thing that triggered the execution |
| `logs`        | Log lines written via `mfx.log()`            |
| `started_at`  | Execution start timestamp (RFC 3339)         |
| `finished_at` | Execution end timestamp (RFC 3339)           |
| `status`      | `success` or `fail`                          |
| `error`       | Runtime error message, if any                |

### List Runs for a Thing

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/things/<thing_id>/runs
```

### Delete Runs

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"script_run_ids": ["789e4567-e89b-12d3-a456-426614174xyz"]}' \
  http://localhost/runs
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
