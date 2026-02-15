import { resolveDataDirPath } from "./config/path-resolver";

export function getDataRootPath(): string {
  return resolveDataDirPath();
}

export const DATA_PATH = getDataRootPath();
