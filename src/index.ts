import { program } from "commander";
import { scanPorts } from "./scanner/index.js";
import { formatTable } from "./output/table.js";
import { formatJson } from "./output/json.js";
import { DEFAULT_PORTS, DEFAULT_TIMEOUT } from "./constants.js";

program
  .name("portprobe")
  .description("Instant diagnostics for your local dev environment")
  .version("0.1.0")
  .argument("[port]", "specific port to check", parseInt)
  .option("--json", "output as JSON (for AI agents)")
  .option("--range <from-to>", "scan port range (e.g. 3000-9000)")
  .option("--timeout <ms>", "connection timeout in ms", parseInt)
  .action(async (port, options) => {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    let ports: number[] | undefined;
    let range: { from: number; to: number } | undefined;

    if (port) {
      ports = [port];
    } else if (options.range) {
      const [from, to] = options.range.split("-").map(Number);
      range = { from, to };
    } else {
      ports = DEFAULT_PORTS;
    }

    const results = await scanPorts({ ports, range, timeout });

    if (options.json) {
      console.log(formatJson(results));
    } else {
      console.log(formatTable(results));
    }
  });

program.parse();
