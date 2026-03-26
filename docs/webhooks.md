# Webhooks

Webhooks allow the platform to push device messages to external systems in real time. Whenever a device publishes a message, the platform delivers that message as an HTTP POST request to every webhook URL you have configured for that device. This enables seamless integration with third-party services, data pipelines, and custom applications without polling.

## How it works

1. A device publishes a message to the platform.
2. The Webhooks service looks up all webhooks registered for that device.
3. Each webhook receives an HTTP POST with the message payload as the request body.
4. Custom HTTP headers defined on the webhook are included in every request, allowing authentication with the receiving system.

No additional configuration is required on the device or its profile — forwarding is automatic as long as webhooks are registered.

## Managing webhooks

Webhooks are registered per device and scoped to the group that device belongs to. You can register multiple webhooks for a single device; each one will receive a copy of every message that device publishes.

### Create webhooks

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '[{
    "name": "Data pipeline",
    "url": "https://ingest.example.com/mainflux",
    "headers": {"X-Api-Key": "<api_key>"}
  }]' \
  https://localhost/svcwebhooks/things/<thing_id>/webhooks
```

**Response**

```json
[
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "name": "Data pipeline",
    "url": "https://ingest.example.com/mainflux",
    "headers": {"X-Api-Key": "<api_key>"},
    "group_id": "211e4567-e89b-12d3-a456-426614174000"
  }
]
```

### List webhooks

```bash
# All webhooks for a specific device
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcwebhooks/things/<thing_id>/webhooks

# All webhooks for a group
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcwebhooks/groups/<group_id>/webhooks
```

### View a webhook

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/webhooks/<webhook_id>
```

### Update a webhook

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data pipeline",
    "url": "https://ingest.example.com/mainflux-v2",
    "headers": {"X-Api-Key": "<api_key>"}
  }' \
  https://localhost/webhooks/<webhook_id>
```

### Remove webhooks

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"webhook_ids": ["<webhook_id>"]}' \
  https://localhost/webhooks
```

## Webhook fields

| Field     | Description                                                           |
|-----------|-----------------------------------------------------------------------|
| `id`      | Unique identifier assigned by the platform                            |
| `name`    | A label to help identify the webhook                                  |
| `url`     | The destination URL. Must be a valid HTTP or HTTPS address.           |
| `headers` | Optional HTTP headers sent with every request (e.g. API keys, tokens) |
| `metadata`| Optional key-value pairs for custom attributes                        |

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
