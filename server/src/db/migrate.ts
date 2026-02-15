import { loadBackendEnvOnce } from "../config/load-backend-env";

loadBackendEnvOnce();

async function main(): Promise<void> {
  const { applyMigrations, resolveMigrationsFolder } = await import("./apply-migrations");
  await applyMigrations();
  console.log(`Migrations applied from: ${resolveMigrationsFolder()}`);
}

main().catch((error) => {
  console.error("DB migration failed:", error);
  process.exitCode = 1;
});

