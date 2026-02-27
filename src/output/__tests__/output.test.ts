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
