# OTA

The OTA service rolls out firmware to things over the air. A user creates an **update** for a set of things in a group, the service notifies those things, and each thing reports its progress until it runs the new firmware or fails. Firmware files are stored by the [Filestore](filestore.md) service as group files.

## Updates

An update describes the firmware and the things that should install it.

| Field         | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `id`          | Unique update identifier                                                           |
| `group_id`    | ID of the group of the things being updated                                        |
| `file_name`   | Name of the firmware group file in the Filestore service                           |
| `version`     | Version that things must report on success                                         |
| `file_size`   | Firmware size in bytes                                                             |
| `checksum`    | Hex-encoded SHA-256 of the firmware, used by the thing to verify the download      |
| `description` | Optional free-form description                                                     |
| `timeout`     | Seconds without progress after which a thing is marked `failed` (default 24 hours) |
| `created_at`  | Creation timestamp (RFC 3339)                                                      |
| `stats`       | Number of things of the update per status, and the total number of target things   |

Each thing of an update has its own progress: `status`, `error`, `reported_version` and `updated_at`.

| Status        | Meaning                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `pending`     | The thing has not started the update yet                                        |
| `downloading` | The thing is downloading the firmware                                           |
| `installing`  | The thing is installing the firmware                                            |
| `succeeded`   | The thing reported the version of the update                                    |
| `failed`      | The thing reported an error or another version, timed out, or was superseded    |

## How it works

1. **Create.** A user creates an update for things of a group. Every thing starts as `pending`. A thing runs at most one update at a time: its older running update is marked `failed` with `superseded by update <id>`.
2. **Notify.** The service publishes the update on the `things/<thing_id>/ota/update` MQTT topic of each thing. Only the OTA service can publish on that topic. Things that were offline fetch the update on reconnect with `GET /ota/pending`.
3. **Download.** The thing downloads the firmware from the `url` of the update with its thing key, resuming with HTTP Range requests if needed (see [Filestore](filestore.md#checksums-downloads-and-range-requests)), and verifies the SHA-256 checksum.
4. **Report.** The thing reports its progress with `POST /ota/status`, or by publishing on its `things/<thing_id>/ota/status` MQTT topic. A thing can report only its own status. Reports reach only the OTA service; they are not stored and do not trigger rules or webhooks. A `succeeded` report must include `version`; if it differs from the version of the update, the thing is marked `failed`.
5. **Timeout.** Things without progress for the `timeout` of the update are marked `failed` with `timed out`. The service checks this every `MF_OTA_TIMEOUT_CHECK_INTERVAL`.
6. **Retry.** A user can move the failed things of an update back to `pending`, and they are notified again. Things that received a newer update in the meantime are skipped, so a retry never rolls a thing back to older firmware. The service never retries on its own.

Viewing updates requires the viewer role in the group, while creating, retrying and removing updates require the editor role. Updates and progress are removed when their group or thing is removed.

## Managing updates

### Create an update

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "fw-sensor-1.4.0.bin",
    "version": "1.4.0",
    "file_size": 421888,
    "checksum": "<sha256_hex>",
    "description": "Sensor firmware 1.4.0",
    "thing_ids": ["111e4567-e89b-12d3-a456-426614174000"]
  }' \
  https://localhost/svcota/groups/<group_id>/updates
```

The response contains the created update with `201 Created`.

### List updates of a group

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcota/groups/<group_id>/updates?offset=0&limit=10"
```

```json
{
  "total": 1,
  "offset": 0,
  "limit": 10,
  "updates": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "group_id": "211e4567-e89b-12d3-a456-426614174000",
      "file_name": "fw-sensor-1.4.0.bin",
      "version": "1.4.0",
      "file_size": 421888,
      "checksum": "<sha256_hex>",
      "description": "Sensor firmware 1.4.0",
      "timeout": 86400,
      "created_at": "2026-11-04T12:00:00Z",
      "stats": {
        "targets": 1,
        "pending": 0,
        "downloading": 1,
        "installing": 0,
        "succeeded": 0,
        "failed": 0
      }
    }
  ]
}
```

### View an update

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcota/updates/<update_id>
```

### List the things of an update

The `status` query parameter filters the things by status.

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcota/updates/<update_id>/things?status=failed"
```

```json
{
  "total": 1,
  "offset": 0,
  "limit": 10,
  "status": "failed",
  "thing_updates": [
    {
      "thing_id": "111e4567-e89b-12d3-a456-426614174000",
      "status": "failed",
      "error": "timed out",
      "updated_at": "2026-11-05T12:00:00Z"
    }
  ]
}
```

### Retry failed things

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcota/updates/<update_id>/retry
```

### Remove an update

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcota/updates/<update_id>
```

Returns `204 No Content`.

## Device API

Things authenticate with their thing key.

### Fetch the pending update

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/ota/pending
```

When an update is pending, the response is:

```json
{
  "update_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "version": "1.4.0",
  "file_name": "fw-sensor-1.4.0.bin",
  "url": "https://localhost/fs/groupfiles/fw-sensor-1.4.0.bin",
  "size": 421888,
  "checksum": "<sha256_hex>"
}
```

When nothing is pending, the response is `204 No Content`. Over MQTT, the same object is delivered under the `payload` field of the standard command message.

### Report progress

`status` is one of `downloading`, `installing`, `succeeded` or `failed`. `version` is required with `succeeded`, and `error` describes a failure.

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -H "Content-Type: application/json" \
  -d '{"update_id": "c3d4e5f6-a7b8-9012-cdef-123456789012", "status": "succeeded", "version": "1.4.0"}' \
  https://localhost/ota/status
```

## Configuration

`MF_OTA_FIRMWARE_URL` sets the public base URL from which things download firmware group files (default `https://localhost/fs/groupfiles`), and `MF_OTA_TIMEOUT_CHECK_INTERVAL` sets how often things without progress are checked for timeout (default `10m`). See the [OTA service README](https://github.com/MainfluxLabs/mainflux/blob/master/ota/README.md) for the full list of environment variables.

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
