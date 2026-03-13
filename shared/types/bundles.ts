import type { InstructionMeta, StBaseConfig } from "./instructions";
import type { OperationExecutionMode, OperationInProfile } from "./operation-profiles";
import type { UiThemePresetPayload } from "./ui-theme";

export const TALESPINNER_BUNDLE_TYPE = "talespinner.bundle";
export const TALESPINNER_BUNDLE_VERSION = 1 as const;
export const TALESPINNER_BUNDLE_ARCHIVE_MEDIA_TYPE = "application/x-talespinner-bundle";
export const TALESPINNER_BUNDLE_ARCHIVE_EXTENSION = ".tsbundle";

export type TaleSpinnerBundleContainer = "json" | "archive";
export type TaleSpinnerBundleResourceRole = "primary" | "related" | "dependency";
export type TaleSpinnerBundleResourceKind =
  | "instruction"
  | "operation_block"
  | "operation_profile"
  | "world_info_book"
  | "entity_profile"
  | "ui_theme_preset";

export type BundleFileDescriptor = {
  path: string;
  fileName: string;
  mediaType: string;
  size?: number;
  sha256?: string;
};

export type InstructionBundlePayload =
  | {
      name: string;
      kind: "basic";
      engine: "liquidjs";
      templateText: string;
      meta?: InstructionMeta;
    }
  | {
      name: string;
      kind: "st_base";
      engine: "liquidjs";
      stBase: StBaseConfig;
      meta?: InstructionMeta;
    };

export type OperationBlockBundlePayload = {
  name: string;
  description?: string;
  enabled: boolean;
  operations: OperationInProfile[];
  meta?: unknown;
};

export type OperationProfileBundlePayload = {
  name: string;
  description?: string;
  enabled: boolean;
  executionMode: OperationExecutionMode;
  operationProfileSessionId: string;
  blockRefs: Array<{
    resourceId: string;
    enabled: boolean;
    order: number;
  }>;
  meta?: unknown;
};

export type WorldInfoBookBundlePayload = {
  name: string;
  slug?: string;
  description?: string | null;
  data: unknown;
  extensions?: unknown | null;
  source?: "native" | "imported" | "converted";
};

export type EntityProfileBundlePayload = {
  name: string;
  kind: "CharSpec";
  spec: unknown;
  meta?: unknown;
  isFavorite: boolean;
  avatarFile?: BundleFileDescriptor;
};

export type UiThemePresetBundlePayload = {
  name: string;
  description?: string;
  payload: UiThemePresetPayload;
};

type BundleResourceBase<TKind extends TaleSpinnerBundleResourceKind, TPayload> = {
  resourceId: string;
  kind: TKind;
  schemaVersion: 1;
  role: TaleSpinnerBundleResourceRole;
  title: string;
  payload: TPayload;
};

export type InstructionBundleResource = BundleResourceBase<"instruction", InstructionBundlePayload>;
export type OperationBlockBundleResource = BundleResourceBase<"operation_block", OperationBlockBundlePayload>;
export type OperationProfileBundleResource = BundleResourceBase<"operation_profile", OperationProfileBundlePayload>;
export type WorldInfoBookBundleResource = BundleResourceBase<"world_info_book", WorldInfoBookBundlePayload>;
export type EntityProfileBundleResource = BundleResourceBase<"entity_profile", EntityProfileBundlePayload>;
export type UiThemePresetBundleResource = BundleResourceBase<"ui_theme_preset", UiThemePresetBundlePayload>;

export type TaleSpinnerBundleResource =
  | InstructionBundleResource
  | OperationBlockBundleResource
  | OperationProfileBundleResource
  | WorldInfoBookBundleResource
  | EntityProfileBundleResource
  | UiThemePresetBundleResource;

