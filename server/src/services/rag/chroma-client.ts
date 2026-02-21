import { ChromaClient } from "chromadb";

import { getChromaConfig } from "../../config/chroma-config";
import { HttpError } from "../../core/middleware/error-handler";

type ChromaPrimitive = string | number | boolean | null;

export type ChromaMetadata = Record<string, ChromaPrimitive>;
export type ChromaWhere = Record<string, unknown>;

export type ChromaCollectionListItem = {
  name: string;
  metadata?: Record<string, unknown>;
};

export type ChromaCollection = {
  upsert: (params: {
    ids: string[];
    documents?: string[];
    embeddings?: number[][];
    metadatas?: Array<Record<string, unknown>>;
  }) => Promise<unknown>;
  delete: (params: { ids?: string[]; where?: ChromaWhere }) => Promise<unknown>;
  query: (params: {
    queryEmbeddings: number[][];
    nResults: number;
    where?: ChromaWhere;
    include?: string[];
  }) => Promise<unknown>;
  peek: (params?: { limit?: number }) => Promise<unknown>;
};

type ChromaClientLike = {
  heartbeat: () => Promise<unknown>;
  listCollections: (params?: Record<string, unknown>) => Promise<unknown>;
  getOrCreateCollection: (params: Record<string, unknown>) => Promise<unknown>;
  deleteCollection: (params: Record<string, unknown>) => Promise<unknown>;
};

const UNAVAILABLE_TOKENS = [
  "econnrefused",
  "enotfound",
  "fetch failed",
  "network",
  "connection refused",
  "timed out",
  "timeout",
];

let cachedClient: ChromaClientLike | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function extractStatus(error: unknown): number | null {
  if (!isRecord(error)) return null;
  const status = error.status;
  if (typeof status === "number" && Number.isFinite(status)) return status;

  const response = error.response;
  if (isRecord(response)) {
    const responseStatus = response.status;
    if (typeof responseStatus === "number" && Number.isFinite(responseStatus)) {
      return responseStatus;
    }
  }
  return null;
}

function isUnavailableError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();
  if (UNAVAILABLE_TOKENS.some((token) => message.includes(token))) {
    return true;
  }

  const status = extractStatus(error);
  if (!status) return false;
  return status === 503 || status === 504 || status === 502;
}

function toChromaHttpError(action: string, error: unknown): HttpError {
  const message = toErrorMessage(error);
  if (isUnavailableError(error)) {
    return new HttpError(
      503,
      `Chroma is unavailable during ${action}: ${message}`,
      "CHROMA_UNAVAILABLE"
    );
  }

  return new HttpError(
    502,
    `Chroma request failed during ${action}: ${message}`,
    "CHROMA_REQUEST_FAILED"
  );
}

async function withTimeout<T>(
  action: string,
  timeoutMs: number,
  run: () => Promise<T>
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new HttpError(
          503,
          `Chroma request timed out during ${action}`,
          "CHROMA_UNAVAILABLE"
        )
      );
    }, timeoutMs);
  });

  try {
    return (await Promise.race([run(), timeoutPromise])) as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getClient(): ChromaClientLike {
  if (cachedClient) return cachedClient;

  const config = getChromaConfig();
  let instance: ChromaClient;
  try {
    const url = new URL(config.url);
    const defaultPort = url.protocol === "https:" ? 443 : 80;
    const port = Number(url.port || defaultPort);
    instance = new ChromaClient({
      host: url.hostname,
      port,
      ssl: url.protocol === "https:",
      tenant: config.tenant,
      database: config.database,
    });
  } catch {
    instance = new ChromaClient({
      path: config.url,
      tenant: config.tenant,
      database: config.database,
    });
  }

  cachedClient = instance as unknown as ChromaClientLike;
  return cachedClient;
}

async function runChromaCall<T>(
  action: string,
  operation: () => Promise<T>
): Promise<T> {
  const config = getChromaConfig();
  try {
    return await withTimeout(action, config.timeoutMs, operation);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw toChromaHttpError(action, error);
  }
}

function toCollectionList(raw: unknown): ChromaCollectionListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ChromaCollectionListItem | null => {
      if (typeof item === "string" && item.trim().length > 0) {
        return { name: item };
      }
      if (!isRecord(item)) return null;
      const name = item.name;
      if (typeof name !== "string" || name.trim().length === 0) {
        return null;
      }
      const metadata = isRecord(item.metadata) ? item.metadata : undefined;
      return { name, metadata };
    })
    .filter((item): item is ChromaCollectionListItem => Boolean(item));
}

function asChromaCollection(raw: unknown): ChromaCollection {
  if (!isRecord(raw)) {
    throw new HttpError(
      502,
      "Unexpected Chroma collection response shape",
      "CHROMA_REQUEST_FAILED"
    );
  }

  const upsert = raw.upsert;
  const del = raw.delete;
  const query = raw.query;
  const peek = raw.peek;
  if (
    typeof upsert !== "function" ||
    typeof del !== "function" ||
    typeof query !== "function" ||
    typeof peek !== "function"
  ) {
    throw new HttpError(
      502,
      "Chroma collection object is missing required methods",
      "CHROMA_REQUEST_FAILED"
    );
  }

  return {
    upsert: (params) => upsert.call(raw, params),
    delete: (params) => del.call(raw, params),
    query: (params) => query.call(raw, params),
    peek: (params) => peek.call(raw, params),
  };
}

export const chromaClient = {
  async heartbeat(): Promise<unknown> {
    return runChromaCall("heartbeat", async () => getClient().heartbeat());
  },

  async listCollections(): Promise<ChromaCollectionListItem[]> {
    const response = await runChromaCall("listCollections", async () =>
      getClient().listCollections()
    );
    return toCollectionList(response);
  },

  async getOrCreateCollection(params: {
    name: string;
    metadata?: ChromaMetadata;
  }): Promise<ChromaCollection> {
    const response = await runChromaCall("getOrCreateCollection", async () =>
      getClient().getOrCreateCollection({
        name: params.name,
        metadata: params.metadata,
      })
    );
    return asChromaCollection(response);
  },

  async deleteCollection(name: string): Promise<void> {
    await runChromaCall("deleteCollection", async () =>
      getClient().deleteCollection({
        name,
      })
    );
  },
};

export function resetChromaClientForTests(): void {
  cachedClient = null;
}
