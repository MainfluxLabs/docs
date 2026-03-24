# Security

## Server Configuration

### Users

If either the cert or key is not set, the server will use insecure transport.

`MF_USERS_SERVER_CERT` the path to server certificate in pem format.

`MF_USERS_SERVER_KEY` the path to the server key in pem format.

### Things

If either the cert or key is not set, the server will use insecure transport.

`MF_THINGS_SERVER_CERT` the path to server certificate in pem format.

`MF_THINGS_SERVER_KEY` the path to the server key in pem format.

### Standalone mode

Sometimes it makes sense to run Things as a standalone service to reduce network traffic or simplify deployment. This means that Things service operates only using a single user and is able to authorize it without gRPC communication with Auth service. When running Things in the standalone mode, `Auth` and `Users` services can be omitted from the deployment.
To run service in a standalone mode, set `MF_THINGS_STANDALONE_EMAIL` and `MF_THINGS_STANDALONE_TOKEN`.

## Client Configuration

If you wish to secure the gRPC connection to `Things` and `Users` services you must define the CAs that you trust.  This does not support mutual certificate authentication.

### Adapter Configuration

`MF_HTTP_ADAPTER_CA_CERTS`, `MF_MQTT_ADAPTER_CA_CERTS`, `MF_WS_ADAPTER_CA_CERTS`, `MF_COAP_ADAPTER_CA_CERTS` - the path to a file that contains the CAs in PEM format. If not set, the default connection will be insecure. If it fails to read the file, the adapter will fail to start up.

### Things

`MF_THINGS_CA_CERTS` - the path to a file that contains the CAs in PEM format. If not set, the default connection will be insecure. If it fails to read the file, the service will fail to start up.

## Securing PostgreSQL Connections

By default, Mainflux will connect to Postgres using insecure transport.
If a secured connection is required, you can select the SSL mode and set paths to any extra certificates and keys needed.

`MF_USERS_DB_SSL_MODE` the SSL connection mode for Users.
`MF_USERS_DB_SSL_CERT` the path to the certificate file for Users.
`MF_USERS_DB_SSL_KEY` the path to the key file for Users.
`MF_USERS_DB_SSL_ROOT_CERT` the path to the root certificate file for Users.

`MF_THINGS_DB_SSL_MODE` the SSL connection mode for Things.
`MF_THINGS_DB_SSL_CERT` the path to the certificate file for Things.
`MF_THINGS_DB_SSL_KEY` the path to the key file for Things.
`MF_THINGS_DB_SSL_ROOT_CERT` the path to the root certificate file for Things.

Supported database connection modes are: `disable` (default), `require`, `verify-ca` and `verify-full`.

## Securing gRPC

By default, gRPC communication is not secure as Mainflux is most often run in a private network behind a reverse proxy.

TLS can be activated per service using the `_CLIENT_TLS` and `_CA_CERTS` environment variables. When `_CLIENT_TLS` is set to `true`, the service will require a valid CA certificate for the gRPC connection.

### Adapter → Things gRPC

Each adapter has its own pair of variables:

| Variable | Description                                                   |
|----------|-------------|
| `MF_HTTP_ADAPTER_CLIENT_TLS` | Enable TLS for HTTP adapter → Things gRPC |
| `MF_HTTP_ADAPTER_CA_CERTS` | Path to CA cert for HTTP adapter            |
| `MF_MQTT_ADAPTER_CLIENT_TLS` | Enable TLS for MQTT adapter → Things gRPC |
| `MF_MQTT_ADAPTER_CA_CERTS` | Path to CA cert for MQTT adapter            |
| `MF_WS_ADAPTER_CLIENT_TLS` | Enable TLS for WS adapter → Things gRPC     |
| `MF_WS_ADAPTER_CA_CERTS` | Path to CA cert for WS adapter                |
| `MF_COAP_ADAPTER_CLIENT_TLS` | Enable TLS for CoAP adapter → Things gRPC |
| `MF_COAP_ADAPTER_CA_CERTS` | Path to CA cert for CoAP adapter            |

### Other Services → Things gRPC

Services that communicate with Things over gRPC follow the same convention:

| Variable | Description                                                      |
|----------|-------------|
| `MF_THINGS_CA_CERTS` | Path to CA cert for outbound Things gRPC connections |

### Example

```bash
MF_HTTP_ADAPTER_CLIENT_TLS=true \
MF_HTTP_ADAPTER_CA_CERTS=/path/to/ca.crt \
$GOBIN/mainfluxlabs-http
```
