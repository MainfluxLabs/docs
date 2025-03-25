# Messaging

Once a profile is provisioned and assigned to a thing, publishing messages can begin.
The following sections will provide an example of message publishing for each of the supported protocols.

### Configure Profile Config

For successful publishing of messages, when creating a profile, it is necessary to define configuration parameters within the structure `config`.
The `config` structure consists of the following fields: `content_type`, `write`, `webhook`, `transformer`, `smtp_id`.

A `content_type` field defines the payload format of messages in order to transform and store them properly.
Available formats are SenML, CBOR, and JSON and they can be defined correspondingly with values `application/senml+json`, `application/senml+cbor` and `application/json`.

A `write` field determines whether messages should be stored in the database. When `write` is set to `true`, messages will be saved in the database.
Conversely, if `write` is set to `false`, messages will be sent without storing them.

Here's an example of `SenML-JSON` metadata:
```json
{
  "config": {
    "content_type": "application/senml+json",
    "write": true,
    "webhook": false,
    "smtp_id": ""
  }
}
```

Here's an example of `SenML-CBOR` metadata:
```json
{
  "config": {
    "content_type": "application/senml+cbor",
    "write": true,
    "webhook": false,
    "smtp_id": ""
  }
}
```

The payload of the IoT message often contains message time. It can be in different formats (like base time and record time in the case of SenML) and the message field can be under the arbitrary key. Usually, we would want to map that time to the Mainflux Message field `created`, and for that reason, we need to configure the `transformer` to be able to read the field, parse it using proper format and location (if devices time is different from the service time), and map it to Mainflux Message.

When `content_type` is defined as `application/json`, inside the `transformer` structure it is possible to configure the field `time_field` which is the name of the JSON key to use as a timestamp, `time_format` to use for the field value and `time_location`.

Here's an example of `JSON` metadata:
```json
{
  "config": {
    "content_type": "application/json",
    "write": true,
    "webhook": false,
    "transformer": {
      "data_filters": ["val1", "val2"],
      "data_field":"field1",
      "time_field": "t",
      "time_format": "unix",
      "time_location": "UTC"
    },
    "smtp_id": ""
  }
}
```

In case it is necessary to extract the received payload and use a specific object within the payload, it is possible to define a value within the `data_field` field that will be used to extract the payload.

If we have a payload from which we want to get a list of "params", then the `config` should look like this:
```json
{
  "config": {
    "content_type": "application/json",
    "write": true,
    "transformer": {
      "data_filters": [],
      "data_field": "root.params",
      "time_field": "created",
      "time_format": "rfc3339",
      "time_location": "UTC"
    }
  }
}
``` 
Received payload with params:
```json
{
  "root": {
    "params": [
      {
        "field": "temperature",
        "value": 20,
        "created": "2024-12-24T17:15:55.000Z"
      },
      {
        "field": "humidity",
        "value": 45,
        "created": "2024-12-24T17:17:00.000Z"
      }
    ]
  }
}
```
The extraction result is:
```bash
[
      {
        "field": "temperature",
        "value": 20,
        "created": "2024-12-24T17:15:55.000Z"
      },
      {
        "field": "humidity",
        "value": 45,
        "created": "2024-12-24T17:17:00.000Z"
      }
]
```
Field `data_field` represents a string containing dot-separated values, unless only first-level extraction is used, then only the field name is enough (for example, "root"). Each of those words represents the level of the JSON payload to be extracted, which is important to specify them correctly for nested objects.

For the messages that contain _JSON array as the root element_, JSON Transformer does normalization of the data: it creates a separate JSON message for each JSON object in the root.

The `data_filters` field inside the `transformer` contains the values based on which the transformer filters incoming payload messages.
If there is certain data that you want to store, you can define it in the `data_filters` field.
For the previous example, we can filter the extracted payload and save only the fields under the key "field" and "value", then the updated config structure would look like this:
```json
{
  "config": {
    "content_type": "application/json",
    "write": true,
    "transformer": {
      "data_filters": ["field","value"],
      "data_field": "root.params",
      "time_field": "created",
      "time_format": "rfc3339",
      "time_location": "UTC"
    }
  }
}
```

If the `data_filters` and `data_field` fields are empty, the whole payload will be used.

