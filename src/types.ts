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
