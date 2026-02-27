import { describe, it, expect } from "vitest";
import { checkTcp } from "../tcp.js";
import net from "node:net";

describe("checkTcp", () => {
  it("returns 'up' for an open port", async () => {
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
