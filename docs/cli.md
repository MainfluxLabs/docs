# CLI

Mainflux CLI makes it easy to manage users, things, channels, groups, orgs, webhooks and messages.

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
  channels    Channels management
  help        Help about any command
  messages    Send or read messages
  provision   Create things and channels from a config file
  things      Things management
  channels    Channels management
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
mainflux-cli channels -h
```

will get you usage info:

```
Channels management: create, get, update or delete Channels and get list of Things connected to Channels

Usage:
  mainfluxlabs-cli channels [flags]
  mainfluxlabs-cli channels [command]

Available Commands:
  connections connections <channel_id> <user_token>
  create      create <JSON_channel> <user_token>
  delete      delete <channel_id> <user_token>
  get         get <channel_id | all> <user_token>
  update      update <JSON_string> <user_token>

```

## Service
#### Get Mainflux Things services health check
```bash
mainfluxlabs-cli health
```

### Users management
#### Create User

Mainflux has two options for user creation. Either everybody or just the admin is able to create new users. This option is dictated through policies and be configured through environment variable (`MF_USERS_ALLOW_SELF_REGISTER`). If only the admin is allowed to create new users, then the `<user_token>` is required because the token is used to verify that the requester is admin or not. Otherwise, the token is not used, since everybody can create new users. However, the token is still required, in order to be consistent. For more details, please see [Authorization page](authorization.md).

```bash
if env `MF_USERS_ALLOW_SELF_REGISTER` is "true" then
  mainfluxlabs-cli users create <user_email> <user_password>
else
  mainfluxlabs-cli users create <user_email> <user_password> <admin_token>
```

`MF_USERS_ALLOW_SELF_REGISTER` is `true` by default. Therefore, you do not need to provide `<admin_token>` if `MF_USERS_ALLOW_SELF_REGISTER` is true. On the other hand, if you set `MF_USERS_ALLOW_SELF_REGISTER` to `false`, the Admin token is required for authorization. Therefore, you have to provide the admin token through third argument stated as `<admin_token>`.

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
#### Create Thing
```bash
mainfluxlabs-cli things create '{"name":"myThing"}' <group_id> <user_token>
```

#### Create Thing with metadata
```bash
mainfluxlabs-cli things create '{"name":"myThing", "metadata": {\"key1\":\"value1\"}}' <group_id> <user_token>
```

#### Provision Things
```bash
mainfluxlabs-cli provision things <file> <user_token>
```

* `file` - A CSV or JSON file containing things (must have extension `.csv` or `.json`)
* `user_token` - A valid user auth token for the current system

#### Update Thing
```bash
mainfluxlabs-cli things update '{"id":"<thing_id>", "name":"myNewName"}' <user_token>
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

#### Create Channel
```bash
mainfluxlabs-cli channels create '{"name":"myChannel"}' <group_id> <user_token>
```

#### Provision Channels
```bash
mainfluxlabs-cli provision channels <file> <user_token>
```

* `file` - A CSV or JSON file containing channels (must have extension `.csv` or `.json`)
* `user_token` - A valid user auth token for the current system

#### Update Channel
```bash
mainfluxlabs-cli channels update '{"id":"<channel_id>","name":"myNewName"}' <user_token>
```

#### Remove Channel
```bash
mainfluxlabs-cli channels delete <channel_id> <user_token>
```

#### Retrieve a subset list of provisioned Channels
```bash
mainfluxlabs-cli channels get all --offset=1 --limit=5 <user_token>
```

#### Retrieve Channel By ID
```bash
mainfluxlabs-cli channels get <channel_id> <user_token>
```

### Access control
#### Connect Thing to Channel
```bash
mainfluxlabs-cli things connect <thing_id> <channel_id> <user_token>
```

#### Bulk Connect Things to Channels
```bash
mainfluxlabs-cli provision connect <file> <user_token>
```

* `file` - A CSV or JSON file containing thing and channel ids (must have extension `.csv` or `.json`)
* `user_token` - A valid user auth token for the current system

An example CSV file might be

```csv
<thing_id>,<channel_id>
<thing_id>,<channel_id>
```

in which the first column is thing IDs and the second column is channel IDs. A connection will be created for each thing to each channel. This example would result in 4 connections being created.

