import { startGateway } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const gateway = startGateway(config);

console.log(`Gateway listening on port ${gateway.server.port}`);

// Same style as the other repos: say at start whether the backend answers.
try {
  const response = await fetch(`${config.backendUrl}/healthz`, {
    headers: { "x-internal-key": config.internalKey },
    signal: AbortSignal.timeout(3000),
  });
  if (response.status === 401) {
    console.warn("Backend refused the internal key: check INTERNAL_API_KEY");
  } else {
    console.log(`Backend reachable (HTTP ${response.status})`);
  }
} catch (error) {
  console.warn(`Backend unreachable: ${(error as Error).name}`);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    gateway.stop();
    process.exit(0);
  });
}
