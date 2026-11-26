# Python Scripts

The Python Scripts service stores Python scripts per group, runs them on demand against a message, and records the outcome of every run. Scripts can use the Python standard library together with `numpy` and `pandas`, which are imported once by a pool of long-lived worker processes. Each run executes in a sandboxed child process forked from a worker, so no run can affect the next one.

## Scripts

| Field         | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `id`          | Unique script identifier                                     |
| `group_id`    | ID of the group the script belongs to                        |
| `name`        | Script name (up to 254 bytes)                                |
| `description` | Optional free-form description                               |
| `source`      | Python source code (up to 65,535 bytes by default)           |
| `checksum`    | Hex-encoded SHA-256 of `source`, recomputed on every update  |
| `created_at`  | Creation timestamp                                           |
| `updated_at`  | Timestamp of the last update                                 |

Authorization is delegated to the Things service. Reading scripts and runs requires `viewer` access to the group. Creating, updating and removing scripts, removing runs, and **running** scripts require `editor` access. Running counts as an editor action because it executes code inside the service.

Script source and run logs are readable by every viewer of the group, so they must not contain credentials.

When a group is removed, its scripts and their runs are removed with it.

## Runs

Each run produces a run record:

| Field             | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `id`              | Unique run identifier                                           |
| `script_id`       | The script that was run                                         |
| `script_checksum` | Checksum of the script source the run executed                  |
| `status`          | `success` or `fail`                                             |
| `return_value`    | JSON value produced by the script (`null` on failure)           |
| `logs`            | Lines the script wrote to standard output or standard error     |
| `error`           | Reason for the failure (on failure)                             |
| `started_at`      | Timestamp of when the run started                               |
| `finished_at`     | Timestamp of when the run finished                              |

Each run records the checksum of the source it executed, so a run can still be matched to its source after the script is edited.

Only the newest 1,000 runs of each script are kept. Older runs are deleted automatically when a new run is saved.

## Writing a script

A script is plain Python that runs from top to bottom. The run input is available as the global `message`, a dictionary with the following keys:

| Key        | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `payload`  | Message payload, a JSON object (`None` if not supplied)           |
| `subtopic` | Message subtopic, present only when supplied                      |
| `created`  | Message timestamp, present only when supplied                     |
| `thing_id` | ID of the thing the message refers to, present only when supplied |

If the script's last top-level statement is an expression, its value is the run's result, as in a notebook cell. Otherwise the result is `null`. Anything written with `print` or to `sys.stderr` is recorded in the run's `logs`. If the script raises an exception, the run fails and the traceback is recorded in `error`.

```python
import numpy as np

vals = [r["v"] for r in message["payload"]["readings"]]
print("got", len(vals), "readings")
float(np.mean(vals))
```

The result must be JSON-serializable. Convert numpy and pandas values to native Python types first, for example with `float(...)`, `int(...)` or `.tolist()`. If the result is a numpy scalar other than `np.float64` (for example `np.int64`, `np.float32` or `np.bool_`), an array, a DataFrame, `NaN` or `Infinity`, the run fails with `result cannot be returned: ...`. `np.float64` is a subclass of Python `float`, so it is returned as a number.

The only third-party packages available are `numpy` and `pandas`, and no others can be installed.

## Sandbox and limits

Before any script code runs, the forked child:

- sets the CPU, data and file size resource limits and disables core dumps,
- installs a seccomp allow-list filter,
- starts a new session and replaces stdin, stdout and stderr with `/dev/null`.

The seccomp filter denies every system call that it does not explicitly allow. As a result:

- **Network access is blocked.** Socket system calls are denied, so modules such as `socket`, `urllib.request`, `http.client` and `smtplib` fail.
- **Process creation is blocked.** `subprocess`, `os.fork`, `os.exec*` and `multiprocessing` fail. Threads (`threading`, `ThreadPoolExecutor`) are allowed.
- **Files can be read but not written.** Opening a file for writing or creating one fails with `EROFS`.
- **Signals can be sent only to the run's own process.**

The service refuses to start a worker that reports no seccomp filter.

!!! warning
    The sandbox is meant for scripts written by trusted group editors, not for hostile multi-tenant code. Scripts run under the same user as the service and can read any file that user can read. Worker processes do not receive the service's environment variables, but if the files that `MF_PYSCRIPTS_SERVER_KEY` or `MF_PYSCRIPTS_DB_SSL_KEY` point to are mounted into the container, a group editor can read them and return their contents as a run result.

Every run is subject to the following limits:

