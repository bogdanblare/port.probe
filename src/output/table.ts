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