A comparable JSON file would be

```json
{
    "thing_ids": [
        "<thing_id>",
        "<thing_id>"
    ],
    "channel_ids": [
        "<channel_id>",
        "<channel_id>"
    ]
}
```

#### Disconnect Thing from Channel
```bash
mainfluxlabs-cli things disconnect <thing_id> <channel_id> <user_token>

```

#### Retrieve a Channel by Thing
```bash
mainfluxlabs-cli things connections <thing_id> <user_token>
```

#### Retrieve a subset list of Things connected to Channel
```bash
mainfluxlabs-cli channels connections <channel_id> <user_token>
```

### Messaging
#### Send a message over HTTP
```bash
mainfluxlabs-cli messages send <channel_id> '[{"bn":"Dev1","n":"temp","v":20}, {"n":"hum","v":40}, {"bn":"Dev2", "n":"temp","v":20}, {"n":"hum","v":40}]' <thing_auth_token>
```

#### Read messages over HTTP
```bash
mainfluxlabs-cli messages read <channel_id> <thing_auth_token>
```

### Groups
#### Create new group
```bash
mainfluxlabs-cli groups create '{"name":"<group_name>","description":"<description>","metadata":{"key":"value",...}}' <org_id> <user_token>
```

#### Delete group
```bash
mainfluxlabs-cli groups delete <group_id> <user_token>
```

#### Get group by id
```bash
mainfluxlabs-cli groups get <group_id> <user_token>
```

#### List all groups
```bash
mainfluxlabs-cli groups get all <user_token>
```

#### Update group
```bash
mainfluxlabs-cli groups update '{"id":"<group_id>","name":"newName"}' <user_token>
```

#### List things by group
```bash
mainfluxlabs-cli groups things <group_id> <user_token>
```

#### View group by thing
```bash
mainfluxlabs-cli groups thing <thing_id> <user_token>
```

#### List channels by group
```bash
mainfluxlabs-cli groups channels <group_id> <user_token>
```

#### View group by channel
```bash
mainfluxlabs-cli groups thing <channel_id> <user_token>
```

### Orgs
#### Create new org
```bash
mainfluxlabs-cli orgs create '{"name":"<org_name>","description":"<description>","metadata":{"key":"value",...}}' <user_token>
```

#### Get org by id
```bash
mainfluxlabs-cli orgs get <org_id> <user_token>
```

#### List all orgs
```bash
mainfluxlabs-cli orgs get all <user_token>
```

#### Update org
```bash
mainfluxlabs-cli orgs update-org '{"id":"<org_id>","name":"new_name"}' <user_token>
```

#### Delete org
```bash
mainfluxlabs-cli orgs delete <org_id> <user_token>
```

#### Assign user to an org
```bash
mainfluxlabs-cli orgs assign '{"members": ["member_id":"<member_id>","email":"<email>","role":"<role>"]}' <org_id> <user_token>
```

#### Unassign user from org
```bash
mainfluxlabs-cli orgs unassign '{"member_ids":["<member_id>"]}' <org_id> <user_token>
```

#### Update member
```bash
mainfluxlabs-cli orgs update-member '{"member_id":"<member_id>","role":"<new_role>"}' <org_id> <user_token>
```

#### List users by org
```bash
mainfluxlabs-cli orgs members <org_id> <user_token>
```

#### List orgs that user belongs to
```bash
mainfluxlabs-cli orgs memberships <member_id> <user_token>
```

### Webhooks
#### Create new webhooks
```bash
mainfluxlabs-cli webhooks create '{[{"name":"<webhook_name>","url":"<url>","headers":{"key":"value",...}}]}' <group_id> <user_token>
```

#### Get webhook by id
```bash
mainfluxlabs-cli webhooks get by-id <id> <user_token>
```

#### Get webhooks by group
```bash
mainfluxlabs-cli webhooks get by-group <group_id> <user_token>
```

#### Update webhook
```bash
mainfluxlabs-cli webhooks update '{"id":"<webhook_id>","name":"new_name"}' <user_token>
```

#### Delete webhooks
```bash
mainfluxlabs-cli webhooks delete '{["<webhook_id>"]}' <group_id> <user_token>
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
