# Cockpit access and CLI contract

Observed from installed CLI help in September 2026. Recheck live help before acting; these are examples, not permanent version guarantees.

## User intent

A repository URL answers where the source lives, not how to open the application. For requests such as “el link para poderlo ejecutar” or “cómo lo uso”, provide the verified cockpit URL and minimal usage instructions. A public repository does not imply a hosted public app.

## Glance behavior

`nrv glance --help` reported:
- `nrv glance`: local cockpit, actions enabled, opens browser.
- `--no-open`: run without opening browser.
- `--read-only`: disable write endpoints and execution.
- `--port <port>`: select a fixed port instead of automatic selection.
- `--idle-min <minutes>`: idle timeout; observed default was 30 minutes.
- Project context detected from cwd, walking upward for `.env`, `.nirvana`, or `.git`.
- Binding is to `127.0.0.1`; access is local to that host.

Start a long-lived server through the terminal tool's managed background mode. Do not use shell detachment. A running PID alone is not readiness: poll logs for the URL and check HTTP.

If logs are empty, inspect listening sockets with `lsof -nP -iTCP -sTCP:LISTEN` and correlate the listener with the launched process/child. Do not assume every Bun listener is this application. Avoid unnecessary pipes to an interpreter for filtering.

Verify the discovered address, for example:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:<observed-port>
```

A successful response establishes reachability, not a full functional test. Return the actual URL; never persist a session port as configuration.

## Execution distinction

Installed `nrv --help` reported:

```text
dispatch <business> "<brief>"  Scaffold a run (no execution)
run <business> "<brief>"       Dispatch + execute + verify + gate
auto "<brief>"                 Execute with automatically selected business
ask <clone> [question]         Consult one mind-clone
```

Older bridge prose advertised `dispatch "<brief>"` as full execution and `ask "<question>"` without a clone. Prefer current command help. Do not promise output creation based only on successful scaffolding.

## Delivery check

- Requested access URL, not merely source repository, supplied.
- Actual server address discovered and checked.
- Local-only versus publicly shareable explained.
- Project context deliberate.
- No production task dispatched merely because cockpit access was requested.
