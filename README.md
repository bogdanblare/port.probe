# devprobe

**Instant diagnostics for your local dev environment.** One command — see every listening port, which process owns it, and whether it responds.

[![npm](https://img.shields.io/npm/v/devprobe)](https://www.npmjs.com/package/devprobe)
[![license](https://img.shields.io/npm/l/devprobe)](LICENSE)

---

```bash
$ npx devprobe

 PORT  | PID   | PROCESS          | STATUS | LATENCY | PROTO
-------|-------|------------------|--------|---------|--------
 3000  | 12841 | node             | UP     | 2ms     | HTTP 200
 5432  | 1023  | postgres         | UP     | 1ms     | TCP
 5500  | 9912  | node             | UP     | 1ms     | HTTP 200
 6379  | 1087  | redis-server     | UP     | <1ms    | TCP
 8080  | 5523  | java             | UP     | 12ms    | HTTP 200
 24282 | 3301  | python           | UP     | 3ms     | HTTP 404
```

No config. No port lists to maintain. It asks the OS directly what's listening.

## Why

- `EADDRINUSE` — what's using port 3000? Now you know instantly
- **AI agents** (Claude Code, Cursor, etc.) waste tokens running `lsof`, parsing output, retrying — `devprobe --json` gives them structured data in one call
- **Zero guesswork** — shows ALL listening ports, not just a predefined list

## Install

```bash
npx devprobe            # run without installing
npm i -g devprobe       # or install globally
```

## Usage

```bash
devprobe                # show all listening ports
devprobe 3000           # check specific port
devprobe --range 3000-9000   # scan a range
devprobe --json         # JSON output (for scripts & AI agents)
devprobe --timeout 2000 # custom timeout in ms
```

### Flags

| Flag | Description | Default |
|---|---|---|
| `[port]` | Check a single port | — |
| `--json` | Output as JSON | `false` |
| `--range <from-to>` | Scan a port range | — |
| `--timeout <ms>` | Connection timeout in ms | `1000` |
| `--version` | Show version | — |
| `--help` | Show help | — |

## For AI Agents

`devprobe --json` returns structured data that any AI coding agent can parse:

```json
{
  "ports": [
    {
      "port": 3000,
      "status": "up",
      "pid": 12841,
      "process": "node",
      "latency": 2,
      "protocol": "HTTP 200"
    }
  ]
}
```

Add to your project's `CLAUDE.md` or agent config:
```
Use `devprobe --json` to diagnose port conflicts instead of lsof/netstat.
```

## Platforms

- **macOS** — full support (`lsof`)
- **Linux** — full support (`lsof`)
- **Windows** — best-effort (`netstat`)

## Roadmap

- [ ] `--watch` — realtime monitoring
- [ ] `--wait <port>` — wait until port is available
- [ ] `--diagnose` — problem analysis + recommendations
- [ ] Auto-detect service type (PostgreSQL, Redis, MySQL, etc.)
- [ ] Docker container awareness

## Support the project

If devprobe saved you time, consider:

- Star this repo — it helps others find it
- [Sponsor on GitHub](https://github.com/sponsors/bogdanblare) — support development directly
- Share with your team — the more users, the better it gets

## License

MIT
