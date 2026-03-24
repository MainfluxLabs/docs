# Converters

Converters service provides bulk CSV ingestion by parsing uploaded CSV files and publishing their rows as platform messages. It is intended for batch import of historical or bulk-collected sensor data without requiring device-level publishing.

Two input formats are supported:

- **SenML** — the first row is the header where column names become measurement names. The first column must be a Unix timestamp. All remaining columns are treated as numeric measurement values.
- **JSON** — column names become JSON field names. The value from the column named by the thing's profile transformer `time_field` setting is parsed as a numeric Unix timestamp and stored as a `Created` field in the payload. The first column is excluded from the payload. Values are auto-parsed as numbers where possible, otherwise treated as strings.

Large files are processed in batches with a 30-second pause between batches to avoid overloading the message broker. For SenML, a batch is flushed every 50,000 SenML records (one record per value column per row). For JSON, a batch is flushed every 50,000 rows.

## Authentication

Requests must be authenticated with the device's internal key using the `Authorization: Thing <key>` header.

## SenML CSV

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
  https://localhost/converters/csv/senml
```

Rows are collected and published as batched SenML messages. Each SenML record carries the measurement name (`n`), value (`v`), and timestamp (`t`) from its column and row.

## JSON CSV

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
  https://localhost/converters/csv/json
```

Rows are collected and published as batched JSON messages. The `time` column value is parsed as a float and stored as `Created` in the payload. The remaining columns — `temperature`, `humidity`, and `status` — become fields in the JSON payload. The resulting record looks like:

```json
{"Created": 1709635200, "temperature": 21.5, "humidity": 60, "status": "ok"}
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
