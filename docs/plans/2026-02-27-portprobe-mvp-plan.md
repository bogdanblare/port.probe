# portprobe MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool that scans local dev ports, resolves which process owns each port, runs health checks, and outputs results as a table or JSON.

**Architecture:** Single CLI entry point parses args via `commander`, calls scanner module (net.connect for TCP, http.get for HTTP), resolves PIDs via platform-specific commands (lsof on macOS/Linux), and formats output as table or JSON. All async, runs in parallel for speed.

**Tech Stack:** TypeScript, Node.js (>=18), commander (CLI), vitest (tests), tsup (build)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts` (placeholder)
- Create: `bin/portprobe.js`
- Create: `LICENSE`

**Step 1: Initialize project**

```bash
cd /Users/blare/Documents/asper/portprobe
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install commander chalk
npm install -D typescript vitest tsup @types/node
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create bin/portprobe.js**

```js
#!/usr/bin/env node
import '../dist/index.js';
```

**Step 5: Update package.json**

Add fields:
```json
{
  "name": "portprobe",
  "version": "0.1.0",
  "description": "Instant diagnostics for your local dev environment",
  "type": "module",
  "bin": {
    "portprobe": "./bin/portprobe.js"
  },
  "main": "dist/index.js",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["port", "scanner", "devtools", "cli", "diagnostics"],
  "license": "MIT"
}
```

**Step 6: Create placeholder src/index.ts**

```ts
console.log("portprobe v0.1.0");
```

**Step 7: Create MIT LICENSE**

**Step 8: Verify build works**

Run: `npm run build && node bin/portprobe.js`
Expected: prints "portprobe v0.1.0"

**Step 9: Init git and commit**

```bash
git init
# create .gitignore with node_modules/ and dist/
git add -A
git commit -m "chore: scaffold portprobe project"
```

---

### Task 2: Constants & Types

**Files:**
- Create: `src/constants.ts`
- Create: `src/types.ts`

**Step 1: Write types**

```ts
// src/types.ts
export interface PortResult {
  port: number;
  status: "up" | "free" | "refused" | "timeout";
  pid: number | null;
  process: string | null;
  latency: number | null;
  protocol: string | null;
}

export interface ScanOptions {
  ports?: number[];
  range?: { from: number; to: number };
  json?: boolean;
  timeout?: number;
}
```

**Step 2: Write constants**

```ts
// src/constants.ts
export const DEFAULT_PORTS = [
  3000, 3001, 4200, 5000, 5173,
  5432, 6379, 8000, 8080, 8443,
  9000, 27017,
];

export const DEFAULT_TIMEOUT = 1000; // ms
```

**Step 3: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add types and constants"
```

---

### Task 3: TCP Port Scanner

**Files:**
- Create: `src/scanner/tcp.ts`
- Create: `src/scanner/__tests__/tcp.test.ts`

**Step 1: Write failing test**

```ts
// src/scanner/__tests__/tcp.test.ts
import { describe, it, expect } from "vitest";
import { checkTcp } from "../tcp.js";
import net from "node:net";

