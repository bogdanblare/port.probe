import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface ProcessInfo {
  pid: number | null;
  name: string | null;
}

export async function resolveProcess(port: number): Promise<ProcessInfo> {
  try {
    if (process.platform === "win32") {
      return resolveWindows(port);
    }
    return resolveUnix(port);
  } catch {
    return { pid: null, name: null };
  }
}

async function resolveUnix(port: number): Promise<ProcessInfo> {
  try {
    const { stdout } = await execFileAsync("lsof", [
      "-i", `:${port}`,
      "-sTCP:LISTEN",
      "-P", "-n",
      "-Fp",
    ]);
    const pidLine = stdout.split("\n").find((l) => l.startsWith("p"));
    if (!pidLine) return { pid: null, name: null };

    const pid = parseInt(pidLine.slice(1), 10);
    const name = await getProcessName(pid);
    return { pid, name };
  } catch {
    return { pid: null, name: null };
  }
}

async function resolveWindows(port: number): Promise<ProcessInfo> {
  try {
    const { stdout } = await execFileAsync("netstat", ["-ano"]);
    const line = stdout.split("\n").find((l) =>
      l.includes(`:${port}`) && l.includes("LISTENING")
    );
    if (!line) return { pid: null, name: null };

    const parts = line.trim().split(/\s+/);
    const pid = parseInt(parts[parts.length - 1], 10);
    const name = await getProcessName(pid);
    return { pid, name };
  } catch {
    return { pid: null, name: null };
  }
}

async function getProcessName(pid: number): Promise<string | null> {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execFileAsync("tasklist", [
        "/FI", `PID eq ${pid}`,
        "/FO", "CSV",
        "/NH",
      ]);
      const match = stdout.match(/"([^"]+)"/);
      return match ? match[1] : null;
    }
    const { stdout } = await execFileAsync("ps", ["-p", String(pid), "-o", "comm="]);
    return stdout.trim().split("/").pop() || null;
  } catch {
    return null;
  }
}
