# Filestore

The Filestore service provides file storage for things and groups. File contents are written to the local filesystem, while file metadata is persisted to a database. Files can be scoped to an individual device (authenticated with a thing key) or to a group (authenticated with a user token at editor level or above).

## File metadata

Every file stored in the platform carries the following metadata fields:

| Field      | Description                                                                  |
|------------|------------------------------------------------------------------------------|
| `name`     | File name; serves as the unique identifier within the thing or group scope   |
| `class`    | Logical file class (e.g. `image`, `document`, `bim`, `pointcloud`, `binary`) |
| `format`   | File format (e.g. `csv`, `pdf`, `png`, `ifc`, `json`)                        |
| `time`     | Unix timestamp (floating-point seconds) associated with the file             |
| `metadata` | Optional key-value pairs for custom attributes                               |

## Scopes

| Scope       | Authentication                     | Description                                              |
|-------------|------------------------------------|----------------------------------------------------------|
| Thing files | `Authorization: Thing <thing_key>` | Files private to a specific device                       |
| Group files | `Authorization: Bearer <token>`    | Files shared across a group; require editor-level access |

A device can also read its own group's files directly using its thing key, without requiring a user token.

## Device-scoped files

A device authenticates using its thing key to upload and manage files scoped to itself.

### Upload a file

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@sensor-data.csv" \
  -F 'metadata={"class":"document","format":"csv","time":1710000000.0}' \
  https://localhost/files
```

**Response**

```json
{
  "name": "sensor-data.csv",
  "class": "document",
  "format": "csv",
  "time": 1710000000.0
}
```

### List files

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files
```

**Response**

```json
{
  "total": 2,
  "files": [
    {"name": "sensor-data.csv",   "class": "document", "format": "csv",  "time": 1710000000.0},
    {"name": "calibration.json",  "class": "document", "format": "json", "time": 1709900000.0}
  ]
}
```

### Download a file

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files/<name>
```

### Update a file

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@sensor-data-v2.csv" \
  https://localhost/files/<name>
```

### Delete a file

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files/<name>
```

## Group-scoped files

Users with editor-level group access can upload and manage files shared across all devices in a group.

### Upload a group file

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -F "file=@config.json" \
  -F 'metadata={"class":"document","format":"json","time":1710000000.0}' \
  https://localhost/fs/groups/<group_id>/files
```

### List group files

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/fs/groups/<group_id>/files
```

### Download a group file

```bash
# Using a user token
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/fs/groups/<group_id>/files/<name>

# Using a thing key (useful for devices fetching shared config or firmware)
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/fs/groupfiles/<name>
```

### Update a group file

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -F "file=@config-v2.json" \
  https://localhost/fs/groups/<group_id>/files/<name>
```

### Delete a group file

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/fs/groups/<group_id>/files/<name>
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
