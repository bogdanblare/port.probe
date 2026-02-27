# portprobe — Design Document

## What

CLI tool for instant diagnostics of the local dev environment.
One command — full map: which ports are busy, by which processes, are services alive, what's broken and why.

Output: JSON for AI agents or human-readable table.

## Stack

- **Runtime:** Node.js (TypeScript)
- **Distribution:** npm (`npx portprobe` or `npm i -g portprobe`)
- **License:** MIT
- **Platforms:** macOS, Linux, Windows

## Usage Examples

```bash
# Scan common dev ports
$ portprobe
 PORT  | PID   | PROCESS        | STATUS | LATENCY | PROTO
 3000  | 12841 | node (next)    | UP     | 2ms     | HTTP 200
 5432  | 1023  | postgres       | UP     | 1ms     | TCP
 6379  | 1087  | redis-server   | UP     | <1ms    | TCP
 8080  | -     | -              | FREE   | -       | -

# JSON output for AI agents
$ portprobe --json
{"ports":[{"port":3000,"pid":12841,"process":"node","status":"up",...}]}

# Check specific port
$ portprobe 3000
Port 3000: node (PID 12841), HTTP 200, latency 2ms

# Scan range
$ portprobe --range 3000-9000
```

## MVP Scope (v0.1.0)

1. Scan common dev ports (3000, 3001, 4200, 5000, 5173, 5432, 6379, 8000, 8080, 8443, 9000, 27017)
2. For each busy port: resolve PID + process name
3. TCP health check (port open/closed)
4. HTTP health check (GET -> status code, latency)
5. `--json` flag for AI-agent-friendly output
6. `--port <N>` check specific port
7. `--range <from>-<to>` scan port range
8. Works on macOS + Linux (Windows best-effort)

## Future Phases

### v0.2.0 — Smart Diagnostics
- Auto-detect service type (PostgreSQL, Redis, MySQL, MongoDB, Nginx...)
- Docker container awareness (mapped ports, container status)
- `--watch` mode (realtime monitoring)
- `--wait <port>` (wait until port becomes available, useful for CI/scripts)
- Full Windows support

### v0.3.0 — AI Integration
- `--diagnose` flag (problem analysis + recommendations)
- `--project` flag (reads docker-compose/package.json, checks if all required services are up)
- `.portprobe.yaml` project config

### v1.0.0 — Ecosystem
- Plugin system for custom health checks
- GitHub Action
- Homebrew formula

## Project Structure

```
portprobe/
├── src/
│   ├── index.ts              # entry point + CLI parsing
│   ├── scanner/
│   │   ├── ports.ts          # port scanning
│   │   └── process.ts        # PID -> process info
│   ├── health/
│   │   ├── tcp.ts            # TCP health check
│   │   └── http.ts           # HTTP health check
│   ├── output/
│   │   ├── table.ts          # human-readable table
│   │   └── json.ts           # JSON output
│   └── constants.ts          # default ports, timeouts
├── bin/
│   └── portprobe.js          # bin entry (#!/usr/bin/env node)
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Distribution

| Method | Command |
|--------|---------|
| npx (zero install) | `npx portprobe` |
| Global install | `npm i -g portprobe` |
| Homebrew (later) | `brew install portprobe` |

## How Claude Code Uses It

### Option A: CLAUDE.md recommendation
```
If portprobe is installed, use `portprobe --json` to diagnose port/service issues.
```

## Go-to-Market

1. Publish to npm
2. README with screenshots/GIF demo
3. Post to r/commandline, r/node, r/webdev
4. Submit to Hacker News (Show HN)
5. Add to awesome-claude-code and awesome-mcp-servers lists
