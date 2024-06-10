# API

## Reference
API reference in the Swagger UI can be found at:

[https://mainfluxlabs.github.io/mainflux](https://mainfluxlabs.github.io/mainflu)

## Users

### Create User
To start working with the Mainflux system, you need to create a user account.

> Must-have: e-mail and password (password must contain at least 8 characters)

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" http://localhost/users -d '{"email":"<user_email>", "password":"<user_password>"}'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:06:45 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Location: /users/d782b42b-e317-4cd7-9dd0-4e2ea0f349c8
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *
```

### Create Token
To log in to the Mainflux system, you need to create a `user_token`.

> Must-have: registered e-mail and password

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" http://localhost/tokens -d '{"email":"<user_email>",
"password":"<user_password>"}'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:07:18 GMT
Content-Type: application/json
Content-Length: 281
Connection: keep-alive
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MTU0MjQ4MzgsImlhdCI6MTYxNTM4ODgzOCwiaXNzIjoibWFpbmZsdXguYXV0aCIsInN1YiI6InRlc3RAZW1haWwuY29tIiwiaXNzdWVyX2lkIjoiZDc4MmI0MmItZTMxNy00Y2Q3LTlkZDAtNGUyZWEwZjM0OWM4IiwidHlwZSI6MH0.TAQxV6TImKw06RsK0J11rOHiWPvexEOA4BNZnhLhtxs"}
```

### Get User
You can always check the user entity that is logged in by entering the user ID and `user_token`.

> Must-have: `user_id` and `user_token`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/users/<user_id>
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:09:47 GMT
Content-Type: application/json
Content-Length: 85
Connection: keep-alive
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *

{"id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","email":"test@email.com"}
```

### Get All Users
You can get all users in the database by calling this function

> Must-have: `user_token`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/users
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:11:28 GMT
Content-Type: application/json
Content-Length: 217
Connection: keep-alive
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *

{"total":2,"offset":0,"limit":10,"Users":[{"id":"4bf4a13a-e9c3-4207-aa11-fe569986c301","email":"admin@example.com"},{"id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","email":"test@email.com"}]}
```

### Update User
Updating user's metadata

> Must-have: `user_token`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/users -d
'{"metadata":{"foo":"bar"}}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:15:31 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *
```

### Change Password
Changing the user password can be done by calling the update password function

> Must-have: `user_token`, `old_password` and password (`new_password`)

```bash
curl -s -S -i -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/password -d '{"old_password":"<old_password>", "password":"<new_password>"}'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:17:36 GMT
Content-Type: application/json
Content-Length: 11
Connection: keep-alive
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *
```

## Things

### Create Thing with External ID
It is often the case that the user will want to integrate the existing solutions, e.g. an asset management system, with the Mainflux platform. To simplify the integration between the systems and avoid artificial cross-platform reference, such as special fields in Mainflux Things metadata, it is possible to set Mainflux Thing ID with an existing unique ID while create the Thing. This way, the user can set the existing ID as the Thing ID of a newly created Thing to keep reference between Thing and the asset that Thing represents.
There are two limitations - the existing ID have to be in UUID V4 format and it has to be unique in the Mainflux domain.

To create a thing with an external ID, you need provide the UUID v4 format ID together with thing name, and other fields as well as a `user_token`, metadata and `group_id`.

> Must-have: `user_token`, `<group_id>`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/things -d '[{"id": "<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx>","name": "<thing_name>","metadata":{"key":"val"}}]'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:18:37 GMT
Content-Type: application/json
Content-Length: 199
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"things":[{"id":"<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx>","name":"thing_name","key":"659aa6ca-1781-4a69-9a20-689ddb235506","group_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","metadata":{"key":"val"}}]}
```
### Create Things
You can create multiple things at once by entering a series of things structures, `group_id` and a `user_token`

> Must-have: `user_token`, `group_id` and at least two things

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/things -d '[{"name": "<thing_name_1>"}, {"name": "<thing_name_2>","metadata":{"key":"val"}}]'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:19:48 GMT
Content-Type: application/json
Content-Length: 365
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"things":[{"id":"4328f3e4-4c67-40b3-9491-0ab782c48d50","name":"thing_name_1","key":"828c6985-c2d6-419e-a124-ba99147b9920","group_id":"123e4567-e89b-12d3-a456-426614174000"},{"id":"38aa33fe-39e5-4ee3-97ba-4227cfac63f6","name":"thing_name_2","key":"f73e7342-06c1-499a-9584-35de495aa338","group_id":"123e4567-e89b-12d3-a456-426614174000","metadata":{"key":"val"}}]}
```

### Create Things with external ID
The same as creating a Thing with external ID the user can create multiple things at once by providing UUID v4 format unique ID in a series of things together with a `user_token` and `group_id`

> Must-have: `user_token`, `group_id` and at least two things

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/things -d '[{"id": "<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx1>","name": "<thing_name_1>"}, {"id": "<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx2>","name": "<thing_name_2>"}]'
```

