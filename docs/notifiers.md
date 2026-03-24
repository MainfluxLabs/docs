# Notifiers

Notifiers service sends notifications when platform messages are received. The service consumes messages from the broker and dispatches them to the configured delivery backends. Two backends are supported:

- **SMTP** — sends email notifications to one or more addresses.
- **SMPP** — sends SMS notifications to one or more phone numbers via an SMPP gateway.

Notifiers are group-scoped records that carry a list of contact addresses (emails or phone numbers). Notifications are triggered by **rule actions** — when a rule fires, its actions reference a notifier by ID, and the service dispatches the notification to all addresses in that notifier's contact list.

## How notifications are triggered

Notifications are attached to rules. Each rule action specifies a type (`smtp` or `smpp`) and the ID of the notifier to use. When a message satisfies the rule's conditions, the platform publishes to the corresponding notifier subject and the service dispatches the notification.

See the [Rules](rules.md) documentation for details on creating rules with notification actions.

## Managing notifiers

Notifiers are group-scoped. Each notifier carries a name and a list of contact addresses. A single notifier can target multiple recipients simultaneously — all addresses in the list receive the notification when a matching message arrives.

```bash
# Create a notifier for a group
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ops team alerts",
    "contacts": ["ops@example.com", "oncall@example.com"]
  }' \
  https://localhost/svcsmtp/groups/<group_id>/notifiers
```

```json
{
  "id": "a9bf9e57-1685-4c89-bafb-ff5af830be8b",
  "name": "Ops team alerts",
  "contacts": ["ops@example.com", "oncall@example.com"],
  "group_id": "211e4567-e89b-12d3-a456-426614174000"
}
```

```bash
# List notifiers for a group
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcsmtp/groups/<group_id>/notifiers
```

```json
{
  "total": 1,
  "notifiers": [
    {
      "id": "a9bf9e57-1685-4c89-bafb-ff5af830be8b",
      "name": "Ops team alerts",
      "contacts": ["ops@example.com", "oncall@example.com"],
      "group_id": "211e4567-e89b-12d3-a456-426614174000"
    }
  ]
}
```

```bash
# View a specific notifier
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcsmtp/notifiers/<notifier_id>

# Update a notifier
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ops team alerts",
    "contacts": ["ops@example.com", "oncall@example.com", "manager@example.com"]
  }' \
  https://localhost/svcsmtp/notifiers/<notifier_id>

# Delete a notifier
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcsmtp/notifiers/<notifier_id>
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
