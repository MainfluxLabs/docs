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
  profiles    Profiles management
  help        Help about any command
  messages    Send or read messages
  provision   Create things and profiles from a config file
  things      Things management
  groups      Groups management
  group_roles Group roles management
  orgs        Organizations management
  webhooks    Webhooks management
  users       Users management
  health      Mainflux Things service health check

Flags:
  -c, --content-type string    Mainflux message content type (default "application/senml+json")
  -h, --help                   help for mainflux-cli
  -a, --http-prefix string     Mainflux http adapter prefix (default "http")
  -i, --insecure               Do not check for TLS cert
  -l, --limit uint             limit query parameter (default 100)
  -m, --mainflux-url string    Mainflux host URL (default "http://localhost")
  -o, --offset uint            offset query parameter
  -t, --things-prefix string   Mainflux things service prefix
  -u, --users-prefix string    Mainflux users service prefix

Use "mainfluxlabs-cli [command] --help" for more information about a command.
```

It is also possible to use the docker image `mainflux/cli` to execute CLI command:

```bash
docker run -it --rm mainflux/cli -m http://<IP_SERVER> [command]
```

You can execute each command with `-h` flag for more information about that command, e.g.

```bash
mainflux-cli profiles -h
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
```bash
mainfluxlabs-cli provision things <file> <user_token>
```

* `file` - A CSV or JSON file containing things (must have extension `.csv` or `.json`)
* `user_token` - A valid user auth token for the current system

#### Provision Profiles
```bash
mainfluxlabs-cli provision profiles <file> <user_token>
```

* `file` - A CSV or JSON file containing profiles
* `user_token` - A valid user auth token for the current system


### Things
#### Create Thing
```bash
mainfluxlabs-cli things create '{"name":"<thing_name>","profile_id":"<profile_id>"}' <group_id> <user_token>
```

#### Create Thing with metadata
```bash
mainfluxlabs-cli things create '{"name":"<thing_name>","profile_id":"<profile_id>","metadata": {\"key1\":\"value1\"}}' <group_id> <user_token>
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
mainfluxlabs-cli things get all --offset=1 --limit=5 <user_token>
```

#### Retrieve Thing By ID
```bash
mainfluxlabs-cli things get <thing_id> <user_token>
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
mainfluxlabs-cli profiles get all --offset=1 --limit=5 <user_token>
```

#### Retrieve Profile By ID
```bash
mainfluxlabs-cli profiles get <profile_id> <user_token>
```

#### Retrieve a Profile by Thing
```bash
mainfluxlabs-cli profiles thing <thing_id> <user_token>
```

#### Retrieve a subset list of Things by Profile
```bash
mainfluxlabs-cli things profile <profile_id> <user_token>
```

### Messaging
#### Send a message over HTTP
```bash
mainfluxlabs-cli messages send '[{"bn":"Dev1","n":"temp","v":20}, {"n":"hum","v":40}, {"bn":"Dev2", "n":"temp","v":20}, {"n":"hum","v":40}]' <thing_auth_token>
```

#### Read messages over HTTP
```bash
mainfluxlabs-cli messages read <thing_auth_token>
```

### Groups
#### Create new Group
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

### Orgs
#### Create new Org
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

#### Assign User to an Org
```bash
mainfluxlabs-cli orgs assign '[{"member_id":"<member_id>","email":"<email>","role":"<role>"}]' <org_id> <user_token>
```

#### Unassign User from Org
```bash
mainfluxlabs-cli orgs unassign '["<member_id>"]' <org_id> <user_token>
```

#### Update Members
```bash
mainfluxlabs-cli orgs update-members '[{"member_id":"<member_id>","role":"<new_role>"}]' <org_id> <user_token>
```

#### List Users by Org
```bash
mainfluxlabs-cli orgs members <org_id> <user_token>
```

#### List Orgs that User belongs to
```bash
mainfluxlabs-cli orgs memberships <member_id> <user_token>
```

### Webhooks
#### Create new Webhooks
```bash
mainfluxlabs-cli webhooks create '[{"name":"<webhook_name>","url":"<http://webhook-url.com>","headers":{"key":"value",...}}]' <group_id> <user_token>
```

#### Get Webhook by ID
```bash
mainfluxlabs-cli webhooks get by-id <id> <user_token>
```

#### Get Webhooks by Group
```bash
mainfluxlabs-cli webhooks get group <group_id> <user_token>
```

#### Update Webhook
```bash
mainfluxlabs-cli webhooks update '{"name":"<new_name>","url":"<http://webhook-url.com>"}' <webhook_id> <user_token>
```

#### Delete Webhooks
```bash
mainfluxlabs-cli webhooks delete '["<webhook_id>"]' <group_id> <user_token>
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