The explanations for the `webhook` and `smtp_id` fields of the `config` can be found in the [Webhooks](#webhooks) and [Notifiers](#notifiers) sections.

---
### Notifiers

Notifiers service provides a service for sending notifications. It can be configured to send email notifications over SMTP (Simple Mail Transfer Protocol).

Notification can be enabled by setting the appropriate notifier ID to the `smtp_id` field within the Profile Config.

Here is an example with the value of the `smtp_id` field:
```json
{
  "config": {
    "content_type": "application/senml+json",
    "write": false,
    "webhook": false,
    "smtp_id": "a9bf9e57-1685-4c89-bafb-ff5af830be8b"
  }
}
```

**Note:** If `write` is set to `false`, notifications will be sent without storing the message in the database.

---
### Webhooks

Webhooks service provides forwarding received messages to other platforms.
Setting the value `true` or `false` in the `webhook` field within Profile Config determines whether messages will be forwarded.

Here is an example with the value of the `webhook` field:

```json
{
  "config": {
    "content_type": "application/json",
    "write": false,
    "webhook": true,
    "smtp_id": ""
  }
}
```
---
### Subtopics

In order to use subtopics and give more meaning about the content of messages published or received by subscription, you can simply add any suffix to base `/messages` topic.

Example subtopic publish/subscribe for bedroom temperature would be `/messages/bedroom/temperature`.

Subtopics are generic and multilevel. You can use almost any suffix with any depth.

Topics with subtopics are propagated to NATS broker in the following format `<format>.messages.<optional_subtopic>`.
The `format` prefix is included in the topic which is obtained from the `content_type` field specified in the `transformer` part of the `config` structure in the Profile.
The prefix value can be set to `json` or `senml`.

Our example topic `/messages/bedroom/temperature` with `content_type` defined as `application/senml+json` will be translated to appropriate NATS topic `senml.messages.bedroom.temperature`.

You can use multilevel subtopics, that have multiple parts. These parts are separated by `.` or `/` separators.
When you use combination of these two, have in mind that behind the scene, `/` separator will be replaced with `.`.
Every empty part of subtopic will be removed. What this means is that subtopic `a///b` is equivalent to `a/b`.
When you want to subscribe, you can use NATS wildcards `*` and `>`. Every subtopic part can have `*` or `>` as it's value, but if there is any other character beside these wildcards, subtopic will be invalid. What this means is that subtopics such as `a.b*c.d` will be invalid, while `a.b.*.c.d` will be valid.

**Note:** When using MQTT, it's recommended that you use standard MQTT wildcards `+` and `#`.

*For more information and examples checkout [official nats.io documentation](https://nats.io/documentation/writing_applications/subscribing/)*

## HTTP

To publish message, a thing with proper profile should send following request:

```
curl -s -S -i --cacert docker/ssl/certs/ca.crt -X POST -H "Authorization: Thing <thing_key>" -H "Content-Type: application/senml+json" https://localhost/http/messages -d '[{"bn":"some-base-name:","bt":1.276020076001e+09, "bu":"A","bver":5, "n":"voltage","u":"V","v":120.1}, {"n":"current","t":-5,"v":1.2}, {"n":"current","t":-4,"v":1.3}]'
```

**Note:** If you're going to use senml message format, you should always send messages as an array.

*For more information about the HTTP messaging service API, please check out the [API documentation](https://github.com/MainfluxLabs/mainflux/blob/master/api/openapi/http.yml).*

## MQTT

To send and receive messages over MQTT you could use [Mosquitto tools](https://mosquitto.org),
or [Paho](https://www.eclipse.org/paho/) if you want to use MQTT over WebSocket.

To publish message, thing should call following command:

```
mosquitto_pub -u <thing_id> -P <thing_key> -t /messages -h localhost -m '[{"bn":"some-base-name:","bt":1.276020076001e+09, "bu":"A","bver":5, "n":"voltage","u":"V","v":120.1}, {"n":"current","t":-5,"v":1.2}, {"n":"current","t":-4,"v":1.3}]'
```

To subscribe to a topic, thing should call following command:

```
mosquitto_sub -u <thing_id> -P <thing_key> -t /messages -h localhost
```

If you want to use standard topic such as `/messages` with SenML content type (JSON or CBOR), you should use following topic `/messages`.

If you are using TLS to secure MQTT connection, add `--cafile docker/ssl/certs/ca.crt`
to every command.

## CoAP

CoAP adapter implements CoAP protocol using underlying UDP and according to [RFC 7252](https://tools.ietf.org/html/rfc7252). To send and receive messages over CoAP, you can use [CoAP CLI](https://github.com/MainfluxLabs/coap-cli). To set the add-on, please follow the installation instructions provided [here](https://github.com/MainfluxLabs/coap-cli).

Examples:

```
coap-cli get /messages/subtopic -auth 1e1017e6-dee7-45b4-8a13-00e6afeb66eb -o
```
```
coap-cli post /messages/subtopic -auth 1e1017e6-dee7-45b4-8a13-00e6afeb66eb -d "hello world"
```
```
coap-cli post /messages/subtopic -auth 1e1017e6-dee7-45b4-8a13-00e6afeb66eb -d "hello world" -h 0.0.0.0 -p 1234
```
To send a message, use `POST` request.
To subscribe, send `GET` request with Observe option (flag `o`) set to false. There are two ways to unsubscribe:
1) Send `GET` request with Observe option set to true.
2) Forget the token and send `RST` message as a response to `CONF` message received by the server.

The most of the notifications received from the Adapter are non-confirmable. By [RFC 7641](https://tools.ietf.org/html/rfc7641#page-18):

> Server must send a notification in a confirmable message instead of a non-confirmable message at least every 24 hours. This prevents a client that went away or is no longer interested from remaining in the list of observers indefinitely.

CoAP Adapter sends these notifications every 12 hours. To configure this period, please check [adapter documentation](https://www.github.com/MainfluxLabs/mainflux/tree/master/coap/README.md) If the client is no longer interested in receiving notifications, the second scenario described above can be used to unsubscribe.

## WS
Mainflux supports [MQTT-over-WS](https://www.hivemq.com/blog/mqtt-essentials-special-mqtt-over-websockets/#:~:text=In%20MQTT%20over%20WebSockets%2C%20the,(WebSockets%20also%20leverage%20TCP).), rather than pure WS protocol. This brings numerous benefits for IoT applications that are derived from the properties of MQTT - like QoS and PUB/SUB features.

There are 2 recommended Javascript libraries for implementing browser support for Mainflux MQTT-over-WS connectivity:

1. [Eclipse Paho JavaScript Client](https://www.eclipse.org/paho/index.php?page=clients/js/index.php)
2. [MQTT.js](https://github.com/mqttjs/MQTT.js)

As WS is an extension of HTTP protocol, Mainflux exposes it on port `80`, so it's usage is practically transparent.
Additionally, please notice that since same port as for HTTP is used (`80`), and extension URL `/mqtt` should be used -
i.e. connection URL should be `ws://<host_addr>/mqtt`.

For quick testing you can use [HiveMQ UI tool](http://www.hivemq.com/demos/websocket-client/).

Here is an example of a browser application connecting to Mainflux server and sending and receiving messages over WebSocket using MQTT.js library:

```javascript
<script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
<script>
    // Initialize a mqtt variable globally
    console.log(mqtt)

    // connection option
    const options = {
        clean: true, // retain session
        connectTimeout: 4000, // Timeout period
        // Authentication information
        clientId: '14d6c682-fb5a-4d28-b670-ee565ab5866c',
        username: '14d6c682-fb5a-4d28-b670-ee565ab5866c',
        password: 'ec82f341-d4b5-4c77-ae05-34877a62428f',
    }
    
    var topic = '/messages'

    // Connect string, and specify the connection method by the protocol
    // ws Unencrypted WebSocket connection
    // wss Encrypted WebSocket connection
    const connectUrl = 'ws://localhost/mqtt'
    const client = mqtt.connect(connectUrl, options)

    client.on('reconnect', (error) => {
        console.log('reconnecting:', error)
    })

    client.on('error', (error) => {
        console.log('Connection failed:', error)
    })

    client.on('connect', function () {
        console.log('client connected:' + options.clientId)
        client.subscribe(topic, { qos: 0 })
        client.publish(topic, 'WS connection demo!', { qos: 0, retain: false })
    })

    client.on('message', function (topic, message, packet) {
        console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic)
    })

    client.on('close', function () {
        console.log(options.clientId + ' disconnected')
    })
</script>
```

**N.B.** Eclipse Paho lib adds sub-URL `/mqtt` automaticlly, so procedure for connecting to the server can be something like this:
```javascript
var loc = { hostname: 'localhost', port: 80 }
// Create a client instance
client = new Paho.MQTT.Client(loc.hostname, Number(loc.port), "clientId")
// Connect the client
client.connect({onSuccess:onConnect});
```
