# Authentication

## User authentication
For user authentication Mainflux uses Authentication keys.
There are three types of authentication keys:

- User key - keys issued to the user upon login request
- API key - keys issued upon the user request
- Recovery key - password recovery key

Authentication keys are represented and distributed by the corresponding [JWT](https://jwt.io/).
User keys are issued when user logs in. Each user request (other than registration and login) contains user key that is used to authenticate the user.

API keys are similar to the User keys. The main difference is that API keys have configurable expiration time. If no time is set, the key will never expire. API keys are the only key type that _can be revoked_. This also means that, despite being used as a JWT, it requires a query to the database to validate the API key. The user with API key can perform all the same actions as the user with login key (can act on behalf of the user for Thing, Channel, or user profile management), *except issuing new API keys*. 

Recovery key is the password recovery key. It's short-lived token used for password recovery process.

The following actions are supported:

- create (all key types)
- verify (all key types)
- obtain (API keys only; secret is never obtained)
- revoke (API keys only)

## Authentication with Mainflux keys
By default, Mainflux uses Mainflux Thing keys for authentication. The Thing key is a secret key that's generated at the Thing creation. In order to authenticate, the Thing needs to send its key with the message. The way the key is passed depends on the protocol used to send a message and differs from adapter to adapter. For more details on how this key is passed around, please check out [messaging section](https://mainflux.readthedocs.io/en/latest/messaging).
This is the default Mainflux authentication mechanism and this method is used if the composition is started using the following command:

```bash
docker-compose -f docker/docker-compose.yml up
```

## Mutual TLS Authentication with X.509 Certificates

In most of the cases, HTTPS, MQTTS or secure CoAP are secure enough. However, sometimes you might need an even more secure connection. Mainflux supports mutual TLS authentication (_mTLS_) based on [X.509 certificates](https://tools.ietf.org/html/rfc5280). By default, the TLS protocol only proves the identity of the server to the client using the X.509 certificate and the authentication of the client to the server is left to the application layer. TLS also offers client-to-server authentication using client-side X.509 authentication. This is called two-way or mutual authentication. Mainflux currently supports mTLS over HTTP, MQTT and MQTT over WS protocols. In order to run Docker composition with mTLS turned on, you can execute the following command from the project root:

```bash
AUTH=x509 docker-compose -f docker/docker-compose.yml up -d
```

Mutual authentication includes client-side certificates. Certificates can be generated using the simple script provided [here](http://www.github.com/MainfluxLabs/mainflux/tree/master/docker/ssl/Makefile). In order to create a valid certificate, you need to create Mainflux thing using the process described in the [provisioning section](/provision/#platform-management). After that, you need to fetch created thing key. Thing key will be used to create x.509 certificate for the corresponding thing. To create a certificate, execute the following commands:

```bash
cd docker/ssl
make ca CN=<common_name> O=<organization> OU=<organizational_unit> emailAddress=<email_address>
make server_cert CN=<common_name> O=<organization> OU=<organizational_unit> emailAddress=<email_address>
make thing_cert THING_KEY=<thing_key> CRT_FILE_NAME=<cert_name> O=<organization> OU=<organizational_unit> emailAddress=<email_address>
```

These commands use [OpenSSL](https://www.openssl.org/) tool, so please make sure that you have it installed and set up before running these commands. The default values for Makefile variables are

```
CRT_LOCATION = certs
THING_KEY = d7cc2964-a48b-4a6e-871a-08da28e7883d
O = Mainflux
OU = mainflux
EA = info@mainflux.com
CN = localhost
CRT_FILE_NAME = thing
```

Normally, in order to get things running, you will need to specify only `THING_KEY`. The other variables are not mandatory and the termination should work with the default values.

- Command `make ca` will generate a self-signed certificate that will later be used as a CA to sign other generated certificates. CA will expire in 3 years.
- Command `make server_cert` will generate and sign (with previously created CA) server cert, which will expire after 1000 days. This cert is used as a Mainflux server-side certificate in usual TLS flow to establish HTTPS or MQTTS connection.
- Command `make thing_cert` will finally generate and sign a client-side certificate and private key for the thing.

In this example `<thing_key>` represents key of the thing and `<cert_name>` represents the name of the certificate and key file which will be saved in `docker/ssl/certs` directory. Generated Certificate will expire after 2 years. The key must be stored in the x.509 certificate `CN` field.  This script is created for testing purposes and is not meant to be used in production. We strongly recommend avoiding self-signed certificates and using a certificate management tool such as [Vault](https://www.vaultproject.io/) for the production.

Once you have created CA and server-side cert, you can spin the composition using:

```bash
AUTH=x509 docker-compose -f docker/docker-compose.yml up -d
```

Then, you can create user and provision things and channels. Now, in order to send a message from the specific thing to the channel, you need to connect thing to the channel and generate corresponding client certificate using aforementioned commands. To publish a message to the channel, thing should send following request:

### HTTPS
```bash
curl -s -S -i --cacert docker/ssl/certs/ca.crt --cert docker/ssl/certs/<thing_cert_name>.crt --key docker/ssl/certs/<thing_cert_key>.key -X POST -H "Content-Type: application/senml+json" https://localhost/http/channels/<channel_id>/messages -d '[{"bn":"some-base-name:","bt":1.276020076001e+09, "bu":"A","bver":5, "n":"voltage","u":"V","v":120.1}, {"n":"current","t":-5,"v":1.2}, {"n":"current","t":-4,"v":1.3}]'
```

### MQTTS

#### Publish
```bash
mosquitto_pub -u <thing_id> -P <thing_key> -t channels/<channel_id>/messages -h localhost -p 8883  --cafile docker/ssl/certs/ca.crt --cert docker/ssl/certs/<thing_cert_name>.crt --key docker/ssl/certs/<thing_cert_key>.key -m '[{"bn":"some-base-name:","bt":1.276020076001e+09, "bu":"A","bver":5, "n":"voltage","u":"V","v":120.1}, {"n":"current","t":-5,"v":1.2}, {"n":"current","t":-4,"v":1.3}]'
```

#### Subscribe
```
mosquitto_sub -u <thing_id> -P <thing_key> --cafile docker/ssl/certs/ca.crt --cert docker/ssl/certs/<thing_cert_name>.crt --key docker/ssl/certs/<thing_cert_key>.key -t channels/<channel_id>/messages -h localhost -p 8883
```
