# Shadows

Shadows service maintains a **device shadow** for each thing — a persisted record holding the thing's last _reported_ state and its _desired_ state. It lets users read and set a thing's state even while the thing is offline, and aligns the two whenever the thing reconnects.

A shadow is a single record per thing.

| Field         | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| `thing_id`    | ID of the thing the shadow belongs to                                           |
| `state`       | Nested object holding the `desired`, `reported`, and `delta` states (see below) |
| `reported_at` | Unix timestamp (seconds) of the last reported-state update                      |
| `updated_at`  | Unix timestamp (seconds) of the last desired-state update                       |

## State

`desired`, `reported`, and `delta` are each a free-form JSON object (a set of key/value pairs).

| Field      | Description                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `desired`  | State the application wants the thing to reach.                                                          |
| `reported` | State the thing last reported. Merged from the thing's telemetry messages.                               |
| `delta`    | Computed subset of `desired` whose values differ from (or are absent in) `reported`. Omitted when empty. |

The `delta` is derived on read and on every state change; it is never stored directly. Keys present only in `reported` are not part of the delta.

## How it works

- **Desired state** is set by a user through the HTTP API. On update, the service recomputes the delta and publishes it to the thing on its command subject (`things.<id>.commands.shadow`).
- **Reported state** is updated automatically as the thing publishes messages. The service consumes messages from the broker, flattens each into a state patch, and merges the patch into `reported` (no-op writes are skipped).
- On each reported-state change, any still-pending delta is re-published, so a reconnecting thing receives commands it missed while offline.

Authorization is delegated to the Things service: reading a shadow requires `viewer` access on the thing's group, while updating or removing a shadow requires `editor` access.

## Managing a shadow

```bash
# Set the desired state for a thing
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "desired": {"fanSpeed": 3, "targetTemp": 21}
  }' \
  https://localhost/svcshadows/things/<thing_id>/shadows
```

```json
{
  "thing_id": "111e4567-e89b-12d3-a456-426614174000",
  "state": {
    "desired": { "fanSpeed": 3, "targetTemp": 21 },
    "reported": { "fanSpeed": 1, "targetTemp": 19 },
    "delta": { "fanSpeed": 3, "targetTemp": 21 }
  },
  "reported_at": 1774342400,
  "updated_at": 1774342578
}
```

```bash
# View a thing's shadow
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcshadows/things/<thing_id>/shadows

# Remove a thing's shadow
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcshadows/things/<thing_id>/shadows
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