### Get Thing
You can get thing entity by entering the thing ID and `user_token`

> Must-have: `user_token` and `thing_id`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/things/<thing_id>
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:20:52 GMT
Content-Type: application/json
Content-Length: 185
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"64140f0b-6448-41cf-967e-1bbcc703c332","name":"thing_name","key":"659aa6ca-1781-4a69-9a20-689ddb235506","group_id":"123e4567-e89b-12d3-a456-426614174000","metadata":{"key":"val"}}
```

### Get All Things
Get all things, list requests accepts limit and offset query parameters

> Must-have: `user_token`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/things
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:21:49 GMT
Content-Type: application/json
Content-Length: 582
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"total":3,"offset":0,"limit":10,"order":"","direction":"","things":[{"id":"64140f0b-6448-41cf-967e-1bbcc703c332","name":"thing_name","key":"659aa6ca-1781-4a69-9a20-689ddb235506","group_id":"550e8400-e29b-41d4-a716-446655440000","metadata":{"key":"val"}},{"id":"4328f3e4-4c67-40b3-9491-0ab782c48d50","name":"thing_name_1","key":"828c6985-c2d6-419e-a124-ba99147b9920","group_id":"550e8400-e29b-41d4-a716-446655440000"},{"id":"38aa33fe-39e5-4ee3-97ba-4227cfac63f6","name":"thing_name_2","key":"f73e7342-06c1-499a-9584-35de495aa338","group_id":"550e8400-e29b-41d4-a716-446655440000"}]}
```

### Get Things by Group
Get all things by a certain group

> Must-have: `user_token`, `group_id`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/things
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:21:49 GMT
Content-Type: application/json
Content-Length: 582
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"total":3,"offset":0,"limit":10,"order":"","direction":"","things":[{"id":"64140f0b-6448-41cf-967e-1bbcc703c332","name":"thing_name","key":"659aa6ca-1781-4a69-9a20-689ddb235506","group_id":"550e8400-e29b-41d4-a716-446655440000","metadata":{"key":"val"}},{"id":"4328f3e4-4c67-40b3-9491-0ab782c48d50","name":"thing_name_1","key":"828c6985-c2d6-419e-a124-ba99147b9920","group_id":"550e8400-e29b-41d4-a716-446655440000"},{"id":"38aa33fe-39e5-4ee3-97ba-4227cfac63f6","name":"thing_name_2","key":"f73e7342-06c1-499a-9584-35de495aa338","group_id":"550e8400-e29b-41d4-a716-446655440000"}]}
```

### Update Thing
Updating a thing entity

> Must-have: `user_token` and `thing_id`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/things/<thing_id> -d '{"name": "<thing_name>"}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:23:36 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Delete Thing
To delete a thing you need a `thing_id` and a `user_token`

> Must-have: `user_token` and `thing_id`

```bash
curl -s -S -i -X DELETE -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/things/<thing_id>
```

Response:
```bash
HTTP/1.1 204 No Content
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:24:44 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

## Channels

### Create Channel with external ID
Channel is a group of things that could represent a special category in existing systems, e.g. a building level channel could represent the level of a smarting building system. For helping to keep the reference, it is possible to set an existing ID while creating the Mainflux channel. There are two limitations - the existing ID has to be in UUID V4 format and it has to be unique in the Mainflux domain.

