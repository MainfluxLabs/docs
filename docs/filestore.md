# Filestore

The Filestore service provides file storage for things and groups. File contents are written to a pluggable object store — the local filesystem or a [SeaweedFS](https://github.com/seaweedfs/seaweedfs) filer — while file metadata is persisted to a database. Files can be scoped to an individual device (authenticated with a thing key) or to a group (authenticated with a user token at editor level or above).

The backend is selected with `MF_FILESTORE_BACKEND` (`local` or `seaweedfs`). In the default docker-compose deployment the backend is `seaweedfs`, backed by SeaweedFS master, volume, and filer containers.

## File metadata

Every file stored in the platform carries the following metadata fields:

| Field      | Description                                                                          |
|------------|--------------------------------------------------------------------------------------|
| `name`     | File name; serves as the unique identifier within the thing or group scope           |
| `class`    | Logical file class, derived from the extension (`images`, `documents`, `BIM`, `pointclouds`, `binaries`) |
| `format`   | File format, derived from the extension (e.g. `csv`, `pdf`, `png`, `ifc`)            |
| `time`     | Unix timestamp (floating-point seconds) associated with the file                     |
| `metadata` | Optional arbitrary key-value pairs for custom attributes                             |

`class` and `format` are **not** supplied by the client — they are derived from the uploaded file's extension. The supported extensions and the class each maps to are:

| Class         | Extensions                                                                       |
|---------------|----------------------------------------------------------------------------------|
| `images`      | `jpg`, `jpeg`, `png`, `svg`                                                       |
| `documents`   | `pdf`, `csv`, `txt`, `doc`, `docx`, `odt`, `odf`, `odp`, `ods`, `xls`, `xlsx`, `ppt`, `pptx`, `xps` |
| `BIM`         | `ifc`                                                                            |
| `pointclouds` | `e57`                                                                            |
| `binaries`    | `bin`                                                                            |

On upload the first bytes of the file are sniffed and checked against the declared class: `images` must sniff as `image/*`, `documents` as `text/*` or `application/*` (`pdf` → `application/pdf`, `csv`/`txt` → `text/*`). `BIM`, `pointclouds`, and `binaries` accept arbitrary payloads. A file whose extension is unsupported, or whose content does not match its class, is rejected with `415 Unsupported Media Type`.

## Scopes

| Scope       | Authentication                     | Description                                              |
|-------------|------------------------------------|----------------------------------------------------------|
| Thing files | `Authorization: Thing <thing_key>` | Files private to a specific device                       |
| Group files | `Authorization: Bearer <token>`    | Files shared across a group; require editor-level access |

A device can also read its own group's files directly using its thing key, without requiring a user token.

Group-file uploads compute a SHA256 checksum on ingest and store it. Group-file downloads stream from the backend and verify the checksum at end-of-stream. Because the body is streamed, the `200 OK` status and headers are sent before verification completes, so a mismatch (or backend read failure) cannot change the status code — the server logs the error and aborts the connection mid-transfer. Clients must therefore treat a truncated or aborted download as a failure rather than relying on the status code alone. A download whose object is missing entirely (index row present, object gone) returns `404`.

## Device-scoped files

A device authenticates using its thing key to upload and manage files scoped to itself.

### Upload a file

The file is sent as a multipart form. The `file` part is required; `metadata` (an arbitrary JSON object) and `time` (Unix seconds, defaults to the current time) are optional. `class` and `format` are derived from the filename extension — do not send them.

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@sensor-data.csv" \
  -F 'metadata={"sensor":"temperature"}' \
  -F "time=1710000000.0" \
  https://localhost/files
```

A successful upload returns `201 Created` with an empty JSON body:

```json
{}
```

Uploading a file whose name already exists in the scope returns `409 Conflict`.

### List files

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files
```

Supported query parameters: `offset`, `limit` (max 200, default 10), `order` (`time` or `name`, default `time`), `dir` (`asc` or `desc`, default `desc`), and the filters `name`, `format`, and `class`.

**Response**

```json
{
  "total": 2,
  "offset": 0,
  "limit": 10,
  "order": "time",
  "dir": "desc",
  "files_info": [
    {"name": "photo.png",       "class": "images",    "format": "png", "time": 1710000200.0, "metadata": {}},
    {"name": "sensor-data.csv", "class": "documents", "format": "csv", "time": 1710000000.0, "metadata": {"sensor": "temperature"}}
  ]
}
```

### Download a file

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files/<name>
```

The file content is returned as `application/octet-stream`.

### Update file metadata

Metadata is updated with a JSON body (not a multipart form); this endpoint updates metadata only and does not replace file content. Fields omitted from the body are reset to their zero value, so include `time` if you want to preserve it.

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Thing <thing_key>" \
  -H "Content-Type: application/json" \
  -d '{"time":1710000000.0,"metadata":{"sensor":"temperature","unit":"celsius"}}' \
  https://localhost/files/<name>
```

### Delete a file

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files/<name>
```

Returns `204 No Content`.

## Group-scoped files

Users with editor-level group access can upload and manage files shared across all devices in a group. Group-file routes are served under the `/fs/` prefix.

### Upload a group file

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -F "file=@config.csv" \
  -F 'metadata={"role":"shared-config"}' \
  https://localhost/fs/groups/<group_id>/files
```

Returns `201 Created` with an empty JSON body.

### List group files

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/fs/groups/<group_id>/files
```

Accepts the same query parameters as the thing-scoped listing. The response has the same shape (`files_info`).

### Download a group file

```bash
# Using a user token
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/fs/groups/<group_id>/files/<name>

# Using a thing key (useful for devices fetching shared config or firmware),
# resolving the group from the thing key
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/fs/groupfiles/<name>
```

Group-file downloads set a `Content-Disposition: attachment; filename="<name>"` header (with an RFC 5987 `filename*` parameter for non-ASCII names) and verify the stored SHA256 checksum at end-of-stream.

### Update a group file

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"time":1710000000.0,"metadata":{"role":"shared-config","version":2}}' \
  https://localhost/fs/groups/<group_id>/files/<name>
```

### Delete a group file

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/fs/groups/<group_id>/files/<name>
```

Returns `204 No Content`.

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
