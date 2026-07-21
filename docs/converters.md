# Converters

Converters service provides bulk CSV and JSON ingestion by parsing uploaded files and publishing their records as platform messages. It is intended for batch import of historical or bulk-collected sensor data without requiring device-level publishing.

Four input formats are supported:

- **CSV → SenML** — the first row is the header where column names become measurement names. The first column must be a Unix timestamp. All remaining columns are treated as numeric measurement values.
- **CSV → JSON** — column names become JSON field names. The value from the column named by the thing's profile transformer `time_field` setting is parsed as a numeric Unix timestamp and stored as a `Created` field in the payload. The first column is excluded from the payload. Values are auto-parsed as numbers where possible, otherwise treated as strings.
- **JSON → SenML** — a JSON array of objects. Each object must have a `t` key (Unix timestamp) and one or more numeric measurement keys.
- **JSON → JSON** — a JSON array of objects. The key matching the thing's profile transformer `time_field` is stored as `Created`. All other fields are passed through as-is.

Large files are processed in batches with a 30-second pause between batches to avoid overloading the message broker. For SenML, a batch is flushed every 50,000 SenML records (one record per value column per row). For JSON, a batch is flushed every 50,000 rows.

## Authentication

Requests must be authenticated with the device's internal key using the `Authorization: Thing <key>` header.

## CSV file to SenML Messages

The first column must be a Unix timestamp. Subsequent columns are measurement names taken from the header row.

Example file (`readings.csv`):

```
time,voltage,current,power
1709635200,120.1,1.2,144.12
1709635260,119.8,1.3,155.74
```

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@readings.csv" \
  "https://localhost/converters/csv?to=senml"
```

Rows are collected and published as batched SenML messages. Each SenML record carries the measurement name (`n`), value (`v`), and timestamp (`t`) from its column and row.

## CSV file to JSON Messages

Column names become JSON field names. If the profile transformer `time_field` is set and matches a column name, that column's value is parsed as a numeric Unix timestamp (seconds or nanoseconds as a float) and stored as a `Created` field in the payload. The first column is always excluded from the payload. Values that cannot be parsed as numbers are kept as strings.

Example file (`events.csv`), assuming `time_field` is set to `time` in the profile transformer config:

```
time,temperature,humidity,status
1709635200,21.5,60,ok
1709635260,22.1,58,ok
```

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@events.csv" \
  "https://localhost/converters/csv?to=json"
```

Rows are collected and published as batched JSON messages. The `time` column value is parsed as a float and stored as `Created` in the payload. The remaining columns — `temperature`, `humidity`, and `status` — become fields in the JSON payload. The resulting record looks like:

```json
{"Created": 1709635200, "temperature": 21.5, "humidity": 60, "status": "ok"}
```

##  JSON file to SenML Messages

Each object in the array must contain a `t` key (Unix timestamp as a float) and one or more numeric measurement keys. Each measurement key produces one SenML record.

Example file (`readings.json`):

```json
[
  {"t": 1709635200.0, "voltage": 120.1, "current": 1.2},
  {"t": 1709635260.0, "voltage": 119.8, "current": 1.3}
]
```

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@readings.json" \
  "https://localhost/converters/json?to=senml"
```

Records are collected and published as batched SenML messages. Each SenML record carries the measurement name (`n`), value (`v`), and timestamp (`t`).

## JSON file to JSON Messages

Each object in the array becomes one JSON payload record. If the profile transformer `time_field` is set and matches a key, that key's value is stored as a `Created` field. All other keys are passed through with their original types.

Example file (`events.json`), assuming `time_field` is set to `time`:

```json
[
  {"time": 1709635200.0, "temperature": 21.5, "humidity": 60, "status": "ok"},
  {"time": 1709635260.0, "temperature": 22.1, "humidity": 58, "status": "ok"}
]
```

```bash
curl -s -S -i -X POST \
  -H "Authorization: Thing <thing_key>" \
  -F "file=@events.json" \
  "https://localhost/converters/json?to=json"
```

The `time` field value is stored as `Created` in the payload. The resulting record looks like:

```json
{"time": 1709635200, "Created": 1709635200, "temperature": 21.5, "humidity": 60, "status": "ok"}
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
