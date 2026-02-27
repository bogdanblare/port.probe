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
