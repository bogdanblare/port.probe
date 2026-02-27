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
