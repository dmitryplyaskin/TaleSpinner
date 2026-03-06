import { defineConfig } from "drizzle-kit";

import { loadBackendEnvOnce } from "./src/config/load-backend-env";
import { resolveDbPath } from "./src/config/path-resolver";

loadBackendEnvOnce();

const dbPath = resolveDbPath();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
  verbose: true,
  strict: true,
});
