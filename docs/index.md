<img src="img/mainflux-logo.png" alt="Mainflux" width="96">

# Mainflux

Mainflux is an open-source IoT platform that connects devices, manages them across organizations, and turns their data into action.

Devices publish over HTTP, MQTT, WebSocket and CoAP, and receive commands over MQTT, WebSocket and CoAP. Where data cannot be pushed, Mainflux pulls it: it polls Modbus TCP equipment and external HTTP APIs on a schedule. Historical data arrives through CSV and JSON import, and files through the Filestore API.

Every incoming message can be stored for querying, evaluated by rules that raise alarms and send email or SMS notifications, and forwarded to external systems through webhooks.

## Features

### Connectivity

- [Messaging](messaging.md) — publish-subscribe messaging with subtopics, and commands to individual things or entire groups.
- [Modbus](modbus.md) — scheduled Modbus TCP polling that reads or writes registers and coils and publishes the values.
- [Downlinks](downlinks.md) — scheduled HTTP requests to external APIs, with each response published as a message of the thing.

### Security and Access Control

- [Certs](certs.md) — X.509 certificates for mTLS on HTTP, MQTT and WebSocket; CoAP uses DTLS with pre-shared keys.
- [Users](api.md#users) — user accounts with self-registration, platform invites and OAuth login.
- [Authentication](authentication.md) — JWT-based keys for all user-facing operations.
- [Authorization](authorization.md) — role-based access control at organization and group level.

### Device Management

- [Provisioning](api.md#things) — organizations, groups, profiles and things managed through the HTTP API.
- [Shadows](shadows.md) — reported and desired state of each thing, readable and settable while the thing is offline.
- [OTA](ota.md) — over-the-air firmware rollout to things, with per-thing progress reporting.

### Data

- [Storage](storage.md) — message persistence in TimescaleDB, with PostgreSQL as an optional add-on, and an HTTP API for querying stored messages.
- [Converters](converters.md) — bulk import of CSV and JSON files as platform messages.
- [Filestore](filestore.md) — file upload and storage for things and groups on the local filesystem or SeaweedFS.

### Processing and Notifications

- [Rules](rules.md) — threshold and Lua script conditions evaluated on incoming messages.
- [Alarms](alarms.md) — persisted alarms raised by rule actions.
- [Notifiers](notifiers.md) — email notifications over SMTP and SMS notifications over SMPP.

### Integration

- [Webhooks](webhooks.md) — real-time delivery of device messages to external systems as HTTP POST requests.
- [UIConfigs](uiconfigs.md) — JSON configuration objects for dashboards and frontends, scoped to organizations, groups and things.

### Operations

- [Audit](audit.md) — audit trail of events from all services, queryable through a read-only API.
- [Tracing](tracing.md) — distributed tracing of all services with Jaeger.
- [Backup and Restore](api.md#backup-and-restore) — export and restore of users, organizations, things and messages.

## Next Steps

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [API Reference](api.md)

Mainflux is licensed under [Apache-2.0](https://github.com/MainfluxLabs/mainflux/blob/master/LICENSE).
