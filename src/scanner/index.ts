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