To create a channel with external ID, the user needs provide a UUID v4 format unique ID, `group_id`, metadata, profile and a `user_token`.
The detailed configuration of the Channel Profile can be found at [Channel Profile](https://github.com/MainfluxLabs/docs/blob/master/docs/messaging.md#configure-channel-profile).
> Must-have: `user_token`,`group_id`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/channels -d '[{"id": "<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx>","name": "<channel_name>","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:26:51 GMT
Content-Type: application/json
Content-Length: 204
Connection: keep-alive
Location: /channels/db4b7428-e278-4fe3-b85a-d65554d6abe9
Access-Control-Expose-Headers: Location

{"channels":[{"id":"<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx>","name":"channel_name","group_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]}

```
### Create Channels
The same as creating a channel with external ID the user can create multiple channels at once by providing UUID v4 format unique ID in a series of channels together with a `user_token` and `<group_id>`.

> Must-have: `user_token`, `group_id` and at least 2 channels

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/channels -d '[{"name": "<channel_name_1>"}, {"name": "<channel_name_2>","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:28:10 GMT
Content-Type: application/json
Content-Length: 352
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"channels":[{"id":"b8073d41-01dc-46ad-bb26-cfecc596c6c1","name":"channel_name_1","group_id":"123e4567-e89b-12d3-a456-426614174000"},{"id":"2200527a-f590-4fe5-b9d6-892fc6f825c3","name":"channel_name_2","group_id":"123e4567-e89b-12d3-a456-426614174000","metadata":{"key":"val"},"profile":{"content-type":"application/json"}}]}
```

### Create Channels with external ID
As with things, you can create multiple channels with external ID at once

> Must-have: `user_token`, `group_id` and at least 2 channels

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/channels -d '[{"id": "<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx1>","name": "<channel_name_1>","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}, {"id": "<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx2>","name": "<channel_name_2>","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:28:10 GMT
Content-Type: application/json
Content-Length: 398
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"channels":[{"id":"<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx1>","name":"channel_name_1","group_id":"123e4567-e89b-12d3-a456-426614174000","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}},{"id":"<xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx2>","name":"channel_name_2","group_id":"123e4567-e89b-12d3-a456-426614174000","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]}
```
### Get Channel
Get a channel entity for a logged in user

> Must-have: `user_token` and `channel_id`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/channels/<channel_id>
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:29:49 GMT
Content-Type: application/json
Content-Length: 188
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"db4b7428-e278-4fe3-b85a-d65554d6abe9","group_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"channel_name","metadata":{"key":"val"},"profile":{"content-type":"application/json"}}
```

### Get Channels
Get all channels, list requests accepts limit and offset query parameters

> Must-have: `user_token`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/channels
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:30:34 GMT
Content-Type: application/json
Content-Length: 493
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"total":3,"offset":0,"limit":10,"order":"","direction":"","channels":[{"id":"db4b7428-e278-4fe3-b85a-d65554d6abe9","group_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"channel_name","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}},{"id":"b8073d41-01dc-46ad-bb26-cfecc596c6c1","group_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"channel_name_1","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}},{"id":"2200527a-f590-4fe5-b9d6-892fc6f825c3","group_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"channel_name_2","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]}
```

### Get Channels by Group
Get all channels by a certain group

> Must-have: `user_token`, `<group_id>`

```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/channels
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:30:34 GMT
Content-Type: application/json
Content-Length: 493
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"total":3,"offset":0,"limit":10,"order":"","direction":"","channels":[{"id":"db4b7428-e278-4fe3-b85a-d65554d6abe9","name":"channel_name","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}},{"id":"b8073d41-01dc-46ad-bb26-cfecc596c6c1","name":"channel_name_1","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}},{"id":"2200527a-f590-4fe5-b9d6-892fc6f825c3","name":"channel_name_2","metadata":{"key":"val"},"profile":{"Content-Type":"application/json"}}]}
```

### Update Channel
Update channel entity

> Must-have: `user_token` and `channel_id`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/channels/<channel_id> -d '{"name": "<channel_name>"}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:32:08 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Delete Channel
Delete a channel entity

> Must-have: `user_token` and `channel_id`

```bash
curl -s -S -i -X DELETE -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/channels/<channel_id>
```

Response:
```bash
HTTP/1.1 204 No Content
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:33:21 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Connect
Connect things to channels

