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
