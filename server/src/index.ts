import { loadBackendEnvOnce } from "./config/load-backend-env";
import { structuredLogger } from "./core/logging/structured-logger";

loadBackendEnvOnce();

const DEFAULT_PORT = 5000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

function resolvePort(rawPort: string | undefined): number {
  const normalized = rawPort?.trim();
  if (!normalized) return DEFAULT_PORT;

  if (!/^\d+$/.test(normalized)) {
    console.warn(`Invalid PORT value "${normalized}". Falling back to ${DEFAULT_PORT}.`);
    return DEFAULT_PORT;
  }

  const parsedPort = Number(normalized);
  if (!Number.isInteger(parsedPort) || parsedPort < MIN_PORT || parsedPort > MAX_PORT) {
    console.warn(`Invalid PORT value "${normalized}". Falling back to ${DEFAULT_PORT}.`);
    return DEFAULT_PORT;
  }

  return parsedPort;
}

async function main(): Promise<void> {
  const { startAppServer } = await import("./app");
  const port = resolvePort(process.env.PORT);
  await startAppServer({ port });
  structuredLogger.info("server.started", {
    event: "server.started",
    port,
  });
}

main().catch((error) => {
  structuredLogger.error("server.bootstrap_failed", {
    event: "server.bootstrap_failed",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
