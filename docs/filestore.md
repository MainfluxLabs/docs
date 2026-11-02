# Filestore

The Filestore service provides file storage for things and groups. File contents are written to a pluggable object store — the local filesystem or a [SeaweedFS](https://github.com/seaweedfs/seaweedfs) filer — while file metadata is persisted to a database. Files can be scoped to an individual device (authenticated with a thing key) or to a group (authenticated with a user token: viewer-level group access to list and download files, editor-level to upload, update and delete them).

The backend is selected with `MF_FILESTORE_BACKEND` (`local` or `seaweedfs`). The default is `local`, both in the service itself and in the docker-compose deployment (`docker/.env`). Setting it to `seaweedfs` also enables the SeaweedFS master, volume, and filer containers through the matching docker-compose profile.

## File metadata

Every file stored in the platform carries the following metadata fields:

| Field      | Description                                                                                                          |
|------------|----------------------------------------------------------------------------------------------------------------------|
| `name`     | File name; serves as the unique identifier within the thing or group scope                                           |
| `class`    | Logical file class, derived from the extension (`images`, `documents`, `BIM`, `pointclouds`, `binaries`, `archives`) |
| `format`   | File format, derived from the extension (e.g. `csv`, `pdf`, `png`, `ifc`)                                            |
| `time`     | Unix timestamp (floating-point seconds) associated with the file                                                     |
| `metadata` | Optional arbitrary key-value pairs for custom attributes                                                             |
| `checksum` | SHA256 checksum of the file content, computed by the server on upload (read-only)                                    |
| `size`     | File size in bytes, recorded by the server on upload (read-only)                                                     |

`class` and `format` are **not** supplied by the client — they are derived from the uploaded file's extension. The supported extensions and the class each maps to are:

| Class         | Extensions                                                                                          |
|---------------|-----------------------------------------------------------------------------------------------------|
| `images`      | `jpg`, `jpeg`, `png`, `svg`                                                                         |
| `documents`   | `pdf`, `csv`, `txt`, `doc`, `docx`, `odt`, `odf`, `odp`, `ods`, `xls`, `xlsx`, `ppt`, `pptx`, `xps` |
| `BIM`         | `ifc`                                                                                               |
| `pointclouds` | `e57`                                                                                               |
| `binaries`    | `bin`, `hex`                                                                                        |
| `archives`    | `zip`                                                                                               |

On upload the first 512 bytes of the file are sniffed and checked against the class and format derived from its extension:

| Class / format                  | Required sniffed type                                            |
|---------------------------------|------------------------------------------------------------------|
| `images` (`jpg`, `jpeg`, `png`) | `image/*`                                                        |
| `images` (`svg`)                | `image/*` or `text/*` (SVG is XML, so it usually sniffs as text) |
| `documents` (`pdf`)             | `application/pdf`                                                |
| `documents` (`csv`, `txt`)      | `text/*`                                                         |
| `documents` (other formats)     | `application/*` or `text/*`                                      |
| `binaries` (`hex`)              | `text/*` (Intel HEX is a text encoding)                          |
| `binaries` (`bin`)              | any                                                              |
| `archives` (`zip`)              | `application/zip`                                                |
| `BIM`, `pointclouds`            | any                                                              |

A file whose extension is unsupported, or whose content does not match its class, is rejected with `415 Unsupported Media Type`.

## Scopes

| Scope       | Authentication                     | Description                                                                                                 |
|-------------|------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Thing files | `Authorization: Thing <thing_key>` | Files private to a specific device                                                                          |
| Group files | `Authorization: Bearer <token>`    | Files shared across a group; viewer access to list and download, editor access to upload, update and delete |

A device can also read its own group's files directly using its thing key, without requiring a user token.

## Checksums, downloads and range requests

The following applies to every file, in both the thing and group scopes.

Every upload computes a SHA256 checksum of the content and stores it with the file. Every download (`/files/<name>`, `/fs/groups/<group_id>/files/<name>` and `/fs/groupfiles/<name>`) returns the content as `application/octet-stream` with a `Content-Disposition: attachment; filename="<name>"` header (with an RFC 5987 `filename*` parameter for non-ASCII names). Full downloads stream from the backend and verify the stored checksum at end-of-stream. Because the body is streamed, the `200 OK` status and headers are sent before verification completes, so a mismatch (or backend read failure) cannot change the status code — the server logs the error and aborts the connection mid-transfer. Clients must therefore treat a truncated or aborted download as a failure rather than relying on the status code alone. A download whose object is missing entirely (index row present, object gone) returns `404`.

Downloads support single-range `Range` requests (RFC 9110), which lets constrained devices fetch large files such as firmware in chunks. The forms `bytes=<first>-<last>`, `bytes=<first>-`, and `bytes=-<suffix_length>` are accepted:

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  -H "Range: bytes=0-1023" \
  https://localhost/files/<name>
```

- A satisfiable range returns `206 Partial Content` with a `Content-Range: bytes <first>-<last>/<size>` header and a `Content-Length` of the returned slice.
- A range that lies outside the file returns `416 Range Not Satisfiable`.
- Range headers that are malformed or request multiple ranges are ignored, and the whole file is returned with `200 OK`. The same happens for files stored before sizes were recorded.
- Full responses for files with a known size include `Accept-Ranges: bytes` and `Content-Length`.
- Range responses are **not** checksum-verified, because the checksum covers the whole object. Verify the reassembled file yourself against the `checksum` from the file listing if you need integrity guarantees.

## Device-scoped files

A device authenticates using its thing key to upload and manage files scoped to itself.

### Upload a file

The file is sent as a multipart form. The `file` part is required; `metadata` (an arbitrary JSON object) and `time` (Unix seconds, defaults to the current time) are optional. `class` and `format` are derived from the filename extension — do not send them.

Uploads are limited to 1024 MB. A larger upload is rejected with `400 Bad Request`, either up front from its `Content-Length` or, for a chunked body without one, once the limit is exceeded mid-upload.

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

Supported query parameters: `offset`, `limit` (max 200, default 10), `order` (`time` or `name`, default `time`), `dir` (`asc` or `desc`, default `desc`), and the filters `name`, `format`, `class`, and `metadata` (a URL-encoded JSON object; only files whose metadata contains the given key-value pairs are returned, e.g. `?metadata={"sensor":"temperature"}`).

**Response**

```json
{
  "total": 2,
  "offset": 0,
  "limit": 10,
  "order": "time",
  "dir": "desc",
  "files_info": [
    {
      "name": "photo.png",
      "class": "images",
      "format": "png",
      "time": 1710000200.0,
      "metadata": {},
      "checksum": "<sha256>",
      "size": 20480
    },
    {
      "name": "sensor-data.csv",
      "class": "documents",
      "format": "csv",
      "time": 1710000000.0,
      "metadata": {"sensor": "temperature"},
      "checksum": "<sha256>",
      "size": 512
    }
  ]
}
```

### Download a file

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  https://localhost/files/<name>
```

The file content is returned as `application/octet-stream`. Range requests are supported, see [Checksums, downloads and range requests](#checksums-downloads-and-range-requests).

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

Group files are shared across all devices in a group. Users with viewer-level group access can list and download them; uploading, updating and deleting require editor-level access. Group-file routes are served under the `/fs/` prefix.

### Upload a group file

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -F "file=@config.csv" \
  -F 'metadata={"role":"shared-config"}' \
  https://localhost/fs/groups/<group_id>/files
```

A successful upload returns `201 Created` with an empty JSON body:

```json
{}
```

The same 1024 MB upload limit applies.

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

Group-file downloads behave like thing-file downloads, including the checksum verification and range support described in [Checksums, downloads and range requests](#checksums-downloads-and-range-requests).

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