| Limit             | Default      | Variable                       | Error recorded on the run                                                   |
| ----------------- | ------------ | ------------------------------ | --------------------------------------------------------------------------- |
| Wall-clock time   | 10 s         | `MF_PYSCRIPTS_RUN_TIMEOUT`     | `timeout after 10s`                                                         |
| CPU time          | 5 s          | `MF_PYSCRIPTS_MAX_CPU_SECONDS` | `cpu time limit exceeded (5s)`                                              |
| Memory            | 256 MiB      | `MF_PYSCRIPTS_MAX_MEMORY`      | `script killed, most likely by the memory limit`, or a Python `MemoryError` |
| Output size       | 1 MiB        | `MF_PYSCRIPTS_MAX_OUTPUT_SIZE` | `output limit exceeded`, or `result cannot be returned: ...`                |
| Log lines         | 256          | `MF_PYSCRIPTS_MAX_LOG_LINES`   | —                                                                           |
| File size         | 0 bytes      | `MF_PYSCRIPTS_MAX_FILE_SIZE`   | `file size limit exceeded`                                                  |
| Script size       | 65,535 bytes | `MF_PYSCRIPTS_MAX_SCRIPT_SIZE` | Rejected with `400` when the script is saved                                |
| Run payload size  | 1 MiB        | —                              | Rejected with `400` when the run is requested                               |

Size variables take a byte count (for example `MF_PYSCRIPTS_MAX_MEMORY=268435456`), `MF_PYSCRIPTS_RUN_TIMEOUT` takes a duration (`10s`), and `MF_PYSCRIPTS_MAX_CPU_SECONDS` takes an integer number of seconds.

Notes on the limits:

- The memory limit is what the script itself may allocate, on top of the worker's own memory, which already includes numpy and pandas.
- The output size covers the logs and the result together. A result can never exceed 4 MiB, whatever the configured output size.
- Log lines beyond the limit are dropped and the run does not fail. A log line longer than 8,192 characters is truncated and ends with `... (truncated)`.

## Rate limiting

Creating, updating and running scripts each occupy a worker, because creating and updating compile the source. These requests are rate limited per group to 2 requests per second, with a burst of 10. In addition, each group, and each user across all of their groups, can have only one of these requests in progress at a time. A request over either limit is rejected with `429 Too Many Requests`.

If a run leaves its worker unusable, the worker is replaced, and the group and user stay busy for another 2 seconds.

## Managing scripts

### Create Scripts

Up to 32 scripts can be created in a single request. Each script is compiled before it is stored, so a script that does not compile is rejected with `400` when it is created, not when it is run. For a syntax error, the response's `error` contains Python's message with the line number. If any script in the request is invalid, none of them are stored.

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scripts": [
      {
        "name": "mean-reading",
        "description": "Average of all readings in the payload",
        "source": "import numpy as np\nvals = [r[\"v\"] for r in message[\"payload\"][\"readings\"]]\nprint(\"got\", len(vals), \"readings\")\nfloat(np.mean(vals))"
      }
    ]
  }' \
  https://localhost/svcpyscripts/groups/<group_id>/scripts
```

The response has the status `201 Created`:

```json
{
  "scripts": [
    {
      "id": "28fbd528-08e2-4cb0-b44d-87846f0697ca",
      "group_id": "71737291-b2b2-4b56-afc9-6e44de30b6bd",
      "name": "mean-reading",
      "description": "Average of all readings in the payload",
      "checksum": "78fe9da1e5bce23000ddea6566e31957b98e395c3b24078e05be42609faa0792",
      "created_at": "2026-10-14T08:46:11.708118Z",
      "updated_at": "2026-10-14T08:46:11.708118Z"
    }
  ]
}
```

The response does not include `source`. Use [View a Script](#view-a-script) to retrieve it.

The `source` field is a JSON string, so newlines and quotes must be escaped. For anything longer than a few lines, keep the script in a `.py` file and generate the request body from it:

```bash
python3 -c 'import json, sys; print(json.dumps({"scripts": [{"name": "mean-reading", "source": open(sys.argv[1]).read()}]}))' \
  mean_reading.py > body.json

curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  --data-binary @body.json \
  https://localhost/svcpyscripts/groups/<group_id>/scripts
```

### List Scripts by Group

The listed scripts do not include `source`.

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcpyscripts/groups/<group_id>/scripts?offset=0&limit=10&order=name&dir=asc"
```

| Parameter | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `offset`  | Number of items to skip (default `0`)                                 |
| `limit`   | Page size, up to 200 (default `10`)                                   |
| `order`   | Sort field: `id`, `name`, `created_at` or `updated_at` (default `id`) |
| `dir`     | Sort direction: `asc` or `desc` (default `desc`)                      |
| `name`    | Filter by name                                                        |

### View a Script

This is the only endpoint that returns the script `source`.

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  https://localhost/svcpyscripts/scripts/<script_id>
```

### Update a Script

This request replaces the script's name, description and source, and recomputes its `checksum`. The new source is compiled first, and the request is rejected with `400` if it does not compile. Existing runs keep the checksum they were executed with. The response has the status `200 OK` and an empty body.

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mean-reading",
    "description": "Rounded average of all readings",
    "source": "import numpy as np\nvals = [r[\"v\"] for r in message[\"payload\"][\"readings\"]]\nround(float(np.mean(vals)), 2)"
  }' \
  https://localhost/svcpyscripts/scripts/<script_id>
```

### Remove Scripts

Up to 100 scripts can be removed in a single request. A script's runs are removed with it. The response has the status `204 No Content`.

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"script_ids": ["28fbd528-08e2-4cb0-b44d-87846f0697ca"]}' \
  https://localhost/svcpyscripts/scripts
