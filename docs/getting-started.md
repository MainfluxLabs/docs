# Getting Started

## Step 1 - Run the System
Before proceeding, install the following prerequisites:

- [Docker](https://docs.docker.com/install/) (v24 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.23 or later)

Clone the repository and start the platform:

```bash
git clone https://github.com/MainfluxLabs/mainflux
cd mainflux
make run
```

This will start Mainflux docker composition in detached mode.

## Step 2 - Install the CLI
Open a new terminal from which you can interact with the running Mainflux system. The easiest way to do this is by using the Mainflux CLI, which can be downloaded as a pre-built binary from the [latest release page](https://github.com/MainfluxLabs/mainflux/releases).

> Move the binary to a directory in your `$PATH` (e.g. `/usr/local/bin`) to make `mainfluxlabs-cli` accessible system-wide.

To build the CLI from source instead:

```bash
cd mainflux
make cli
```

The binary will be placed at `build/mainfluxlabs-cli`. See the [CLI](cli.md) page for more details.

## Step 3 - Provision the System

The entity hierarchy in Mainflux is **Org → Group → Profile → Thing**. Each resource must be created in this order, as each step requires the ID from the previous one.

User management requires an admin token. The default admin credentials are configured via `MF_USERS_ADMIN_EMAIL` and `MF_USERS_ADMIN_PASSWORD` in `docker/.env`.

**1. Get an admin token**

```bash
mainfluxlabs-cli users token admin@example.com 12345678
```

```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**2. Create a user**

```bash
mainfluxlabs-cli users create user@example.com password123 <admin_token>
```

**3. Get a user token**

```bash
mainfluxlabs-cli users token user@example.com password123
```

**4. Create an organization**

```bash
mainfluxlabs-cli orgs create '{"name":"my-org","description":"My organisation"}' <user_token>
```

The org ID is included in the response and also visible with:

```bash
mainfluxlabs-cli orgs get all <user_token>
```

**5. Create a group inside the org**

```bash
mainfluxlabs-cli groups create '{"name":"my-group"}' <org_id> <user_token>
```

**6. Create a profile inside the group**

A profile defines how messages from assigned things are handled. The `content_type` field controls the expected message format (`application/json`, `application/senml+json`, or `application/senml+cbor`).

```bash
mainfluxlabs-cli profiles create '{"name":"my-profile","config":{"content_type":"application/senml+json"}}' <group_id> <user_token>
```

```json
{
  "id": "b7bfc4b6-c18d-47c5-b343-98235c5acc19",
  "group_id": "737d2200-64a1-482f-839d-64906b0bd80e",
  "name": "my-profile",
  "config": {
    "content_type": "application/senml+json"
  }
}
```

**7. Create a thing and assign it to the profile**

The `type` field is required. Valid values are `device`, `sensor`, `actuator`, `controller`, and `gateway`. The `profile_id` is passed as a separate CLI argument, not inside the JSON.

```bash
mainfluxlabs-cli things create '{"name":"my-device","type":"device"}' <profile_id> <user_token>
```

```json
{
  "things": [{
    "id": "513d02d2-16c1-4f23-98be-9e12f8fee898",
    "group_id": "737d2200-64a1-482f-839d-64906b0bd80e",
    "profile_id": "b7bfc4b6-c18d-47c5-b343-98235c5acc19",
    "name": "my-device",
    "type": "device",
    "key": "69590b3a-9d76-4baa-adae-9b5fec0ea14f"
  }]
}
```

Note the `id` and `key` — these are the credentials the device uses to connect and publish.

## Step 4 - Send Messages

Once the system is provisioned, a thing can start sending messages. The `messages send` command requires a `key_type` argument — use `internal` for the platform-generated key returned when creating a thing.

```bash
mainfluxlabs-cli messages send \
  '[{"bn":"some-base-name:","bt":1.276020076001e+09,"bu":"A","bver":5,"n":"voltage","u":"V","v":120.1},{"n":"current","t":-5,"v":1.2},{"n":"current","t":-4,"v":1.3}]' \
  internal <thing_key>
```

To publish to a specific subtopic, pass it as the first argument:

```bash
mainfluxlabs-cli messages send temperature \
  '[{"n":"temp","v":25.3,"u":"Cel"}]' \
  internal <thing_key>
```

To verify messages were stored, read them back:

```bash
# Read SenML messages (as thing)
mainfluxlabs-cli messages read senml internal <thing_key> <user_token>

# Filter by subtopic
mainfluxlabs-cli messages read senml -s temperature internal <thing_key> <user_token>

# Read JSON messages
mainfluxlabs-cli messages read json internal <thing_key> <user_token>
```
