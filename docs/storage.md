# Storage

Mainflux supports various storage databases in which messages are stored:

- PostgreSQL
- TimescaleDB
- MongoDB

These storages are activated via docker-compose add-ons.

The `<project_root>/docker` folder contains an `addons` directory. This directory is used for various services that are not core to the Mainflux platform but could be used for providing additional features.

In order to run these services, core services, as well as the network from the core composition, should be already running.

## Writers

Writers provide an implementation of various `message writers`. Message writers are services that consume Mainflux messages, transform them to desired format and store them in certain data stores.

For proper consumption of messages based on subtopics and their transformation, see [Subtopics](messaging.md#subtopics) and [Configure Profile Config](messaging.md#configure-profile-config) sections on the messaging page.

### PostgreSQL and PostgreSQL Writer

```bash
docker-compose -f docker/addons/postgres-writer/docker-compose.yml up -d
```

Postgres default port (5432) is exposed, so you can use various tools for database inspection and data visualization.

### Timescale and Timescale Writer

```bash
docker-compose -f docker/addons/timescale-writer/docker-compose.yml up -d
```

Timescale default port (5432) is exposed, so you can use various tools for database inspection and data visualization.

### MongoDB and MongoDB Writer

```bash
docker-compose -f docker/addons/mongodb-writer/docker-compose.yml up -d
```

MongoDB default port (27017) is exposed, so you can use various tools for database inspection and data visualization.

## Readers

Readers provide an implementation of various `message readers`. Message readers are services that expose an HTTP API for querying messages persisted by the Writers. Installing the corresponding writer before the reader is implied.

Authentication is performed using the Thing key in the `Authorization` header:

```
Authorization: Thing <thing_key>
```

### Endpoints

Each Reader service exposes the same HTTP API. Two message formats are supported:

| Format | List | Search | Export                                    |
|--------|------|--------|--------|
| SenML  | `GET /senml` | `POST /senml/search` | `GET /senml/export` |
| JSON   | `GET /json`  | `POST /json/search`  | `GET /json/export`  |

To scope results to a specific publisher (thing ID):

- `GET /senml/{publisherId}`
- `GET /json/{publisherId}`

### Query Parameters

| Parameter    | Description                                     | Default |
|--------------|-------------------------------------------------|---------|
| `offset`     | Number of messages to skip                      | 0       |
| `limit`      | Maximum number of messages to return (max 1000) | 10      |
| `subtopic`   | Filter by subtopic                              |         |
| `publisher`  | Filter by publisher (thing ID)                  |         |
| `protocol`   | Filter by protocol                              |         |
| `from`       | Start of time range (Unix timestamp, seconds)   |         |
| `to`         | End of time range (Unix timestamp, seconds)     |         |

For SenML messages, additional parameters are available: `name`, `v`, `vb`, `vs`, `vd`, `comparator` (`eq`, `lt`, `le`, `gt`, `ge`), `aggregation` (`min`, `max`, `avg`, `count`), and `interval`.

Add `convert=csv` to any export request to download results as a CSV file.

### Example

```bash
curl -s -S -i -H "Authorization: Thing <thing_key>" \
  "http://localhost:<reader_port>/senml?offset=0&limit=5"
```

Response:

```json
{
  "total": 2,
  "offset": 0,
  "limit": 5,
  "messages": [
    {
      "publisher": "513d02d2-16c1-4f23-98be-9e12f8fee898",
      "protocol": "mqtt",
      "name": "voltage",
      "unit": "V",
      "value": 120.1,
      "time": 1.276020076e+09
    }
  ]
}
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).

### MongoDB Reader

To start MongoDB reader:

```bash
docker-compose -f docker/addons/mongodb-reader/docker-compose.yml up -d
```

### PostgreSQL Reader

To start PostgreSQL reader:

```bash
docker-compose -f docker/addons/postgres-reader/docker-compose.yml up -d
```

### Timescale Reader

To start Timescale reader:

```bash
docker-compose -f docker/addons/timescale-reader/docker-compose.yml up -d
```

