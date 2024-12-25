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

Readers provide an implementation of various `message readers`.
Message readers are services that consume normalized (in `SenML` format) Mainflux messages from data storage and opens HTTP API for message consumption.
Installing corresponding writer before reader is implied.

Each of the Reader services exposes the same [HTTP API](https://github.com/MainfluxLabs/mainflux/blob/master/api/readers.yml) for fetching messages on its default port.

To read sent messages you should send `GET` request to `/messages` with thing access token in `Authorization` header.

Response should look like this:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Date: Tue, 18 Sep 2018 18:56:19 GMT
Content-Length: 228

{
    "messages": [
        {
            "Publisher": 1,
            "Protocol": "mqtt",
            "Name": "name:voltage",
            "Unit": "V",
            "Value": 5.6,
            "Time": 48.56
        },
        {
            "Publisher": 1,
            "Protocol": "mqtt",
            "Name": "name:temperature",
            "Unit": "C",
            "Value": 24.3,
            "Time": 48.56
        }
    ]
}
```

Note that you will receive only those messages that were sent by authorization token's owner.
You can specify `offset` and `limit` parameters in order to fetch specific group of messages. An example of HTTP request looks like:

```bash
curl -s -S -i  -H "Authorization: Thing <thing_key>" http://localhost:<service_port>/messages?offset=0&limit=5&format=json
```

If you don't provide `offset` and `limit` parameters, default values will be used instead: 0 for `offset` and 10 for `limit`.
The `format` parameter indicates in which format the messages will be returned. 
The default format is `senml` if the format is not defined, and if the desired format is JSON, you need to specify `json` for the format.

### MongoDB Reader

To start MongoDB reader, execute the following command:

```bash
docker-compose -f docker/addons/mongodb-reader/docker-compose.yml up -d
```

### PostgreSQL Reader

To start PostgreSQL reader, execute the following command:

```bash
docker-compose -f docker/addons/postgres-reader/docker-compose.yml up -d
```

### Timescale Reader

To start Timescale reader, execute the following command:

```bash
docker-compose -f docker/addons/timescale-reader/docker-compose.yml up -d
```