describe("checkTcp", () => {
  it("returns 'up' for an open port", async () => {
    // Start a temporary server
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as net.AddressInfo).port;

    const result = await checkTcp(port, 1000);
    expect(result.status).toBe("up");
    expect(result.latency).toBeGreaterThanOrEqual(0);

    server.close();
  });

  it("returns 'free' for a closed port", async () => {
    const result = await checkTcp(19999, 500);
    expect(result.status).toBe("free");
    expect(result.latency).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/scanner/__tests__/tcp.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement TCP scanner**

```ts
// src/scanner/tcp.ts
import net from "node:net";

interface TcpResult {
  status: "up" | "free" | "refused" | "timeout";
  latency: number | null;
}

export function checkTcp(port: number, timeout: number): Promise<TcpResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const latency = Math.round(performance.now() - start);
      socket.destroy();
      resolve({ status: "up", latency });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ status: "timeout", latency: null });
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      socket.destroy();
      if (err.code === "ECONNREFUSED") {
        resolve({ status: "free", latency: null });
      } else {
        resolve({ status: "free", latency: null });
      }
    });

    socket.connect(port, "127.0.0.1");
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/scanner/__tests__/tcp.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scanner/
git commit -m "feat: add TCP port scanner with tests"
```

---

### Task 4: Process Resolver

**Files:**
- Create: `src/scanner/process.ts`
- Create: `src/scanner/__tests__/process.test.ts`

**Step 1: Write failing test**

```ts
// src/scanner/__tests__/process.test.ts
import { describe, it, expect } from "vitest";
import { resolveProcess } from "../process.js";
import net from "node:net";

describe("resolveProcess", () => {
  it("resolves PID and process name for an open port", async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as net.AddressInfo).port;

    const result = await resolveProcess(port);
    expect(result.pid).toBe(process.pid);
    expect(result.name).toBeTruthy();

    server.close();
  });

  it("returns null for a port with no process", async () => {
    const result = await resolveProcess(19999);
    expect(result.pid).toBeNull();
    expect(result.name).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/scanner/__tests__/process.test.ts`
Expected: FAIL

**Step 3: Implement process resolver**

```ts
// src/scanner/process.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface ProcessInfo {
  pid: number | null;
  name: string | null;
}

export async function resolveProcess(port: number): Promise<ProcessInfo> {
  try {
    if (process.platform === "win32") {
      return resolveWindows(port);
    }
    return resolveUnix(port);
  } catch {
    return { pid: null, name: null };
  }
}

async function resolveUnix(port: number): Promise<ProcessInfo> {
  try {
    const { stdout } = await execFileAsync("lsof", [
      "-i", `:${port}`,
      "-sTCP:LISTEN",
      "-P", "-n",
      "-Fp",
    ]);
    const pidLine = stdout.split("\n").find((l) => l.startsWith("p"));
    if (!pidLine) return { pid: null, name: null };

    const pid = parseInt(pidLine.slice(1), 10);
    const name = await getProcessName(pid);
    return { pid, name };
  } catch {
    return { pid: null, name: null };
  }
}

async function resolveWindows(port: number): Promise<ProcessInfo> {
  try {
    const { stdout } = await execFileAsync("netstat", ["-ano"]);
    const line = stdout.split("\n").find((l) =>
      l.includes(`:${port}`) && l.includes("LISTENING")
    );
    if (!line) return { pid: null, name: null };

    const parts = line.trim().split(/\s+/);
    const pid = parseInt(parts[parts.length - 1], 10);
    const name = await getProcessName(pid);
    return { pid, name };
  } catch {
    return { pid: null, name: null };
  }
}

async function getProcessName(pid: number): Promise<string | null> {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execFileAsync("tasklist", [
        "/FI", `PID eq ${pid}`,
        "/FO", "CSV",
        "/NH",
      ]);
      const match = stdout.match(/"([^"]+)"/);
      return match ? match[1] : null;
    }
    const { stdout } = await execFileAsync("ps", ["-p", String(pid), "-o", "comm="]);
    return stdout.trim().split("/").pop() || null;
  } catch {
    return null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/scanner/__tests__/process.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scanner/
git commit -m "feat: add process resolver (lsof/netstat)"
```

---

### Task 5: HTTP Health Check

**Files:**
- Create: `src/health/http.ts`
- Create: `src/health/__tests__/http.test.ts`

**Step 1: Write failing test**

```ts
// src/health/__tests__/http.test.ts
import { describe, it, expect } from "vitest";
import { checkHttp } from "../http.js";
import http from "node:http";

describe("checkHttp", () => {
  it("returns status code and latency for HTTP server", async () => {
    const server = http.createServer((_, res) => {
      res.writeHead(200);
      res.end("ok");
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as import("node:net").AddressInfo).port;

    const result = await checkHttp(port, 1000);
    expect(result.protocol).toBe("HTTP 200");
    expect(result.latency).toBeGreaterThanOrEqual(0);

    server.close();
  });

  it("returns null for non-HTTP port", async () => {
    const result = await checkHttp(19999, 500);
    expect(result.protocol).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/health/__tests__/http.test.ts`
Expected: FAIL

**Step 3: Implement HTTP check**

```ts
// src/health/http.ts
import http from "node:http";

interface HttpResult {
  protocol: string | null;
  latency: number | null;
}

export function checkHttp(port: number, timeout: number): Promise<HttpResult> {
  return new Promise((resolve) => {
    const start = performance.now();

    const req = http.get(
      { hostname: "127.0.0.1", port, timeout, path: "/" },
      (res) => {
        const latency = Math.round(performance.now() - start);
        res.resume(); // drain
        resolve({ protocol: `HTTP ${res.statusCode}`, latency });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ protocol: null, latency: null });
    });

    req.on("error", () => {
      resolve({ protocol: null, latency: null });
    });
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/health/__tests__/http.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/health/
git commit -m "feat: add HTTP health check with tests"
```

---

### Task 6: Main Scanner (Orchestrator)

**Files:**
- Create: `src/scanner/index.ts`
- Create: `src/scanner/__tests__/scanner.test.ts`

**Step 1: Write failing test**

```ts
// src/scanner/__tests__/scanner.test.ts
import { describe, it, expect } from "vitest";
import { scanPorts } from "../index.js";
import net from "node:net";

describe("scanPorts", () => {
  it("detects an open TCP server", async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as net.AddressInfo).port;

    const results = await scanPorts({ ports: [port] });
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("up");
    expect(results[0].port).toBe(port);

    server.close();
  });

  it("detects a free port", async () => {
    const results = await scanPorts({ ports: [19999] });
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("free");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/scanner/__tests__/scanner.test.ts`
Expected: FAIL

**Step 3: Implement orchestrator**

```ts
// src/scanner/index.ts
import { checkTcp } from "./tcp.js";
import { resolveProcess } from "./process.js";
import { checkHttp } from "../health/http.js";
import { DEFAULT_TIMEOUT } from "../constants.js";
import type { PortResult, ScanOptions } from "../types.js";

export async function scanPorts(options: ScanOptions): Promise<PortResult[]> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const ports = resolvePorts(options);

  const results = await Promise.all(
    ports.map((port) => scanSinglePort(port, timeout))
  );

  return results;
}

function resolvePorts(options: ScanOptions): number[] {
  if (options.ports && options.ports.length > 0) return options.ports;
  if (options.range) {
    const ports: number[] = [];
    for (let p = options.range.from; p <= options.range.to; p++) {
      ports.push(p);
    }
    return ports;
  }
  return [];
}

async function scanSinglePort(port: number, timeout: number): Promise<PortResult> {
  const tcp = await checkTcp(port, timeout);

  if (tcp.status !== "up") {
    return {
      port,
      status: tcp.status,
      pid: null,
      process: null,
      latency: null,
      protocol: null,
    };
  }

  const [proc, httpResult] = await Promise.all([
    resolveProcess(port),
    checkHttp(port, timeout),
  ]);

  return {
    port,
    status: "up",
    pid: proc.pid,
    process: proc.name,
    latency: httpResult.latency ?? tcp.latency,
    protocol: httpResult.protocol ?? "TCP",
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/scanner/__tests__/scanner.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scanner/index.ts src/scanner/__tests__/scanner.test.ts
git commit -m "feat: add main scanner orchestrator"
```

---

### Task 7: Output Formatters

**Files:**
- Create: `src/output/table.ts`
- Create: `src/output/json.ts`
- Create: `src/output/__tests__/output.test.ts`

**Step 1: Write failing tests**

```ts
// src/output/__tests__/output.test.ts
import { describe, it, expect } from "vitest";
import { formatTable } from "../table.js";
import { formatJson } from "../json.js";
import type { PortResult } from "../../types.js";

const mockResults: PortResult[] = [
  { port: 3000, status: "up", pid: 123, process: "node", latency: 2, protocol: "HTTP 200" },
  { port: 8080, status: "free", pid: null, process: null, latency: null, protocol: null },
];

describe("formatTable", () => {
  it("renders a table with correct columns", () => {
    const output = formatTable(mockResults);
    expect(output).toContain("3000");
    expect(output).toContain("node");
    expect(output).toContain("UP");
    expect(output).toContain("FREE");
  });
});

describe("formatJson", () => {
  it("returns valid JSON with ports array", () => {
    const output = formatJson(mockResults);
    const parsed = JSON.parse(output);
    expect(parsed.ports).toHaveLength(2);
    expect(parsed.ports[0].port).toBe(3000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/output/__tests__/output.test.ts`
Expected: FAIL

**Step 3: Implement JSON formatter**

```ts
// src/output/json.ts
import type { PortResult } from "../types.js";

export function formatJson(results: PortResult[]): string {
  return JSON.stringify({ ports: results }, null, 2);
}
```

**Step 4: Implement table formatter**

```ts
// src/output/table.ts
import type { PortResult } from "../types.js";

export function formatTable(results: PortResult[]): string {
  const header = " PORT  | PID     | PROCESS          | STATUS  | LATENCY | PROTO";
  const sep =    "-------|---------|------------------|---------|---------|--------";

  const rows = results.map((r) => {
    const port = String(r.port).padEnd(5);
    const pid = r.pid ? String(r.pid).padEnd(7) : "-".padEnd(7);
    const proc = (r.process ?? "-").padEnd(16);
    const status = r.status === "up" ? "UP".padEnd(7) : "FREE".padEnd(7);
    const latency = r.latency !== null ? `${r.latency}ms`.padEnd(7) : "-".padEnd(7);
    const proto = r.protocol ?? "-";
    return ` ${port} | ${pid} | ${proc} | ${status} | ${latency} | ${proto}`;
  });

  return [header, sep, ...rows].join("\n");
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/output/__tests__/output.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/output/
git commit -m "feat: add table and JSON output formatters"
```

---

### Task 8: CLI Entry Point

**Files:**
- Modify: `src/index.ts`

**Step 1: Implement CLI with commander**

```ts
// src/index.ts
import { program } from "commander";
import { scanPorts } from "./scanner/index.js";
import { formatTable } from "./output/table.js";
import { formatJson } from "./output/json.js";
import { DEFAULT_PORTS, DEFAULT_TIMEOUT } from "./constants.js";

program
  .name("portprobe")
  .description("Instant diagnostics for your local dev environment")
  .version("0.1.0")
  .argument("[port]", "specific port to check", parseInt)
  .option("--json", "output as JSON (for AI agents)")
  .option("--range <from-to>", "scan port range (e.g. 3000-9000)")
  .option("--timeout <ms>", "connection timeout in ms", parseInt)
  .action(async (port, options) => {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    let ports: number[] | undefined;
    let range: { from: number; to: number } | undefined;

    if (port) {
      ports = [port];
    } else if (options.range) {
      const [from, to] = options.range.split("-").map(Number);
      range = { from, to };
    } else {
      ports = DEFAULT_PORTS;
    }

    const results = await scanPorts({ ports, range, timeout });

    if (options.json) {
      console.log(formatJson(results));
    } else {
      console.log(formatTable(results));
    }
  });

program.parse();
```

**Step 2: Build and test manually**

Run: `npm run build && node bin/portprobe.js`
Expected: table output with default ports scanned

Run: `npm run build && node bin/portprobe.js --json`
Expected: JSON output

Run: `npm run build && node bin/portprobe.js 3000`
Expected: single port result

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point with commander"
```

---

### Task 9: Run All Tests, Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: all tests pass

**Step 2: Build and run end-to-end**

Run: `npm run build && node bin/portprobe.js`

**Step 3: Test JSON output**

Run: `npm run build && node bin/portprobe.js --json`

**Step 4: Test specific port**

Run: `npm run build && node bin/portprobe.js 8080`

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final MVP polish"
```

---

### Task 10: README & Publish Prep

**Files:**
- Create: `README.md`
- Modify: `package.json` (finalize metadata)
- Create: `.npmignore`

**Step 1: Write README.md**

Include: what it is, install, usage examples (table + json), flags, roadmap link.

**Step 2: Create .npmignore**

```
src/
docs/
*.test.ts
tsconfig.json
.github/
```

**Step 3: Finalize package.json metadata**

Add: repository, homepage, author, engines (>=18), files field.

**Step 4: Commit**

```bash
git add -A
git commit -m "docs: add README and publish prep"
```

---
