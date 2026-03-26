# Modbus

The Modbus service manages Modbus TCP polling clients for devices and groups. Each client connects to a Modbus TCP device on a configured schedule, reads the specified registers or coils, formats the result as a JSON payload, and publishes it as a platform message on behalf of the associated device.

On startup, the service loads all persisted clients and begins scheduling polls according to each client's frequency setting.

## How it works

1. You create a Modbus client linked to a device, specifying the target device address, slave ID, function code, poll schedule, and the data fields to read.
2. On each scheduled interval, the service connects to the Modbus TCP device, reads the configured registers or coils, and decodes the raw values according to the data field definitions.
3. The result is published to the platform as a JSON object keyed by field name, for example:

```json
{"temperature": 23.5, "humidity": 61, "status": true}
```

This message is then available to the rest of the platform — including storage, rules, and webhooks — just like any other device message.

## Function codes

| Function code            | Modbus FC | Description                          |
|--------------------------|:---------:|--------------------------------------|
| `ReadCoils`              | 01        | Read output coils (digital output)   |
| `ReadDiscreteInputs`     | 02        | Read discrete inputs (digital input) |
| `ReadHoldingRegisters`   | 03        | Read holding registers (analog R/W)  |
| `ReadInputRegisters`     | 04        | Read input registers (analog R/O)    |

## Poll schedule

The `scheduler` object controls when and how often the client polls the device.

| Field       | Description                                                                                        |
|-------------|---------------------------------------------------------------------------------------------------|
| `frequency` | Poll frequency: `once`, `minutely`, `hourly`, `daily`, or `weekly`                                 |
| `time_zone` | IANA timezone name (e.g. `Europe/Berlin`, `UTC`)                                                   |
| `date_time` | Date and time in `YYYY-MM-DD HH:MM` format. Required when `frequency` is `once`; ignored otherwise |
| `minute`    | Minute interval. Used with `minutely` frequency                                                    |
| `hour`      | Hour interval. Used with `hourly` frequency                                                        |
| `day_time`  | Time of day in `HH:MM` format. Used with `daily` frequency                                         |
| `week`      | Weekly schedule: `{"days": [...], "time": "HH:MM"}`. Used with `weekly` frequency                  |

## Data fields

Each entry in `data_fields` describes one register or coil to read and how to decode it.

| Field        | Description                                                                                            |
|--------------|--------------------------------------------------------------------------------------------------------|
| `name`       | Field name used as the JSON key in the published message                                               |
| `address`    | Starting register or coil address                                                                      |
| `type`       | Data type: `bool`, `int16`, `uint16`, `int32`, `uint32`, `float32`, or `string`                        |
| `byte_order` | Word order for multi-byte values: `ABCD` (big-endian), `DCBA` (little-endian), `CDAB`, or `BADC`       |
| `unit`       | Optional unit label (e.g. `°C`, `%`, `bar`)                                                            |
| `scale`      | Optional multiplier applied to the raw numeric value before publishing                                 |
| `length`     | Register count. Calculated automatically from `type` for numeric types; set manually for `string` only |

## Managing clients

Modbus clients are registered per device. Multiple clients can be registered for a single device.

### Create clients

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Boiler sensor",
      "ip_address": "192.168.1.100",
      "port": "502",
      "slave_id": 1,
      "function_code": "ReadHoldingRegisters",
      "scheduler": {"frequency": "minutely", "minute": 5},
      "data_fields": [
        {"name": "temperature", "address": 100, "type": "float32", "byte_order": "ABCD", "unit": "°C"},
        {"name": "pressure",    "address": 102, "type": "uint16",  "unit": "bar"}
      ]
    }
  ]' \
  https://localhost/svcmodbus/things/<thing_id>/clients
```

**Response**

```json
{
  "clients": [
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Boiler sensor",
    "ip_address": "192.168.1.100",
    "port": "502",
    "slave_id": 1,
    "function_code": "ReadHoldingRegisters",
    "scheduler": {"frequency": "minutely", "minute": 5},
    "data_fields": [
      {"name": "temperature", "address": 100, "type": "float32", "byte_order": "ABCD", "unit": "°C"},
      {"name": "pressure",    "address": 102, "type": "uint16",  "unit": "bar"}
    ],
    "thing_id": "111e4567-e89b-12d3-a456-426614174000",
    "group_id": "211e4567-e89b-12d3-a456-426614174000"
  }
  ]
}
```

### List clients

```bash
# All clients for a specific device
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcmodbus/things/<thing_id>/clients

# All clients for a group
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcmodbus/groups/<group_id>/clients
```

### View a client

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcmodbus/clients/<client_id>
```

### Update a client

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boiler sensor",
    "ip_address": "192.168.1.100",
    "port": "502",
    "slave_id": 1,
    "function_code": "ReadHoldingRegisters",
    "scheduler": {"frequency": "hourly", "hour": 1},
    "data_fields": [
      {"name": "temperature", "address": 100, "type": "float32", "unit": "°C"}
    ]
  }' \
  https://localhost/svcmodbus/clients/<client_id>
```

### Remove clients

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"client_ids": ["<client_id>"]}' \
  https://localhost/svcmodbus/clients
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
