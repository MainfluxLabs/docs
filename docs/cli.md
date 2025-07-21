# CLI

Mainflux CLI makes it easy to manage users, things, profiles, groups, orgs, webhooks and messages.

CLI can be downloaded as separate asset from [project realeses](https://github.com/MainfluxLabs/mainflux/releases) or it can be built with `GNU Make` tool:

Get the mainflux code

```bash
go get github.com/MainfluxLabs/mainflux
```

Build the mainfluxlabs-cli

```bash
make cli
```

which will build `mainfluxlabs-cli` in `<project_root>/build` folder.

Executing `build/mainfluxlabs-cli` without any arguments will output help with all available commands and flags:

```
Usage:
  mainfluxlabs-cli [command]

Available Commands:
  certs       Certificates management
  group_roles Group roles management
  groups      Groups management
  health      Health Check
  help        Help about any command
  keys        Keys management
  messages    Send or read messages
  orgs        Orgs management
  profiles    Profiles management
  provision   Provision things and profiles from a config file
  things      Things management
  users       Users management
  webhooks    Webhooks management

Flags:
  -a, --auth-url string       Auth service URL (default "http://localhost")
  -c, --certs-url string      Certs service URL (default "http://localhost")
  -y, --content-type string   Message content type (default "application/senml+json")
  -e, --email string          User email query parameter
  -f, --format string         Message format query parameter
  -h, --help                  help for mainfluxlabs-cli
  -p, --http-url string       HTTP adapter URL (default "http://localhost/http")
  -i, --insecure              Do not check for TLS cert
  -l, --limit uint            Limit query parameter (default 100)
  -m, --metadata string       Metadata query parameter
  -n, --name string           Name query parameter
  -o, --offset uint           Offset query parameter
  -r, --raw                   Enables raw output mode for easier parsing of output
  -s, --subtopic string       Subtopic query parameter
  -t, --things-url string     Things service URL (default "http://localhost")
  -u, --users-url string      Users service URL (default "http://localhost")
  -w, --webhooks-url string   Webhooks service URL (default "http://localhost/svcwebhooks")

Use "mainfluxlabs-cli [command] --help" for more information about a command.
```

It is also possible to use the docker image `mainflux/cli` to execute CLI command:

```bash
docker run -it --rm mainflux/cli -m http://<IP_SERVER> [command]
```

You can execute each command with `-h` flag for more information about that command, e.g.

```bash
mainfluxlabs-cli profiles -h
```

will get you usage info:

```
Profiles management: create, get, update or delete Profiles and get Profile by Thing

Usage:
  mainfluxlabs-cli profiles [flags]
  mainfluxlabs-cli profiles [command]

Available Commands:
  create      create <JSON_profile> <group_id> <user_token>
  delete      delete <profile_id> <user_token>
  get         get [all | thing | by-id] <user_token> <id>
  update      update <JSON_string> <profile_id> <user_token>

```

## Service
#### Get Mainflux Things services health check
```bash
mainfluxlabs-cli health
```

### Users management
#### Create User

Within Mainflux, the admin creates users.
The `<user_token>` is required because the token is used to verify that the requester is admin or not.
For more details, please see [Authorization page](authorization.md).

```bash
  mainfluxlabs-cli users create <user_email> <user_password> <user_token>
```

#### Login User
```bash
mainfluxlabs-cli users token <user_email> <user_password>
```

#### Retrieve User
```bash
mainfluxlabs-cli users get <user_token>
```

#### Update User Metadata
```bash
mainfluxlabs-cli users update '{"key1":"value1", "key2":"value2"}' <user_token>
```

#### Update User Password
```bash
mainfluxlabs-cli users password <old_password> <password> <user_token>
```

### System Provisioning

#### Provision Things

Provision multiple Things in bulk from a JSON / CSV input file.

```bash
mainfluxlabs-cli provision things <file> <user_token>
```

* `file` - A path to a CSV or JSON file containing Things (must have the `.json` or `.csv` extension)
* `user_token` - A valid user auth token for the current system

##### Input file structure (JSON):

The root of the JSON input file must be an array containing objects, each one representing a separate Thing,
each of which can have the following fields:

* `name`
* `id`
* `group_id`
* `profile_id`
* `metadata`

See [API -> Things](api.md#things) for the meaning and explanation of these fields.

Example:

```json
[
    {
        "group_id": "2c6aaa48-595b-495e-ad7f-c569a44d15e1",
        "profile_id": "30afa89c-decc-479c-8783-6b0c8813df0d",
        "name": "thing0",
        "metadata": {
            "locationCountry": "Poland",
            "locationCity": "Warsaw",
            "a": "1"
        }
    },
    {
        "group_id": "2c6aaa48-595b-495e-ad7f-c569a44d15e1",
        "profile_id": "efc59216-733d-41e7-af9a-e94a11ff39ee",
        "name": "thing1",
        "metadata": {
            "b": 2
        }
    },
  ...
]
```

##### Input file structure (CSV):

The mandatory columns of each CSV record are the following, in order:

* ID
* Name
* Group ID
* Profile ID

Any remaining columns are interpreted as metadata key-value pairs. The values are interpreted and stored as JSON strings. See example below.

Example:

```
,thing0,2c6aaa48-595b-495e-ad7f-c569a44d15e1,30afa89c-decc-479c-8783-6b0c8813df0d,locationCountry,Poland,locationCity,Warsaw,a,1
```

The above CSV record and the first object in the JSON example represent the same Thing.


#### Provision Profiles

Provision multiple Profiles in bulk from a JSON / CSV input file.

```bash
mainfluxlabs-cli provision profiles <file> <user_token>
```

* `file` - A path to a CSV or JSON file containing profiles (must have the `.json` or `.csv` extension)
* `user_token` - A valid user auth token for the current system

##### Input file structure (JSON):

The root of the JSON input file must be an array containing objects, each one representing a separate Profile,
each of which can have the following fields:

* `name`
* `id`
* `group_id`
* `config`
* `metadata`

See [API -> Profiles](api.md#profiles) for the meaning and explanation of these fields.

Example:

```json
[
    {
        "id": "473c97ca-ac23-4e0f-b679-c34bcde98491",
        "group_id": "2c6aaa48-595b-495e-ad7f-c569a44d15e1",
        "name": "profile0",
        "config": {
          "content_type": "application/json",
          "write": false,
          "transformer": {
            "data_filters": ["val1", "val2"],
            "data_field": "data.data.data",
            "time_field": "t",
            "time_format": "unix",
            "time_location": "UTC"
          },
        },
        "metadata": {
            "a": "1"
        }
    },
    {
        "id": "33da57ee-f072-4eef-a860-c3d2292e8c07",
        "group_id": "2c6aaa48-595b-495e-ad7f-c569a44d15e1",
        "name": "profile1",
        "config": {...},
        "metadata": {
            "b": 2
        }
    },
  ...
]
```

##### Input file structure (CSV):

The mandatory columns of each CSV record are the following, in order:

* ID
* Name
* Group ID
* Config - "content_type"
* Config - "write"
* Config - "transformer" - "data_filters"
* Config - "transformer" - "data_field"
* Config - "transformer" - "time_field"
* Config - "transformer" - "time_format"
* Config - "transformer" - "time_location"

Any remaining columns are interpreted as metadata key-value pairs. The values are interpreted and stored as JSON strings. See example below.

Example:

```
473c97ca-ac23-4e0f-b679-c34bcde98491,profile0,2c6aaa48-595b-495e-ad7f-c569a44d15e1,application/json,false,"val1,val2","data.data.data",t,unix,UTC,a,1
```

The above CSV record and the first object in the JSON example represent the same Profile.

### Things

#### Create Thing
```bash
mainfluxlabs-cli things create '{"name":"<thing_name>","profile_id":"<profile_id>"}' <user_token>
```

#### Create Thing with metadata
```bash
mainfluxlabs-cli things create '{"name":"<thing_name>","profile_id":"<profile_id>","metadata": {"key1":"value1"}}' <user_token>
```

#### Update Thing
```bash
mainfluxlabs-cli things update '{"name":"<new_name>","profile_id":"<profile_id>"}' <thing_id> <user_token>
```

#### Remove Thing
```bash
mainfluxlabs-cli things delete <thing_id> <user_token>
```

#### Retrieve a subset list of provisioned Things
```bash
mainfluxlabs-cli things get all <user_token>
```

#### Retrieve Thing by ID
```bash
mainfluxlabs-cli things get by-id <thing_id> <user_token>
```

#### Retrieve Things by Profile
```bash
mainfluxlabs-cli things get by-profile <profile_id> <user_token>
```

#### Retrieve Metadata by Key
```bash
mainfluxlabs-cli things metadata <thing_key>
```

#### Retrieve Thing ID by Key
```bash
mainfluxlabs-cli things identify <thing_key>
```

### Profiles
#### Create Profile
```bash
mainfluxlabs-cli profiles create '{"name":"<profile_name>"}' <group_id> <user_token>
```

#### Update Profile
```bash
mainfluxlabs-cli profiles update '{"name":"<new_name>"}' <profile_id> <user_token>
```

#### Remove Profile
```bash
mainfluxlabs-cli profiles delete <profile_id> <user_token>
```

#### Retrieve a subset list of provisioned Profiles
```bash
mainfluxlabs-cli profiles get all <user_token>
```

#### Retrieve Profile by ID
```bash
mainfluxlabs-cli profiles get by-id <profile_id> <user_token>
```

#### Retrieve a Profile by Thing
```bash
mainfluxlabs-cli profiles get by-thing <thing_id> <user_token>
```

### Messaging
#### Send a message over HTTP
```bash
mainfluxlabs-cli messages send [subtopic] '[{"bn":"Dev1","n":"temp","v":20}, {"n":"hum","v":40}, {"bn":"Dev2", "n":"temp","v":20}, {"n":"hum","v":40}]' <thing_key>
```

#### Read messages over HTTP
* Read messages from a specific subtopic by adding a flag `-s=<subtopic>`
* Reading SenML messages is the default. To read JSON messages add the flag `-f=json`
* Setting the `by-admin` flag allows the admin to list all messages of a certain format, from all publishers
* If `by-admin` is set, `auth_token` will be `admin_token`, otherwise `auth_token` is `thing_key`
```bash
mainfluxlabs-cli messages read [by-admin] <auth_token>
```

### Groups
#### Create Group
```bash
mainfluxlabs-cli groups create '{"name":"<group_name>","description":"<description>","metadata":{"key":"value",...}}' <org_id> <user_token>
```

#### Delete Group
```bash
mainfluxlabs-cli groups delete <group_id> <user_token>
```

#### Get Group by ID
```bash
mainfluxlabs-cli groups get <group_id> <user_token>
```

#### List all Groups
```bash
mainfluxlabs-cli groups get all <user_token>
```

#### List Groups by Org
```bash
mainfluxlabs-cli groups get by-org <org-id> <user_token>
```

#### Update Group
```bash
mainfluxlabs-cli groups update '{"name":"<new_name>"}' <group_id> <user_token>
```

#### List Things by Group
```bash
mainfluxlabs-cli groups things <group_id> <user_token>
```

#### View Group by Thing
```bash
mainfluxlabs-cli groups thing <thing_id> <user_token>
```

#### List Profiles by Group
```bash
mainfluxlabs-cli groups profiles <group_id> <user_token>
```

#### View Group by Profile
```bash
mainfluxlabs-cli groups profile <profile_id> <user_token>
```

### Group Memberships
#### Create Group Memberships
```bash
mainfluxlabs-cli group_memberships create '[{"member_id":"<member_id>","role":"<role>"}]' <group_id> <user_token>
```

#### Remove Group Memberships
```bash
mainfluxlabs-cli group_memberships delete '["<member_id>"]' <group_id> <user_token>
```

#### Update Group Memberships
```bash
mainfluxlabs-cli group_memberships update '[{"member_id":"<member_id>","role":"<new_role>"}]' <group_id> <user_token>
```

#### List Group Memberships
```bash
mainfluxlabs-cli group_memberships get <group_id> <user_token>
```

### Orgs
#### Create Org
```bash
mainfluxlabs-cli orgs create '{"name":"<org_name>","description":"<description>","metadata":{"key":"value",...}}' <user_token>
```

#### Get Org by ID
```bash
mainfluxlabs-cli orgs get <org_id> <user_token>
```

#### List all Orgs
```bash
mainfluxlabs-cli orgs get all <user_token>
```

#### Update Org
```bash
mainfluxlabs-cli orgs update '{"name":"<new_name>"}' <org_id> <user_token>
```

#### Delete Org
```bash
mainfluxlabs-cli orgs delete <org_id> <user_token>
```

### Org Memberships
#### Create Org Memberships
```bash
mainfluxlabs-cli org_memberships create '[{"email":"<email>","role":"<role>"}]' <org_id> <user_token>
```

#### Remove Org Memberships
```bash
mainfluxlabs-cli org_memberships delete '["<member_id>"]' <org_id> <user_token>
```

#### Get Org Membership(s)
```bash
mainfluxlabs-cli org_memberships get <all | member_id> <org_id> <user_token>
```

#### Update Org Memberships
```bash
mainfluxlabs-cli org_memberships update '[{"email":"<email>","role":"<new_role>"}]' <org_id> <user_token>
```

### Webhooks
#### Create Webhooks
```bash
mainfluxlabs-cli webhooks create '[{"name":"<webhook_name>","url":"<http://webhook-url.com>","headers":{"key":"value",...}}]' <thing_id> <user_token>
```

#### Get Webhook by ID
```bash
mainfluxlabs-cli webhooks get by-id <id> <user_token>
```

#### Get Webhooks by Group
```bash
mainfluxlabs-cli webhooks get by-group <group_id> <user_token>
```

#### Get Webhooks by Thing
```bash
mainfluxlabs-cli webhooks get by-thing <thing_id> <user_token>
```

#### Update Webhook
```bash
mainfluxlabs-cli webhooks update '{"name":"<new_name>","url":"<http://webhook-url.com>"}' <webhook_id> <user_token>
```

#### Delete Webhooks
```bash
mainfluxlabs-cli webhooks delete '["<webhook_id>"]' <user_token>
```

### Keys management
#### Issue a new Key
```bash
mainfluxlabs-cli keys issue <duration> <user_token>
```

#### Remove API key from database
```bash
mainfluxlabs-cli keys revoke <key_id> <user_token>
```

#### Retrieve API key with given id
```bash
mainfluxlabs-cli keys retrieve <key_id> <user_token>
```