export type TaleSpinnerBundle = {
  type: typeof TALESPINNER_BUNDLE_TYPE;
  version: typeof TALESPINNER_BUNDLE_VERSION;
  bundleId: string;
  createdAt: string;
  sourceResourceId?: string;
  container: TaleSpinnerBundleContainer;
  resources: TaleSpinnerBundleResource[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertString(value: unknown, message: string): asserts value is string {
  assert(typeof value === "string" && value.trim().length > 0, message);
}

function assertBoolean(value: unknown, message: string): asserts value is boolean {
  assert(typeof value === "boolean", message);
}

function assertFiniteNumber(value: unknown, message: string): asserts value is number {
  assert(typeof value === "number" && Number.isFinite(value), message);
}

function parseInstructionPayload(payload: unknown): InstructionBundlePayload {
  assert(isRecord(payload), "Instruction payload must be an object.");
  assertString(payload.name, "Instruction payload requires name.");
  assert(payload.engine === "liquidjs", "Instruction payload requires engine=liquidjs.");
  if (payload.kind === "basic") {
    assertString(payload.templateText, "Basic instruction payload requires templateText.");
    return {
      name: payload.name,
      kind: "basic",
      engine: "liquidjs",
      templateText: payload.templateText,
      meta: isRecord(payload.meta) ? payload.meta : undefined,
    };
  }
  assert(payload.kind === "st_base", "Instruction payload requires a supported kind.");
  assert(typeof payload.stBase !== "undefined", "st_base instruction payload requires stBase.");
  return {
    name: payload.name,
    kind: "st_base",
    engine: "liquidjs",
    stBase: payload.stBase as StBaseConfig,
    meta: isRecord(payload.meta) ? payload.meta : undefined,
  };
}

function parseOperationBlockPayload(payload: unknown): OperationBlockBundlePayload {
  assert(isRecord(payload), "Operation block payload must be an object.");
  assertString(payload.name, "Operation block payload requires name.");
  assertBoolean(payload.enabled, "Operation block payload requires enabled.");
  assert(Array.isArray(payload.operations), "Operation block payload requires operations array.");
  return {
    name: payload.name,
    description: typeof payload.description === "string" ? payload.description : undefined,
    enabled: payload.enabled,
    operations: payload.operations as OperationInProfile[],
    meta: payload.meta,
  };
}

function parseOperationProfilePayload(payload: unknown): OperationProfileBundlePayload {
  assert(isRecord(payload), "Operation profile payload must be an object.");
  assertString(payload.name, "Operation profile payload requires name.");
  assertBoolean(payload.enabled, "Operation profile payload requires enabled.");
  assert(
    payload.executionMode === "concurrent" || payload.executionMode === "sequential",
    "Operation profile payload requires a supported executionMode."
  );
  assertString(payload.operationProfileSessionId, "Operation profile payload requires operationProfileSessionId.");
  assert(Array.isArray(payload.blockRefs), "Operation profile payload requires blockRefs array.");
  return {
    name: payload.name,
    description: typeof payload.description === "string" ? payload.description : undefined,
    enabled: payload.enabled,
    executionMode: payload.executionMode,
    operationProfileSessionId: payload.operationProfileSessionId,
    blockRefs: payload.blockRefs.map((ref) => {
      assert(isRecord(ref), "Operation profile blockRef must be an object.");
      assertString(ref.resourceId, "Operation profile blockRef requires resourceId.");
      assertBoolean(ref.enabled, "Operation profile blockRef requires enabled.");
      assertFiniteNumber(ref.order, "Operation profile blockRef requires finite order.");
      return {
        resourceId: ref.resourceId,
        enabled: ref.enabled,
        order: ref.order,
      };
    }),
    meta: payload.meta,
  };
}

function parseBundleFileDescriptor(value: unknown): BundleFileDescriptor {
  assert(isRecord(value), "Bundle file descriptor must be an object.");
  assertString(value.path, "Bundle file descriptor requires path.");
  assertString(value.fileName, "Bundle file descriptor requires fileName.");
  assertString(value.mediaType, "Bundle file descriptor requires mediaType.");
  return {
    path: value.path,
    fileName: value.fileName,
    mediaType: value.mediaType,
    size: typeof value.size === "number" ? value.size : undefined,
    sha256: typeof value.sha256 === "string" ? value.sha256 : undefined,
  };
}

function parseWorldInfoBookPayload(payload: unknown): WorldInfoBookBundlePayload {
  assert(isRecord(payload), "World info payload must be an object.");
  assertString(payload.name, "World info payload requires name.");
  return {
    name: payload.name,
    slug: typeof payload.slug === "string" ? payload.slug : undefined,
    description:
      typeof payload.description === "string" || payload.description === null
        ? payload.description
        : undefined,
    data: payload.data,
    extensions: payload.extensions,
    source:
      payload.source === "native" || payload.source === "imported" || payload.source === "converted"
        ? payload.source
        : undefined,
  };
}

function parseEntityProfilePayload(payload: unknown): EntityProfileBundlePayload {
  assert(isRecord(payload), "Entity profile payload must be an object.");
  assertString(payload.name, "Entity profile payload requires name.");
  assert(payload.kind === "CharSpec", "Entity profile payload requires kind=CharSpec.");
  assertBoolean(payload.isFavorite, "Entity profile payload requires isFavorite.");
  return {
    name: payload.name,
    kind: "CharSpec",
    spec: payload.spec,
    meta: payload.meta,
    isFavorite: payload.isFavorite,
    avatarFile: typeof payload.avatarFile === "undefined" ? undefined : parseBundleFileDescriptor(payload.avatarFile),
  };
}

function parseUiThemePresetPayload(payload: unknown): UiThemePresetBundlePayload {
  assert(isRecord(payload), "UI theme preset payload must be an object.");
  assertString(payload.name, "UI theme preset payload requires name.");
  return {
    name: payload.name,
    description: typeof payload.description === "string" ? payload.description : undefined,
    payload: payload.payload as UiThemePresetPayload,
  };
}

function parseResource(input: unknown): TaleSpinnerBundleResource {
  assert(isRecord(input), "Bundle resource must be an object.");
  assertString(input.resourceId, "Bundle resource requires resourceId.");
  assertString(input.title, "Bundle resource requires title.");
  assert(input.schemaVersion === 1, "Bundle resource requires schemaVersion=1.");
  assert(
    input.role === "primary" || input.role === "related" || input.role === "dependency",
    "Bundle resource requires a supported role."
  );

  if (input.kind === "instruction") {
    return {
      resourceId: input.resourceId,
      kind: "instruction",
      schemaVersion: 1,
      role: input.role,
      title: input.title,
      payload: parseInstructionPayload(input.payload),
    };
  }
  if (input.kind === "operation_block") {
    return {
      resourceId: input.resourceId,
      kind: "operation_block",
      schemaVersion: 1,
      role: input.role,
      title: input.title,
      payload: parseOperationBlockPayload(input.payload),
    };
  }
  if (input.kind === "operation_profile") {
    return {
      resourceId: input.resourceId,
      kind: "operation_profile",
      schemaVersion: 1,
      role: input.role,
      title: input.title,
      payload: parseOperationProfilePayload(input.payload),
    };
  }
  if (input.kind === "world_info_book") {
    return {
      resourceId: input.resourceId,
      kind: "world_info_book",
      schemaVersion: 1,
      role: input.role,
      title: input.title,
      payload: parseWorldInfoBookPayload(input.payload),
    };
  }
  if (input.kind === "entity_profile") {
    return {
      resourceId: input.resourceId,
      kind: "entity_profile",
      schemaVersion: 1,
      role: input.role,
      title: input.title,
      payload: parseEntityProfilePayload(input.payload),
    };
  }
  if (input.kind === "ui_theme_preset") {
    return {
      resourceId: input.resourceId,
      kind: "ui_theme_preset",
      schemaVersion: 1,
      role: input.role,
      title: input.title,
      payload: parseUiThemePresetPayload(input.payload),
    };
  }

  throw new Error("Bundle resource requires a supported kind.");
}

export function createBundleResourceId(kind: TaleSpinnerBundleResourceKind, seed: string): string {
  const normalized = seed.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${kind}:${normalized || "resource"}`;
}

export function parseTaleSpinnerBundle(input: unknown): TaleSpinnerBundle {
  assert(isRecord(input), "Bundle must be an object.");
  assert(input.type === TALESPINNER_BUNDLE_TYPE, `Bundle type must be ${TALESPINNER_BUNDLE_TYPE}.`);
  assert(input.version === TALESPINNER_BUNDLE_VERSION, `Bundle version must be ${TALESPINNER_BUNDLE_VERSION}.`);
  assertString(input.bundleId, "Bundle requires bundleId.");
  assertString(input.createdAt, "Bundle requires createdAt.");
  assert(input.container === "json" || input.container === "archive", "Bundle requires a supported container.");
  assert(Array.isArray(input.resources) && input.resources.length > 0, "Bundle requires resources.");
  if (typeof input.sourceResourceId !== "undefined") {
    assertString(input.sourceResourceId, "sourceResourceId must be a non-empty string.");
  }

  return {
    type: TALESPINNER_BUNDLE_TYPE,
    version: TALESPINNER_BUNDLE_VERSION,
    bundleId: input.bundleId,
    createdAt: input.createdAt,
    sourceResourceId: typeof input.sourceResourceId === "string" ? input.sourceResourceId : undefined,
    container: input.container,
    resources: input.resources.map(parseResource),
  };
}

export function validateBundleResourceGraph(bundle: TaleSpinnerBundle): void {
  const resourcesById = new Map(bundle.resources.map((resource) => [resource.resourceId, resource]));
  if (bundle.sourceResourceId && !resourcesById.has(bundle.sourceResourceId)) {
    throw new Error(`Unknown sourceResourceId: ${bundle.sourceResourceId}`);
  }

  bundle.resources.forEach((resource) => {
    if (resource.kind !== "operation_profile") return;
    resource.payload.blockRefs.forEach((ref) => {
      const target = resourcesById.get(ref.resourceId);
      if (!target || target.kind !== "operation_block") {
        throw new Error(`Unknown operation_block resourceId: ${ref.resourceId}`);
      }
    });
  });
}
