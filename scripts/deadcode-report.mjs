import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "deadcode-reports");

const tasks = [
  {
    id: "server-ts-prune",
    command: "npx",
    args: ["--yes", "ts-prune", "-p", "server/tsconfig.json"],
  },
  {
    id: "web-ts-prune",
    command: "npx",
    args: ["--yes", "ts-prune", "-p", "web/tsconfig.app.json"],
  },
  {
    id: "server-madge-orphans",
    command: "npx",
    args: [
      "--yes",
      "madge",
      "--extensions",
      "ts",
      "--ts-config",
      "server/tsconfig.json",
      "--orphans",
      "server/src",
    ],
  },
  {
    id: "web-madge-orphans",
    command: "npx",
    args: [
      "--yes",
      "madge",
      "--extensions",
      "ts,tsx",
      "--ts-config",
      "web/tsconfig.app.json",
      "--orphans",
      "web/src/main.tsx",
    ],
  },
];

function runTask(task) {
  const result = spawnSync(task.command, task.args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 20 * 1024 * 1024,
  });

  return {
    ...task,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error) : "",
  };
}

function formatTaskOutput(taskResult) {
  const commandLine = [taskResult.command, ...taskResult.args].join(" ");
  return [
    `# ${taskResult.id}`,
    "",
    `Command: \`${commandLine}\``,
    `Exit code: ${taskResult.exitCode}`,
    "",
    "## stdout",
    "```text",
    taskResult.stdout.trimEnd(),
    "```",
    "",
    "## stderr",
    "```text",
    taskResult.stderr.trimEnd(),
    "```",
    "",
    taskResult.error ? `Error: ${taskResult.error}` : "Error: none",
    "",
  ].join("\n");
}

async function main() {
  await mkdir(reportsDir, { recursive: true });

  const results = tasks.map(runTask);

  for (const result of results) {
    const output = formatTaskOutput(result);
    await writeFile(path.join(reportsDir, `${result.id}.md`), output, "utf8");
  }

  const summary = [
    "# Dead Code Report Summary",
    "",
    ...results.map(
      (result) =>
        `- \`${result.id}\`: exit ${result.exitCode} ([details](./${result.id}.md))`
    ),
    "",
  ].join("\n");

  await writeFile(path.join(reportsDir, "summary.md"), summary, "utf8");
  console.log(`Dead code reports generated in ${reportsDir}`);
}

main().catch(async (error) => {
  await mkdir(reportsDir, { recursive: true });
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  await writeFile(path.join(reportsDir, "fatal-error.log"), message, "utf8");
  console.error(message);
  process.exitCode = 0;
});
