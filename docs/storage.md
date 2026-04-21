# Storage

Mainflux uses PostgreSQL as its primary message store. TimescaleDB is available as an optional add-on for time-series workloads.

## Writers

Writers consume Mainflux messages, transform them to the desired format, and store them in the database.

For proper consumption of messages based on subtopics and their transformation, see [Subtopics](messaging.md#subtopics) and [Configure Profile Config](messaging.md#configure-profile-config) sections on the messaging page.

PostgreSQL and the PostgreSQL Writer are part of the core composition and start automatically with the platform.

TimescaleDB Writer is an optional add-on:

```bash
docker-compose -f docker/addons/timescale-writer/docker-compose.yml up -d
```

## Readers

Readers expose an HTTP API for querying messages persisted by writers. Each reader authenticates requests using the Thing key:

```
Authorization: Thing <thing_key>
```

### Endpoints

Each reader exposes the same API for both SenML and JSON formats:

| Method   | Path                   | Description                                |
|----------|------------------------|--------------------------------------------|
| `GET`    | `/senml`               | List SenML messages                        |
| `GET`    | `/senml/{publisherId}` | List SenML messages for a specific thing   |
| `POST`   | `/senml/search`        | Search SenML messages (request body)       |
| `GET`    | `/senml/export`        | Export SenML messages                      |
| `DELETE` | `/senml`               | Delete all SenML messages (admin)          |
| `DELETE` | `/senml/{publisherId}` | Delete SenML messages for a specific thing |
| `GET`    | `/json`                | List JSON messages                         |
| `GET`    | `/json/{publisherId}`  | List JSON messages for a specific thing    |
| `POST`   | `/json/search`         | Search JSON messages (request body)        |
| `GET`    | `/json/export`         | Export JSON messages                       |
| `DELETE` | `/json`                | Delete all JSON messages (admin)           |
| `DELETE` | `/json/{publisherId}`  | Delete JSON messages for a specific thing  |
| `GET`    | `/backup`              | Export full message backup (admin)         |
| `POST`   | `/restore`             | Restore messages from backup (admin)       |

### Query parameters

| Parameter    | Description                                     | Default |
|--------------|-------------------------------------------------|---------|
| `offset`     | Number of messages to skip                      | 0       |
| `limit`      | Maximum number of messages to return (max 1000) | 10      |
| `subtopic`   | Filter by subtopic                              |         |
| `publisher`  | Filter by publisher (thing ID)                  |         |
| `protocol`   | Filter by protocol                              |         |
| `from`       | Start of time range (nanoseconds)               |         |
| `to`         | End of time range (nanoseconds)                 |         |
| `dir`        | Sort direction                                  | `desc`  |

SenML-only parameters: `name`, `v`, `vb`, `vs`, `vd`, `comparator` (`eq`, `lt`, `le`, `gt`, `ge`).

JSON-only parameters: `filter` (dot-notation path to filter by payload field presence).

Export-only parameters:

| Parameter     | Description                         | Values        | Default              |
|---------------|-------------------------------------|---------------|----------------------|
| `convert`     | Output format                       | `json`, `csv` | `json`               |
| `time_format` | Timestamp format in exported output | `rfc3339`     | nanoseconds (int64)  |

### Aggregation

Time-based aggregation groups messages into time buckets and computes an aggregate value per bucket. Both `agg_type` and `agg_interval` must be provided together.

| Parameter      | Description                                         | Values                                                                                   |
|----------------|-----------------------------------------------------|------------------------------------------------------------------------------------------|
| `agg_type`     | Aggregation function                                | `min`, `max`, `avg`, `count`, `first`, `last`                                            |
| `agg_interval` | Time bucket unit                                    | `microsecond`, `millisecond`, `second`, `minute`, `hour`, `day`, `week`, `month`, `year` |
| `agg_value`    | Number of interval units per bucket (default: `1`)  | See per-interval limits below                                                            |
| `agg_field`    | Payload field(s) to aggregate (JSON only)           | dot-notation, comma-separated                                                            |

`agg_value` maximum per interval:

| Interval      | Max  |
|---------------|------|
| `microsecond` | 1000 |
| `millisecond` | 1000 |
| `second`      | 60   |
| `minute`      | 60   |
| `hour`        | 24   |
| `day`         | 7    |
| `week`        | 4    |
| `month`       | 12   |
| `year`        | 10   |

### List messages

```bash
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/senml?limit=5&offset=0"
```

**Response**

```json
{
  "total": 100,
  "offset": 0,
  "limit": 5,
  "messages": [
    {
      "publisher": "513d02d2-16c1-4f23-98be-9e12f8fee898",
      "protocol": "mqtt",
      "name": "voltage",
      "unit": "V",
      "value": 120.1,
      "time": 1715000000000000000
    }
  ]
}
```

### List messages for a specific thing

```bash
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/senml/<publisher_id>?limit=5"
```

### List messages with time range

```bash
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/senml?from=1715000000000000000&to=1715003600000000000&limit=100"
```

### List messages with aggregation

Average voltage per hour over the last day:

```bash
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/senml?agg_type=avg&agg_interval=hour&agg_value=1&from=1715000000000000000"
```

**Response**

```json
{
  "total": 24,
  "offset": 0,
  "limit": 10,
  "messages": [
    {
      "publisher": "513d02d2-16c1-4f23-98be-9e12f8fee898",
      "protocol": "mqtt",
      "name": "",
      "unit": "",
      "value": 119.8,
      "time": 1715000000000000000
    }
  ]
}
```

Max temperature per 5-second bucket from a JSON payload:

```bash
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/json?agg_type=max&agg_interval=second&agg_value=5&agg_field=temperature"
```

### Search messages

Search accepts the same filters as query parameters but via a JSON request body, supporting multiple concurrent queries:

```bash
curl -s -S -X POST \
  -H "Authorization: Thing <thing_key>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "publisher": "513d02d2-16c1-4f23-98be-9e12f8fee898",
      "name": "voltage",
      "from": 1715000000000000000,
      "limit": 100
    }
  ]' \
  "http://localhost/reader/senml/search"
```

### Export messages

Export returns all matching messages without pagination. Append `convert=csv` to download as CSV:

```bash
# JSON format
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/senml/export?publisher=<publisher_id>" \
  -o messages.json

# CSV format
curl -s -S -X GET \
  -H "Authorization: Thing <thing_key>" \
  "http://localhost/reader/senml/export?publisher=<publisher_id>&convert=csv" \
  -o messages.csv
```

### Delete messages

Delete messages for a specific thing (requires user token):

```bash
curl -s -S -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/reader/senml/<publisher_id>"
```

Delete all messages (requires admin token):

```bash
curl -s -S -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/reader/senml"
```

### Backup and restore

Backup exports the full message store as JSON (requires admin token):

```bash
curl -s -S -X GET \
  -H "Authorization: Bearer <admin_token>" \
  "http://localhost/reader/backup" \
  -o backup.json
```

Restore loads messages from a previously exported backup:

```bash
curl -s -S -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d @backup.json \
  "http://localhost/reader/restore"
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).