> Must-have: `user_token`, `channel_id` and `thing_id`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/connect -d '{"channel_ids": ["<channel_id>"], "thing_ids": ["<thing_id>"]}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:36:32 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

Connect thing to channel

> Must-have: `user_token`, `channel_id` and `thing_id`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/channels/<channel_id>/things/<thing_id>
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.20.0
Date: Fri, 21 Jan 2022 15:20:47 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Warning-Deprecated: This endpoint will be depreciated in v1.0.0. It will be replaced with the bulk endpoint found at /connect.
Access-Control-Expose-Headers: Location
```

### Disconnect
Disconnect things from channels specified by lists of IDs.

> Must-have: `user_token`, `channel_ids` and `thing_ids`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost:<service_port>/disconnect -d '{"thing_ids": ["<thing_id_1>", "<thing_id_2>"], "channel_ids": ["<channel_id_1>", "<channel_id_2>"]}'
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 11 Jul 2021 17:23:39 GMT
Content-Length: 0
```

Disconnect thing from the channel

> Must-have: `user_token`, `channel_id` and `thing_id`

```bash
curl -s -S -i -X DELETE -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/channels/<channel_id>/things/<thing_id>
```

Response:
```bash
HTTP/1.1 204 No Content
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 15:38:14 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Access by Key
Checks if thing has access to a channel

> Must-have: `thing_key`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" http://localhost/connections -d '{"key": "<thing_key>"}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Mon, 22 Mar 2021 13:10:53 GMT
Content-Type: application/json
Content-Length: 103
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"channel_id":"d69d0098-072b-41bf-8c6e-ce4dbb12d333","thing_id":"a543a098-072b-41bf-8c6e-ce4dbb12d444"}
```

### Identify
Validates thing's key and returns it's ID if key is valid

> Must-have: `thing_key`
```bash
curl -s -S -i -X POST -H "Content-Type: application/json" http://localhost/identify -d '{"token": "<thing_key>"}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Mon, 22 Mar 2021 15:04:41 GMT
Content-Type: application/json
Content-Length: 46
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"d69d0098-072b-41bf-8c6e-ce4dbb12d333"}
```

## Messages

### Send Messages
Sends message via HTTP protocol

> Must-have: `thing_key` and `channel_id`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Thing <thing_key>" http://localhost/http/channels/<channel_id>/messages -d '[{"bn":"some-base-name:","bt":1.276020076001e+09,"bu":"A","bver":5,"n":"voltage","u":"V","v":120.1}, {"n":"current","t":-5,"v":1.2}, {"n":"current","t":-4,"v":1.3}]'
```

Response:
```bash
HTTP/1.1 202 Accepted
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 16:53:54 GMT
Content-Length: 0
Connection: keep-alive
```

### Read Messages
Reads messages from database for a given channel

> Must-have: `thing_key` and `channel_id`

```bash
curl -s -S -i -H "Authorization: Thing <thing_key>" http://localhost:<service_port>/channels/<channel_id>/messages?offset=0&limit=5
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Wed, 10 Mar 2021 16:54:58 GMT
Content-Length: 660

{"offset":0,"limit":10,"format":"messages","total":3,"messages":[{"channel_name":"1a0cde06-8e5c-4f07-aac5-95aff4a19ea0","publisher":"33eb28c3-4ca2-45c3-b1c5-d5d049c6c24e","protocol":"http","name":"some-base-name:voltage","unit":"V","time":1276020076.001,"value":120.1},{"channel_name":"1a0cde06-8e5c-4f07-aac5-95aff4a19ea0","publisher":"33eb28c3-4ca2-45c3-b1c5-d5d049c6c24e","protocol":"http","name":"some-base-name:current","unit":"A","time":1276020072.001,"value":1.3},{"channel_name":"1a0cde06-8e5c-4f07-aac5-95aff4a19ea0","publisher":"33eb28c3-4ca2-45c3-b1c5-d5d049c6c24e","protocol":"http","name":"some-base-name:current","unit":"A","time":1276020071.001,"value":1.2}]}
```

## Orgs

### Create org
To create an org, you need the org name, description, metadata and a `user_token`

> Must-have: `user_token`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs -d '{"name": "<org_name>", "description": "<org_description>", "metadata": {}}'
```

