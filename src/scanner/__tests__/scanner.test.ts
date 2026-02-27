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
