import type { TaskSkipReason } from "./types";

type TaskSkipError = Error & {
  code: "ORCHESTRATOR_TASK_SKIP";
  reason: TaskSkipReason;
};

export function createTaskSkip(reason: TaskSkipReason, message?: string): TaskSkipError {
  const error = new Error(message ?? reason) as TaskSkipError;
  error.code = "ORCHESTRATOR_TASK_SKIP";
  error.reason = reason;
  return error;
}

export function isTaskSkipError(error: unknown): error is TaskSkipError {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; reason?: unknown };
  return candidate.code === "ORCHESTRATOR_TASK_SKIP" && typeof candidate.reason === "string";
}