Response:
```bash
HTTP/1.1 201 Created
Content-Type: application/json
Location: /orgs/25da5d7a-d3f5-435e-bcad-0cf22343121a
Date: Fri, 14 Jul 2023 14:03:14 GMT
Content-Length: 0
```

### View org
To view an org, you need the org ID and a `user_token`

> Must-have: `user_token` and `org_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs/<org_id>
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Fri, 14 Jul 2023 14:22:48 GMT
Content-Length: 250

{"id":"25da5d7a-d3f5-435e-bcad-0cf22343121a","name":"org_name","owner_id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822","description":"org_description","created_at":"2023-07-14T14:03:14.897Z","updated_at":"2023-07-14T14:03:14.897Z"}
```

### Update org
To update an org, you need the org ID, name, description, metadata and a `user_token`

> Must-have: `user_token` and `org_id`

```bash
 curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>"  http://localhost/orgs/<org_id> -d '{"name": "<org_name>", "description": "<org_desc>", "metadata":{}}'
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Fri, 14 Jul 2023 14:41:23 GMT
Content-Length: 0
```

### Delete org
To delete an org, you need the org ID and a `user_token`

> Must-have: `user_token` and `org_id`

```bash
curl -s -S -i -X DELETE -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs/<org_id>
```

Response:
```bash
HTTP/1.1 204 No Content
Content-Type: application/json
Date: Fri, 14 Jul 2023 14:47:24 GMT
```

### List orgs

To list orgs, you need a `user_token`
Only admin users can list all orgs, other users can only list orgs they are members of.

> Must-have: `user_token`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Fri, 14 Jul 2023 20:43:58 GMT
Content-Length: 456

{"limit":10,"offset":0,"total":2,"name":"","orgs":[{"id":"9883c534-eeb5-4e30-aec9-bd6cf1639f95","name":"org_name_1","owner_id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822", "metadata":{"meta":"test1"},"created_at":"2023-07-13T09:35:40.116Z","updated_at":"2023-07-13T10:58:32.523Z"},{"id":"49114ab9-acbb-4d0b-be01-0dc2f396136c","name":"org_name_2","owner_id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822","metadata":{"meta":"test2"},"created_at":"2023-07-13T09:29:41.718Z","updated_at":"2023-07-13T11:08:22.586Z"}]}
```

### Assign members

To assign members to an org, you need the org ID, member emails, member roles and a `user_token`

> Must-have:  `email`, `user_token` and `org_id`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs/<org_id>/members -d '{"members":[{"email": "<user_email>","role": "user_role"}]}'
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Mon, 17 Jul 2023 08:24:44 GMT
Content-Length: 0
```

### Unassign members

To unassign members from an org, you need the org ID, member IDs and a `user_token`

> Must-have: `user_token`, `org_id` and `member_id`

```bash
curl -s -S -i -X DELETE -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs/<org_id>/members -d '{"member_ids":["<member_id>"]}'
```

Response:
```bash
HTTP/1.1 204 No Content
Content-Type: application/json
Date: Mon, 17 Jul 2023 08:44:58 GMT
```
### Update members

To update members of an org, you need the org ID, member ids and a `user_token`

> Must-have: `user_token`, `org_id` and `user_email`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_id>" http://localhost/orgs/<org_id>/members -d '{"members":[{"member_id":"<member_id>", "role":"new_role"}]}'
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Mon, 17 Jul 2023 08:54:12 GMT
Content-Length: 0
```

### List members

To list members of an org, you need the org ID and a `user_token`

> Must-have: `user_token` and `org_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs/<org_id>/members
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Mon, 17 Jul 2023 09:13:22 GMT
Content-Length: 235

{"limit":10,"offset":0,"total":2,"name":"","members":[{"id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822","email":"user@example.com","role":"owner"},{"id":"34cf0a14-dc23-42ed-87bd-fa7ecc205bc2","email":"user_2@example.com","role":"admin"}]}
```

### List orgs by member

To list orgs by member, you need the member ID and a `user_token`

> Must-have: `user_token` and `member_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>"  http://localhost/members/<member_id>/orgs
```

Response:
```bash
HTTP/1.1 200 OK
Content-Type: application/json
Date: Mon, 17 Jul 2023 10:21:56 GMT
Content-Length: 622

