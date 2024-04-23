# Developer's guide

## Getting Mainflux

Mainflux source can be found in the official [Mainflux GitHub repository](https://github.com/MainfluxLabs/mainflux). You should fork this repository in order to make changes to the project. The forked version of the repository should be cloned using the following:

```bash
git clone <forked repository> $SOMEPATH/mainflux
cd $SOMEPATH/mainflux
```

**Note:** If your `$SOMEPATH` is equal to `$GOPATH/src/github.com/MainfluxLabs/mainflux`, make sure that your `$GOROOT` and `$GOPATH` do not overlap (otherwise, go modules won't work).

## Building

### Prerequisites

Make sure that you have [Protocol Buffers](https://developers.google.com/protocol-buffers/) (version 3.19.1) compiler (`protoc`) installed.

[Go Protobuf](https://github.com/golang/protobuf) installation instructions are [here](https://github.com/golang/protobuf#installation).
Go Protobuf uses C bindings, so you will need to install [C++ protobuf](https://github.com/google/protobuf) as a prerequisite.
Mainflux uses `Protocol Buffers for Go with Gadgets` to generate faster marshaling and unmarshaling Go code. Protocol Buffers for Go with Gadgets installation instructions can be found [here](https://github.com/gogo/protobuf).

A copy of [Go](https://golang.org/doc/install) (version 1.17.5) and docker template (version 3.7) will also need to be installed on your system.

If any of these versions seem outdated, the latest can always be found in our [CI script](https://github.com/MainfluxLabs/mainflux/blob/master/scripts/ci.sh).

### Build All Services

Use the *GNU Make* tool to build all Mainflux services:

```bash
make
```

Build artifacts will be put in the `build` directory.

> N.B. All Mainflux services are built as a statically linked binaries. This way they can be portable (transferred to any platform just by placing them there and running them) as they contain all needed libraries and do not relay on shared system libraries. This helps creating [FROM scratch](https://hub.docker.com/_/scratch/) dockers.

### Build Individual Microservice

Individual microservices can be built with:

```bash
make <microservice_name>
```

For example:

```bash
make http
```

will build the HTTP Adapter microservice.

### Building Dockers

Dockers can be built with:

```bash
make dockers
```

or individually with:

```bash
make docker_<microservice_name>
```

For example:

```bash
make docker_http
```

> N.B. Mainflux creates `FROM scratch` docker containers which are compact and small in size.

> N.B. The `things-db` and `users-db` containers are built from a vanilla PostgreSQL docker image downloaded from docker hub which does not persist the data when these containers are rebuilt. Thus, __rebuilding of all docker containers with `make dockers` or rebuilding the `things-db` and `users-db` containers separately with `make docker_things-db` and `make docker_users-db` respectively, will cause data loss. All your users, things, channels and connections between them will be lost!__ As we use this setup only for development, we don't guarantee any permanent data persistence. Though, in order to enable data retention, we have configured persistent volumes for each container that stores some data. If you want to update your Mainflux dockerized installation and want to keep your data, use `make cleandocker` to clean the containers and images and keep the data (stored in docker persistent volumes) and then `make run` to update the images and the containers. Check the [Cleaning up your dockerized Mainflux setup](#cleaning-up-your-dockerized-mainflux-setup) section for details. Please note that this kind of updating might not work if there are database changes.

#### Building Docker images for development

In order to speed up build process, you can use commands such as:

```bash
make dockers_dev
```

or individually with

```bash
make docker_dev_<microservice_name>
```

Commands `make dockers` and `make dockers_dev` are similar. The main difference is that building images in the development mode is done on the local machine, rather than an intermediate image, which makes building images much faster. Before running this command, corresponding binary needs to be built in order to make changes visible. This can be done using `make` or `make <service_name>` command. Commands `make dockers_dev` and `make docker_dev_<service_name>` should be used only for development to speed up the process of image building. **For deployment images, commands from section above should be used.**

### Suggested workflow

When the project is first cloned to your system, you will need to make sure and build all of the Mainflux services.

```bash
make
make dockers_dev
```

As you develop and test changes, only the services related to your changes will need to be rebuilt. This will reduce compile time and create a much more enjoyable development experience.

```bash
make <microservice_name>
make docker_dev_<microservice_name>
make run
```

### Overriding the default docker-compose configuration
Sometimes, depending on the use case and the user's needs it might be useful to override or add some extra parameters to the docker-compose configuration. These configuration changes can be done by specifying multiple compose files with the [docker-compose command line option -f](https://docs.docker.com/compose/reference/overview/) as described [here](https://docs.docker.com/compose/extends/).
The following format of the `docker-compose` command can be used to extend or override the configuration:
```
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.custom1.yml -f docker/docker-compose.custom2.yml up [-d]
```
In the command above each successive file overrides the previous parameters.

A practical example in our case would be to enable debugging and tracing in NATS so that we can see better how are the messages moving around.

`docker-compose.nats-debugging.yml`
```yaml
version: "3"

services:
  nats:
    command: --debug -DV
```

When we have the override files in place, to compose the whole infrastructure including the persistent volumes we can execute:
```
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.nats-debugging.yml up -d
```

__Note:__ Please store your customizations to some folder outside the Mainflux's source folder and maybe add them to some other git repository. You can always apply your customizations by pointing to the right file using `docker-compose -f ...`.


### Cleaning up your dockerized Mainflux setup
If you want to clean your whole dockerized Mainflux installation you can use the `make pv=true cleandocker` command. Please note that __by default the `make cleandocker` command will stop and delete all of the containers and images, but NOT DELETE persistent volumes__. If you want to delete the gathered data in the system (the persistent volumes) please use the following command `make pv=true cleandocker` (pv = persistent volumes). This form of the command will stop and delete the containers, the images and will also delete the persistent volumes.


### MQTT Microservice
The MQTT Microservice in Mainflux is special, as it is currently the only microservice written in NodeJS. It is not compiled, but node modules need to be downloaded in order to start the service:

```
cd mqtt
npm install
```

Note that there is a shorthand for doing these commands with `make` tool:

```
make mqtt
```

After that, the MQTT Adapter can be started from top directory (as it needs to find `*.proto` files) with:
```
node mqtt/mqtt.js
```

#### Troubleshooting
Depending on your use case, MQTT topics, message size, the number of clients and the frequency with which the messages are sent it can happen that you experience some problems.

Up until now it has been noticed that in case of high load, big messages and many clients it can happen that the MQTT microservice crashes with the following error:
```
mainflux-mqtt   | FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
mainflux-mqtt exited with code 137
```
This problem is caused the default allowed memory in node (V8). [V8 gives the user 1.7GB per default](https://medium.com/tomincode/increasing-nodes-memory-337dfb1a60dd). To fix the problem you should add the following environment variable `NODE_OPTIONS:--max-old-space-size=SPACE_IN_MB` in the [environment section](https://github.com/MainfluxLabs/mainflux/blob/master/docker/aedes.yml#L31) of the aedes.yml configuration. To find the right value for the `--max-old-space-size` parameter you'll have to experiment a bit depending on your needs.

The Mainflux MQTT service uses the [Aedes MQTT Broker](https://github.com/mcollina/aedes) for implementation of the MQTT related things. Therefore, for some questions or problems you can also check out the Aedes's documentation or reach out its contributors.

### Protobuf
If you've made any changes to `.proto` files, you should call `protoc` command prior to compiling individual microservices.

To do this by hand, execute:

```
protoc --gofast_out=plugins=grpc:. *.proto
protoc --gogo_out=plugins=grpc:. broker/*.proto
```

A shorthand to do this via `make` tool is:

```
make proto
```

> N.B. This must be done once at the beginning in order to generate protobuf Go structures needed for the build. However, if you don't change any of `.proto` files, this step is not mandatory, since all generated files are included in the repository (those are files with `.pb.go` extension).

### Cross-compiling for ARM
Mainflux can be compiled for ARM platform and run on Raspberry Pi or other similar IoT gateways, by following the instructions [here](https://dave.cheney.net/2015/08/22/cross-compilation-with-go-1-5) or [here](https://www.alexruf.net/golang/arm/raspberrypi/2016/01/16/cross-compile-with-go-1-5-for-raspberry-pi.html) as well as information
found [here](https://github.com/golang/go/wiki/GoArm). The environment variables `GOARCH=arm` and `GOARM=7` must be set for the compilation.

Cross-compilation for ARM with Mainflux make:

```
GOOS=linux GOARCH=arm GOARM=7 make
```

## Running tests
To run all of the tests you can execute:
```
make test
```
Dockertest is used for the tests, so to run them, you will need the Docker daemon/service running.

## Installing
Installing Go binaries is simple: just move them from `build` to `$GOBIN` (do not fortget to add `$GOBIN` to your `$PATH`).

You can execute:

```
make install
```

which will do this copying of the binaries.

> N.B. Only Go binaries will be installed this way. The MQTT adapter is a NodeJS script and will stay in the `mqtt` dir.

## Deployment

### Prerequisites
Mainflux depends on several infrastructural services, notably [NATS](https://www.nats.io/) broker and [PostgreSQL](https://www.postgresql.org/) database.

#### NATS
Mainflux uses NATS as it's central message bus. For development purposes (when not run via Docker), it expects that NATS is installed on the local system.

To do this execute:

```
go get github.com/nats-io/gnatsd
```

This will install `gnatsd` binary that can be simply run by executing:

```
gnatsd
```

#### PostgreSQL
Mainflux uses PostgreSQL to store metadata (`users`, `things` and `channels` entities alongside with authorization tokens).
It expects that PostgreSQL DB is installed, set up and running on the local system.

Information how to set-up (prepare) PostgreSQL database can be found [here](https://support.rackspace.com/how-to/postgresql-creating-and-dropping-roles/),
and it is done by executing following commands:

```
# Create `users` and `things` databases
sudo -u postgres createdb users
sudo -u postgres createdb things

# Set-up Postgres roles
sudo su - postgres
psql -U postgres
postgres=# CREATE ROLE mainflux WITH LOGIN ENCRYPTED PASSWORD 'mainflux';
postgres=# ALTER USER mainflux WITH LOGIN ENCRYPTED PASSWORD 'mainflux';
```

### Mainflux Services
Running of the Mainflux microservices can be tricky, as there is a lot of them and each demand configuration in the form of environment variables.

The whole system (set of microservices) can be run with one command:

```
make rundev
```

which will properly configure and run all microservices.

Please assure that MQTT microservice has `node_modules` installed, as explained in _MQTT Microservice_ chapter.

> N.B. `make rundev` actually calls helper script `scripts/run.sh`, so you can inspect this script for the details.

## Events
In order to be easily integratable system, Mainflux is using [Redis Streams](https://redis.io/topics/streams-intro)
as an event log for event sourcing. Services that are publishing events to Redis Streams
are `things` service and `mqtt` adapter.

### Things Service
For every operation that has side effects (that is changing service state) `things`
service will generate new event and publish it to Redis Stream called `mainflux.things`.
Every event has its own event ID that is automatically generated and `operation`
field that can have one of the following values:
- `thing.create` for thing creation,
- `thing.update` for thing update,
- `thing.remove` for thing removal,
- `thing.connect` for connecting a thing to a channel,
- `thing.disconnect` for disconnecting thing from a channel,
- `channel.create` for channel creation,
- `channel.update` for channel update,
- `channel.remove` for channel removal.

By fetching and processing these events you can reconstruct `things` service state.
If you store some of your custom data in `metadata` field, this is the perfect
way to fetch it and process it. If you want to integrate through
[docker-compose.yml](https://github.com/MainfluxLabs/mainflux/blob/master/docker/docker-compose.yml)
you can use `mainflux-es-redis` service. Just connect to it and consume events
from Redis Stream named `mainflux.things`.

#### Thing create event

Whenever thing is created, `things` service will generate new `create` event. This
event will have the following format:
```
1) "1555334740911-0"
2)  1) "operation"
    2) "thing.create"
    3) "name"
    4) "d0"
    5) "id"
    6) "3c36273a-94ea-4802-84d6-a51de140112e"
    7) "owner"
    8) "john.doe@email.com"
    9) "metadata"
   10) "{}"
```

As you can see from this example, every odd field represents field name while every
even field represents field value. This is standard event format for Redis Streams.
If you want to extract `metadata` field from this event, you'll have to read it as
string first and then you can deserialize it to some structured format.

#### Thing update event
Whenever thing instance is updated, `things` service will generate new `update` event.
This event will have the following format:
```
1) "1555336161544-0"
2) 1) "operation"
   2) "thing.update"
   3) "name"
   4) "weio"
   5) "id"
   6) "3c36273a-94ea-4802-84d6-a51de140112e"
```
Note that thing update event will contain only those fields that were updated using
update endpoint.

#### Thing remove event
Whenever thing instance is removed from the system, `things` service will generate and
publish new `remove` event. This event will have the following format:
```
1) 1) "1555339313003-0"
2) 1) "id"
   2) "3c36273a-94ea-4802-84d6-a51de140112e"
   3) "operation"
   4) "thing.remove"
```

#### Channel create event
Whenever channel instance is created, `things` service will generate and publish new
`create` event. This event will have the following format:
```
1) "1555334740918-0"
2) 1) "id"
   2) "16fb2748-8d3b-4783-b272-bb5f4ad4d661"
   3) "owner"
   4) "john.doe@email.com"
   5) "operation"
   6) "channel.create"
   7) "name"
   8) "c1"
```

#### Channel update event
Whenever channel instance is updated, `things` service will generate and publish new
`update` event. This event will have the following format:
```
1) "1555338870341-0"
2) 1) "name"
   2) "chan"
   3) "id"
   4) "d9d8f31b-f8d4-49c5-b943-6db10d8e2949"
   5) "operation"
   6) "channel.update"
```
Note that update channel event will contain only those fields that were updated using
update channel endpoint.

#### Channel remove event
Whenever channel instance is removed from the system, `things` service will generate and
publish new `remove` event. This event will have the following format:
```
1) 1) "1555339429661-0"
2) 1) "id"
   2) "d9d8f31b-f8d4-49c5-b943-6db10d8e2949"
   3) "operation"
   4) "channel.remove"
```

#### Connect thing to a channel event
Whenever thing is connected to a channel on `things` service, `things` service will
generate and publish new `connect` event. This event will have the following format:
```
1) "1555334740920-0"
2) 1) "chan_id"
   2) "d9d8f31b-f8d4-49c5-b943-6db10d8e2949"
   3) "thing_id"
   4) "3c36273a-94ea-4802-84d6-a51de140112e"
   5) "operation"
   6) "thing.connect"
```

#### Disconnect thing from a channel event
Whenever thing is disconnected from a channel on `things` service, `things` service
will generate and publish new `disconnect` event. This event will have the following
format:
```
1) "1555334740920-0"
2) 1) "chan_id"
   2) "d9d8f31b-f8d4-49c5-b943-6db10d8e2949"
   3) "thing_id"
   4) "3c36273a-94ea-4802-84d6-a51de140112e"
   5) "operation"
   6) "thing.disconnect"
```

**Note:** Every one of these events will omit fields that were not used or are not
relevant for specific operation. Also, field ordering is not guaranteed, so DO NOT
rely on it.


### MQTT Adapter
Instead of using heartbeat to know when client is connected through MQTT adapter one
can fetch events from Redis Streams that MQTT adapter publishes. MQTT adapter
publishes events every time client connects and disconnects to stream named `mainflux.mqtt`.

Events that are coming from MQTT adapter have following fields:
- `thing_id` ID of a thing that has connected to MQTT adapter,
- `timestamp` is in Epoch UNIX Time Stamp format,
- `event_type` can have two possible values, connect and disconnect,
- `instance` represents MQTT adapter instance.

If you want to integrate through
[docker-compose.yml](https://github.com/MainfluxLabs/mainflux/blob/master/docker/docker-compose.yml)
you can use `mainflux-es-redis` service. Just connect to it and consume events
from Redis Stream named `mainflux.mqtt`.

Example of connect event:
```
1) 1) "1555351214144-0"
2) 1) "thing_id"
   2) "1c597a85-b68e-42ff-8ed8-a3a761884bc4"
   3) "timestamp"
   4) "1555351214"
   5) "event_type"
   6) "connect"
   7) "instance"
   8) "mqtt-adapter-1"
```

Example of disconnect event:
```
1) 1) "1555351214188-0"
2) 1) "thing_id"
   2) "1c597a85-b68e-42ff-8ed8-a3a761884bc4"
   3) "timestamp"
   4) "1555351214"
   5) "event_type"
   6) "disconnect"
   7) "instance"
   8) "mqtt-adapter-1"
```
