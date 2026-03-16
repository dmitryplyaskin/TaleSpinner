import { RuntimeError, type RuntimeErrorCode } from "../types";

export function runtimeError(
  code: RuntimeErrorCode,
  message: string,
  details?: Record<string, unknown>
): RuntimeError {
  return new RuntimeError(code, message, details);
}