{"limit":10,"offset":0,"total":3,"name":"","orgs":[{"id":"1fb75a76-3ca9-4c38-9194-5b03f25860f1","name":"org_name","owner_id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822","created_at":"0001-01-01T00:00:00Z","updated_at":"0001-01-01T00:00:00Z"},{"id":"49114ab9-acbb-4d0b-be01-0dc2f396136c","name":"org_name_1","owner_id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822","created_at":"0001-01-01T00:00:00Z","updated_at":"0001-01-01T00:00:00Z"},{"id":"9883c534-eeb5-4e30-aec9-bd6cf1639f95","name":"org_name_2","owner_id":"a08bd22c-916d-4ed1-8ca4-8d32ede58822","created_at":"0001-01-01T00:00:00Z","updated_at":"0001-01-01T00:00:00Z"}]}
```

## Groups

### Create group
To create a group, you need the group name, description, metadata, `org_id` and a `user_token`

> Must-have: `org_id`, `user_token`

```bash
curl -s -S -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/orgs/<org_id>/groups -d '{"name": "<group_name>", "description": "<group_description>", "metadata": {}}'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 16:58:09 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Location: /groups/01F0EH61SA7C7NDKWYCXVG7PWD
Access-Control-Expose-Headers: Location
```

### Get group
Get a group entity for a logged in user

> Must-have: `user_token` and `group_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:06:48 GMT
Content-Type: application/json
Content-Length: 264
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"5316d843-abf8-4db4-93fd-bdc8917d42ec","org_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"group_name","owner_id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","description":"desc","created_at":"2021-03-10T16:58:09.579Z","updated_at":"2021-03-10T16:58:09.579Z"}
```

### Get groups
Get all groups, list requests accepts limit and offset query parameters

> Must-have: `user_token`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:09:28 GMT
Content-Type: application/json
Content-Length: 573
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"total":2,"limit":10,"offset":0,"groups":[{"id":"5316d843-abf8-4db4-93fd-bdc8917d42ec","org_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"group_name","owner_id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","description":"desc","created_at":"2021-03-10T16:58:09.579Z","updated_at":"2021-03-10T16:58:09.579Z"},{"id":"2513d843-abf8-4db4-93fd-bdc8917d42mm","org_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"group_name_1","owner_id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","description":"desc","created_at":"2021-03-10T17:07:52.13Z","updated_at":"2021-03-10T17:07:52.13Z"}]}
```

### Update group
Update group entity

> Must-have: `user_token`, `group_id`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/groups/<group_id> -d '{"name": "<group_name>"}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:11:51 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Delete group
Delete a group entity

> Must-have: `user_token`, `group_id`

```bash
curl -s -S -i -X DELETE -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>
```

Response:
```bash
HTTP/1.1 204 No Content
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:14:13 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Get group by thing
Get a group entity by thing

> Must-have: `user_token`, `thing_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/things/<thing_id>/groups
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:06:48 GMT
Content-Type: application/json
Content-Length: 264
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"5316d843-abf8-4db4-93fd-bdc8917d42ec","org_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"group_name","owner_id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","description":"desc","created_at":"2021-03-10T16:58:09.579Z","updated_at":"2021-03-10T16:58:09.579Z"}
```

### Get group by channel
Get a group entity by channel

> Must-have: `user_token`, `channel_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/channels/<channel_id>/groups
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:06:48 GMT
Content-Type: application/json
Content-Length: 264
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"5316d843-abf8-4db4-93fd-bdc8917d42ec","org_id":"c9bf9e57-1685-4c89-bafb-ff5af830be8a","name":"group_name","owner_id":"d782b42b-e317-4cd7-9dd0-4e2ea0f349c8","description":"desc","created_at":"2021-03-10T16:58:09.579Z","updated_at":"2021-03-10T16:58:09.579Z"}
```

## Group roles

### Create roles by group
The admin of the group can add custom roles. Only roles defined on [Predefined Roles section](/authorization/#summary-of-the-defined-policies) are allowed.

> Must-have: `user_token`, `group_id`, group_roles

```bash
curl -isSX POST http://localhost/groups/<group_id>/members -d '{"group_roles":{"id":"123e4567-e89b-12d3-a456-426614174000","role":"viewer"}}' -H "Authorization: Bearer <user_token>" -H 'Content-Type: application/json'
```

Response:
```bash
HTTP/1.1 201 Created
Content-Type: application/json
Date: Wed, 03 Nov 2021 13:00:14 GMT
Content-Length: 3

