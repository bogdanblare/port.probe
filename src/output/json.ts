import type { PortResult } from "../types.js";

export function formatJson(results: PortResult[]): string {
  return JSON.stringify({ ports: results }, null, 2);
}
