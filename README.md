# portprobe

Instant port diagnostics for your local dev environment.

## Why

Every developer has hit it: you start a server and get `EADDRINUSE`, then spend minutes figuring out what's hogging the port. AI coding agents like Claude Code hit the same wall -- they burn tokens retrying commands and guessing what went wrong.

portprobe scans common dev ports in parallel, shows what's listening, which process owns it, and whether it responds to HTTP. One command, zero guesswork.

## Quick start

Run without installing:

```bash
npx portprobe
```

Or install globally:

```bash
npm i -g portprobe
```

## Usage

### Default scan

Scans common dev ports (3000, 3001, 4200, 5000, 5173, 5432, 6379, 8000, 8080, 8443, 9000, 27017) and prints a table:

```bash
portprobe
```

### JSON output

Machine-readable output for scripts and AI agents:

```bash
portprobe --json
```

### Single port check

Check whether a specific port is in use:

```bash
portprobe 3000
```

### Range scan

Scan a custom range of ports:

```bash
portprobe --range 3000-9000
```

### Custom timeout

Set the TCP connection timeout in milliseconds (default: 1000):

```bash
portprobe --timeout 2000
```

## Flags

| Flag | Description | Default |
|---|---|---|
| `[port]` | Check a single port | — |
| `--json` | Output as JSON | `false` |
| `--range <from-to>` | Scan a port range (e.g. `3000-9000`) | — |
| `--timeout <ms>` | Connection timeout in ms | `1000` |
| `--version` | Show version | — |
| `--help` | Show help | — |

## AI Agent integration

portprobe is designed to work well with AI coding agents. Use `--json` to get structured output that an agent can parse directly:

```bash
portprobe --json
```

Returns an array of results:

```json
[
  {
    "port": 3000,
    "status": "up",
    "pid": 12345,
    "process": "node",
    "latency": 2,
    "protocol": "http"
  },
  {
    "port": 5432,
    "status": "up",
    "pid": 501,
    "process": "postgres",
    "latency": 1,
    "protocol": null
  },
  {
    "port": 8080,
    "status": "free",
    "pid": null,
    "process": null,
    "latency": null,
    "protocol": null
  }
]
```

An agent can run `npx portprobe --json` before starting a dev server to pick an open port or diagnose a conflict without trial and error.

## Platforms

- **macOS** — full support (uses `lsof` for process resolution)
- **Linux** — full support (uses `lsof` for process resolution)
- **Windows** — best-effort (uses `netstat` for process resolution)

## License

MIT