{}
```

### Delete roles by group
The admin of the group can delete roles. Only policies defined on [Predefined Roles section](/authorization/#summary-of-the-defined-policies) are allowed.

> Must-have: `user_token`, `group_id`, member_ids

```bash
curl -isSX PATCH http://localhost/groups/<group_id>/members -d '{"member_ids":["987fbc97-4bed-5078-9f07-9141ba07c9f3","c9bf9e57-1685-4c89-bafb-ff5af830be8a"]}' -H "Authorization: Bearer <user_token>" -H 'Content-Type: application/json'
```

Response:
```bash
HTTP/1.1 204 No Content
Content-Type: application/json
Date: Wed, 03 Nov 2021 13:00:05 GMT
```

### Update roles by group
The admin of the group can update roles.

> Must-have: `user_token`, `group_id`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/members -d '{"group_roles":{"id":"123e4567-e89b-12d3-a456-426614174000","role":"viewer"}}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:11:51 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Get roles by group
To list roles by group, you need the group ID and a `user_token`

> Must-have: `user_token`, `group_id`

```bash
curl -s -S -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/members
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Wed, 10 Mar 2021 17:09:28 GMT
Content-Type: application/json
Content-Length: 225
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"total":2,"limit":10,"offset":0,"groups_roles":[{"id":"5316d843-abf8-4db4-93fd-bdc8917d42ec","email":"user@gmail.com","role":"viewer"},{"id":"2513d843-abf8-4db4-93fd-bdc8917d42mm","email":"user2@gmail.com","role":"editor"}]}
```

## API Key

### Issue API Key
Generates a new API key. Then new API key will be uniquely identified by its ID.
Duration is expressed in seconds.

> Must-have: `user_token`

```bash
curl -isSX POST  http://localhost/keys -H "Content-Type: application/json" -H "Authorization: Bearer <user_token>" -d '{"type":2, "duration":10000}'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.20.0
Date: Sun, 19 Dec 2021 17:39:44 GMT
Content-Type: application/json
Content-Length: 476
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"4d62fb1e-085e-435c-a0c5-5255febfa35b","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NDAwMzU1ODQsImp0aSI6IjRkNjJmYjFlLTA4NWUtNDM1Yy1hMGM1LTUyNTVmZWJmYTM1YiIsImlhdCI6MTYzOTkzNTU4NCwiaXNzIjoibWFpbmZsdXguYXV0aCIsInN1YiI6ImZscDFAZW1haWwuY29tIiwiaXNzdWVyX2lkIjoiYzkzY2FmYjMtYjNhNy00ZTdmLWE0NzAtMTVjMTRkOGVkMWUwIiwidHlwZSI6Mn0.RnvjhygEPPWFDEUKtfk5okzVhZzOcO0azr8gd5vby5M","issued_at":"2021-12-19T17:39:44.175088349Z","expires_at":"2021-12-20T21:26:24.175088349Z"}
```

### Get API key details

> Must-have: 'user_token' and 'key_id'

```bash
curl -isSX GET  http://localhost/keys/<key_id> -H 'Content-Type: application/json' -H 'Authorization: Bearer <user_token>'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.20.0
Date: Sun, 19 Dec 2021 17:43:30 GMT
Content-Type: application/json
Content-Length: 218
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"f630f594-d967-4c54-85ef-af58efe8e8ed","issuer_id":"c93cafb3-b3a7-4e7f-a470-15c14d8ed1e0","subject":"test@email.com","type":2,"issued_at":"2021-12-19T17:42:40.884521Z","expires_at":"2021-12-20T21:29:20.884521Z"}
```

### Revoke API key identified by the given ID

> Must-have: 'user_token' and 'key_id'

```bash
curl -isSX DELETE  http://localhost/keys/<key_id> -H 'Content-Type: application/json' -H 'Authorization: Bearer <user_token>'
```

Response:
```bash
HTTP/1.1 204 No Content
Server: nginx/1.20.0
Date: Sun, 19 Dec 2021 17:47:11 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