```

## Running scripts

### Run a Script

The request body becomes the script's `message`. All fields are optional. `payload`, if given, must be a JSON object of at most 1 MiB, and `created` is an integer.

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {"readings": [{"v": 21}, {"v": 23.5}, {"v": 26}]},
    "subtopic": "sensors",
    "thing_id": "d126173e-b05d-4e60-a2ee-05a674157a12",
    "created": 1760000000000
  }' \
  https://localhost/svcpyscripts/scripts/<script_id>/run
```

```json
{
  "id": "d2072e08-003f-477b-a61e-f1cb4c3e8d9d",
  "script_id": "28fbd528-08e2-4cb0-b44d-87846f0697ca",
  "script_checksum": "78fe9da1e5bce23000ddea6566e31957b98e395c3b24078e05be42609faa0792",
  "status": "success",
  "return_value": 23.5,
  "logs": ["got 3 readings"],
  "started_at": "2026-10-14T08:46:11.794358Z",
  "finished_at": "2026-10-14T08:46:11.806112Z"
}
```

A failed script still returns `200 OK`. The response status tells script failures apart from service failures:

| Status | Cause                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `200`  | The script ran. If it raised an exception, exceeded a limit or returned a value that is not JSON-serializable, `status` is `fail` and the reason is in `error`. The run is recorded. |
| `429`  | The group or user exceeded the [rate limit](#rate-limiting)                                                                                                                          |
| `503`  | No worker became free within `MF_PYSCRIPTS_ACQUIRE_TIMEOUT` (`no python worker available`). The request is rejected rather than queued, so it can be retried.                        |
| `500`  | The runner failed for a reason outside the script                                                                                                                                    |

Creating and updating scripts also need a worker, so they can return `429` and `503` too.

If the client disconnects while the script is running, the run is stopped and recorded as failed with `run cancelled by the caller`.

### List Runs by Script

By default, runs are listed newest first.

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "https://localhost/svcpyscripts/scripts/<script_id>/runs?limit=5&order=started_at&dir=desc&status=fail"
```

| Parameter     | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `offset`      | Number of items to skip (default `0`)                             |
| `limit`       | Page size, up to 200 (default `10`)                               |
| `order`       | Sort field: `id`, `started_at` or `status` (default `started_at`) |
| `dir`         | Sort direction: `asc` or `desc` (default `desc`)                  |
| `status`      | Filter by status: `success` or `fail`                             |
| `from` / `to` | Filter by start time, as Unix timestamps in milliseconds          |

The `order` fields for runs are different from the ones for scripts.

### Remove Runs

Up to 100 runs can be removed in a single request. The response has the status `204 No Content`.

```bash
curl -s -S -i -X PATCH \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"run_ids": ["d2072e08-003f-477b-a61e-f1cb4c3e8d9d"]}' \
  https://localhost/svcpyscripts/runs
```

## Configuration

The service listens on port `9033` by default (`MF_PYSCRIPTS_HTTP_PORT`) and is exposed through nginx under `/svcpyscripts`. The worker pool is configured through the following environment variables, in addition to the [run limits](#sandbox-and-limits):

| Variable                       | Default   | Description                                                            |
| ------------------------------ | --------- | ---------------------------------------------------------------------- |
| `MF_PYSCRIPTS_PYTHON`          | `python3` | Python interpreter used for the workers                                |
| `MF_PYSCRIPTS_WORKERS`         | `2`       | Number of pre-warmed workers, and so the number of concurrent runs     |
| `MF_PYSCRIPTS_ACQUIRE_TIMEOUT` | `5s`      | How long a request waits for a free worker before returning `503`      |
| `MF_PYSCRIPTS_START_TIMEOUT`   | `60s`     | How long a worker may take to start                                    |
| `MF_PYSCRIPTS_BLAS_THREADS`    | `1`       | Number of BLAS/OpenMP threads per run                                  |

In Docker Compose, the container is read-only, drops all capabilities and is bounded by the following variables:

| Variable                   | Default | Description                       |
| -------------------------- | ------- | --------------------------------- |
| `MF_PYSCRIPTS_MEM_LIMIT`   | `1g`    | Container memory limit            |
| `MF_PYSCRIPTS_CPUS`        | `2`     | Container CPU limit               |
| `MF_PYSCRIPTS_PIDS_LIMIT`  | `512`   | Container process limit           |
| `MF_PYSCRIPTS_TMPFS_SIZE`  | `64m`   | Size of the `/tmp` tmpfs mount    |

Keep `MF_PYSCRIPTS_MEM_LIMIT` above `MF_PYSCRIPTS_WORKERS × (~120 MB + MF_PYSCRIPTS_MAX_MEMORY)` and below the memory available to Docker. If you change one of these three values, adjust the other two to match. If the container limit is too low, a single memory-heavy run can cause the kernel to kill processes in the whole container rather than only the run.

The service image is built from `docker/Dockerfile.python` (`make docker_pyscripts`). Python 3 with `numpy`, `pandas`, `pyseccomp` and `libseccomp` must be installed in the image. See the [Pyscripts service README](https://github.com/MainfluxLabs/mainflux/blob/master/pyscripts/README.md) for the full list of environment variables.

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
