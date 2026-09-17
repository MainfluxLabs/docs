# Rules

The Rules service provides a **rule engine** for condition matching on incoming device messages — by threshold comparison, or by running a Lua script and using its result.

The engine is driven by the event stream: every message published by a thing is evaluated against all rules assigned to that thing. Rules are created within a group and then assigned to individual things. Scripts are also created within a group, and referenced by ID from a rule's script conditions.

**Prerequisite:** the thing's profile must have `rule_enabled: true` set in its `config` (see [Dispatcher Flags](messaging.md#dispatcher-flags)) — otherwise its messages never reach the rules engine, and assigned rules simply never fire.

## Rules

A rule evaluates a set of conditions against an incoming payload. When conditions are met according to the configured operator (`AND` or `OR`), the rule triggers one or more actions.

| Field         | Description                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | Unique rule identifier                                                                                                                               |
| `group_id`    | ID of the group the rule belongs to                                                                                                                  |
| `name`        | Human-readable rule name                                                                                                                             |
| `description` | Optional free-form description                                                                                                                       |
| `input`       | What triggers evaluation — `type` (`message` or `alarm`), `thing_ids`, and an optional `config` (e.g. `subtopic` filter)                             |
| `conditions`  | List of conditions to evaluate — `threshold` comparisons or `script` runs (see below)                                                                |
| `operator`    | `AND` or `OR` — required when more than one condition is defined                                                                                     |
| `actions`     | List of `{type, id, level}` — `type` is `alarm`, `smtp`, or `smpp`; `id` is the notifier ID for `smtp`/`smpp`; `level` (1–5) is required for `alarm` |

### Conditions

Each condition has a required `type`, which selects how it's evaluated.

| Field        | Description                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`       | `threshold` or `script`                                                                                                                                                                |
| `field`      | Threshold only. The payload field name to evaluate. For SenML messages, this matches the `name` key. For JSON messages, dot-notation paths are supported (e.g. `sensors.temperature`). |
| `comparator` | Threshold only. Comparison operator: `==`, `>=`, `<=`, `>`, `<`                                                                                                                        |
| `threshold`  | Threshold only. Numeric value to compare against                                                                                                                                       |
| `script_id`  | Script only. ID of the [script](#scripts) to run                                                                                                                                       |

A `script` condition runs the referenced Lua script and uses its return value as the result: a strict `return true` counts as met, anything else — `return false`, no return, or a runtime error — counts as not met. The script's result is combined with any other conditions on the rule the same way a threshold result would be, under the rule's `operator`. Script conditions run with a **read-only** API (only `mfx.log` is available, since a condition must not have side effects), and are only supported on `message`-input rules, not `alarm`-input rules. Every evaluation is recorded as a [script run](#script-runs).

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
          {"type": "threshold", "field": "temperature", "comparator": ">", "threshold": 45},
          {"type": "threshold", "field": "humidity", "comparator": "<", "threshold": 20}
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

A rule with a script condition instead:

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "name": "Condensation Risk Alert",
        "input": {
          "type": "message",
          "thing_ids": ["123e4567-e89b-12d3-a456-426614174000"]
        },
        "conditions": [
          {"type": "script", "script_id": "456e4567-e89b-12d3-a456-426614174abc"}
        ],
        "actions": [
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
    "conditions": [{"type": "threshold", "field": "temperature", "comparator": ">", "threshold": 50}],
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

## Scripts

A Lua script is a group-scoped resource, referenced by ID from a rule's [script conditions](#conditions) — it is not assigned to things directly, and only runs when a rule's condition invokes it.

| Field         | Description                           |
| ------------- | ------------------------------------- |
| `id`          | Unique script identifier              |
| `group_id`    | ID of the group the script belongs to |
| `name`        | Human-readable script name            |
| `description` | Optional free-form description        |
| `script`      | Lua source code (max 65,535 bytes)    |

### Execution Environment

Each script execution receives an isolated Lua environment with an `mfx` global:

| Field / Function           | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `mfx.message.payload`      | Parsed message payload (JSON object or array item)                 |
| `mfx.message.subtopic`     | Message subtopic                                                   |
| `mfx.message.created`      | Message creation timestamp (Unix)                                  |
| `mfx.message.publisher_id` | Thing ID that published the message                                |
| `mfx.log(message)`         | Appends a message to the run log (max 256 lines, 2048 chars each). |

`mfx.log` is currently the only bound function, since scripts only run as read-only rule conditions today. Available Lua standard libraries: `base`, `math`, `string`, `table`. The `print` function is disabled. Scripts are capped at 1,000,000 instructions and 65,535 bytes of source.

Example condition script — flags condensation risk from a payload's `temperature` and `humidity` fields:

```lua
local payload = mfx.message.payload
local temp = tonumber(payload["temperature"])
local hum  = tonumber(payload["humidity"])

if not temp or not hum or hum <= 0 then
  mfx.log("Invalid or missing fields")
  return
end

-- Magnus formula: dew point from temperature and relative humidity
local gamma = math.log(hum / 100.0) + (17.625 * temp) / (243.04 + temp)
local dew_point = 243.04 * gamma / (17.625 - gamma)
local spread = temp - dew_point  -- smaller spread → closer to condensation

mfx.log(string.format("temp=%.1f  hum=%.1f%%  dew_point=%.1f  spread=%.1f",
  temp, hum, dew_point, spread))

-- condensation risk if the surface is within 2°C of the dew point
return spread <= 2.0
```

### Create Scripts

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scripts": [
      {
        "name": "Condensation risk",
        "description": "Flags condensation risk from temperature and humidity readings",
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
  -d '{"name": "Condensation risk (v2)", "script": "..."}' \
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

Every script condition evaluation is recorded as a run, capturing the outcome, logs, and any runtime error.

| Field         | Description                                      |
| ------------- | ------------------------------------------------ |
| `id`          | Unique run identifier                            |
| `script_id`   | ID of the script that was executed               |
| `rule_id`     | ID of the rule whose condition triggered the run |
| `thing_id`    | ID of the thing that triggered the execution     |
| `logs`        | Log lines written via `mfx.log()`                |
| `started_at`  | Execution start timestamp (RFC 3339)             |
| `finished_at` | Execution end timestamp (RFC 3339)               |
| `status`      | `success` or `fail`                              |
| `error`       | Runtime error message, if any                    |

`status` reflects only whether the script ran without a Lua runtime error — it does not reflect whether the script's return value counted as the condition being met. `rule_id` is empty on runs recorded before rule-scoped tracking was added.

### List Runs for a Rule

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/rules/<rule_id>/runs
```

### List Runs for a Thing

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/things/<thing_id>/runs
```

Both listing endpoints support the same `status`, `from`, `to` (Unix ms), and pagination query parameters.

### Delete Runs

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"script_run_ids": ["789e4567-e89b-12d3-a456-426614174xyz"]}' \
  http://localhost/runs
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