## Webhooks

### Create Webhooks

To forward a message to another platform, you need to create a Webhook with the necessary data such as the `name` of the Webhook, `group_id` which refers to the Group for which the Webhook is being created, the `url` to which the message will be forwarded and HTTP `headers` specific for the certain webhook.

You can create multiple Webhooks at once by entering a series of Webhooks structures, `group_id` and a `user_token`.

> Must-have: `user_token`, `group_id`, `name` and `url`
```bash
curl -s -S -i -X POST -H "Authorization: Bearer <user_token>" -H "Content-Type: application/json" http://localhost/groups/<group_id>/webhooks -d '{"webhooks: [{"name":"webhook_name","url":"https://webhook.com","headers":{"Content-Type":"application/json"}}]}'
```

Response:
```bash
HTTP/1.1 201 Created
Server: nginx/1.20.0
Date: Thu, 11 Apr 2024 11:47:12 GMT
Content-Type: application/json
Content-Length: 191
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"f630f594-d967-4c54-85ef-af58efe8e8ed","group_id":"c93cafb3-b3a7-4e7f-a470-15c14d8ed1e0","name":"webhook_name","url":"https://webhook.com","headers":{"Content-Type":"application/json"}}

```
**Note:** The logged-in user who creates a Webhook for a certain Group must have the role of "editor" of that Group.

### Get Webhooks by Group ID
You can get all Webhooks for certain Group by entering `user_token` and `group_id`.

> Must-have: `user_token` and `group_id`
```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" -H "Content-Type: application/json" http://localhost/groups/<group_id>/webhooks
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.20.0
Date: Thu, 11 Apr 2024 11:44:57 GMT
Content-Type: application/json
Content-Length: 355
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"webhooks":[{"id":"f630f594-d967-4c54-85ef-af58efe8e8ed","group_id":"50e6b371-60ff-45cf-bb52-8200e7cde536","name":"Test","url":"https://api.test.com/","headers":{"Content-Type":"application/json"}},{"id":"1234f594-d967-4c54-85ef-af58efe8e8ed","group_id":"50e6b371-60ff-45cf-bb52-8200e7cde536","name":"Test2","url":"https://api.test2.com/","headers":{}}]}
```

### Get Webhook
View details of a certain Webhook by entering `user_token` and `webhook_id`.

> Must-have: `user_token` and `group_id`
```bash
curl -s -S -i -X GET -H "Authorization: Bearer <user_token>" -H "Content-Type: application/json" http://localhost/webhooks/<webhook_id>
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.20.0
Date: Thu, 11 Apr 2024 11:44:57 GMT
Content-Type: application/json
Content-Length: 185
Connection: keep-alive
Access-Control-Expose-Headers: Location

{"id":"f630f594-d967-4c54-85ef-af58efe8e8ed","group_id":"50e6b371-60ff-45cf-bb52-8200e7cde536","name":"Test","url":"https://api.test.com/","headers":{"Content-Type":"application/json"}}
```
### Update Webhook
Update data of webhook with provided ID and `user_token`

> Must-have: `user_token` and `webhook_id`

```bash
curl -s -S -i -X PUT -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/webhooks/<webhook_id> -d '{"name": "<webhook_name>"}'
```

Response:
```bash
HTTP/1.1 200 OK
Server: nginx/1.16.0
Date: Thu, 11 Apr 2024 11:54:52 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
Access-Control-Expose-Headers: Location
```

### Delete Webhooks
Delete webhooks by given IDs

> Must-have: `user_token`,`group_id`, webhook_ids

```bash
curl -s -S -i -X PATCH -H "Content-Type: application/json" -H  "Authorization: Bearer <user_token>" http://localhost/groups/<group_id>/webhooks -d '{"webhook_ids":["c93cafb3-b3a7-4e7f-a470-15c14d8ed1e0","2513d843-abf8-4db4-93fd-bdc8917d42mm"]}'
```

Response:
```bash
HTTP/1.1 204 No Content
Server: nginx/1.16.0
Date: Thu, 11 Apr 2024 11:55:10 GMT
Content-Type: application/json
Connection: keep-alive
Access-Control-Expose-Headers: Location
```
