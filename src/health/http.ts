import http from "node:http";

interface HttpResult {
  protocol: string | null;
  latency: number | null;
}

export function checkHttp(port: number, timeout: number): Promise<HttpResult> {
  return new Promise((resolve) => {
    const start = performance.now();

    const req = http.get(
      { hostname: "127.0.0.1", port, timeout, path: "/" },
      (res) => {
        const latency = Math.round(performance.now() - start);
        res.resume(); // drain
        resolve({ protocol: `HTTP ${res.statusCode}`, latency });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ protocol: null, latency: null });
    });

    req.on("error", () => {
      resolve({ protocol: null, latency: null });
    });
  });
}
