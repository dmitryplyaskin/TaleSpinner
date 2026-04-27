export const knowledgeScopes = ["chat", "branch"] as const;
export type KnowledgeScope = (typeof knowledgeScopes)[number];

export const knowledgeCollectionStatuses = ["active", "archived", "deleted"] as const;
export type KnowledgeCollectionStatus = (typeof knowledgeCollectionStatuses)[number];

export const knowledgeRecordStatuses = ["active", "archived", "deleted"] as const;
export type KnowledgeRecordStatus = (typeof knowledgeRecordStatuses)[number];

export const knowledgeOrigins = ["import", "author", "system_seed", "user", "llm"] as const;
export type KnowledgeOrigin = (typeof knowledgeOrigins)[number];

export const knowledgeLayers = ["baseline", "runtime"] as const;
export type KnowledgeLayer = (typeof knowledgeLayers)[number];

export const knowledgeAccessModes = ["public", "discoverable", "hidden", "internal"] as const;
export type KnowledgeAccessMode = (typeof knowledgeAccessModes)[number];

export const knowledgeDiscoverStates = ["hidden", "discoverable", "visible"] as const;
export type KnowledgeDiscoverState = (typeof knowledgeDiscoverStates)[number];

export const knowledgeReadStates = ["blocked", "partial", "full"] as const;
export type KnowledgeReadState = (typeof knowledgeReadStates)[number];

export const knowledgePromptStates = ["blocked", "allowed"] as const;
export type KnowledgePromptState = (typeof knowledgePromptStates)[number];

export const knowledgeRevealStates = ["hidden", "revealed"] as const;
export type KnowledgeRevealState = (typeof knowledgeRevealStates)[number];

export const knowledgeRevealActors = ["system", "user", "llm", "import"] as const;
export type KnowledgeRevealActor = (typeof knowledgeRevealActors)[number];

export const knowledgeExportModes = [
  "baseline_only",
  "runtime_only",
  "baseline_plus_runtime",
  "baseline_with_reveals",
] as const;
export type KnowledgeExportMode = (typeof knowledgeExportModes)[number];

export type KnowledgeGatePredicate =
  | {
      type: "flag_equals";
      key: string;
      value: unknown;
    }
  | {
      type: "record_revealed";
      recordId?: string;
      recordKey?: string;
    }
  | {
      type: "record_state";
      recordId?: string;
      recordKey?: string;
      revealState?: KnowledgeRevealState;
      readState?: KnowledgeReadState;
      promptState?: KnowledgePromptState;
    }
  | {
      type: "counter_gte";
      key: string;
      value: number;
    }
  | {
      type: "manual_unlock";
    }
  | {
      type: "branch_only";
      branchId?: string;
    };

export type KnowledgeGateExpression =
  | {
      all: KnowledgeGateNode[];
    }
  | {
      any: KnowledgeGateNode[];
    }
  | {
      not: KnowledgeGateNode;
    };

export type KnowledgeGateNode = KnowledgeGatePredicate | KnowledgeGateExpression;

export type KnowledgeGatePolicy = {
  discover?: { mode?: "always" } | KnowledgeGateExpression;
  read?: KnowledgeGateExpression;
  prompt?: KnowledgeGateExpression;
};

export type KnowledgeCollectionDto = {
  id: string;
  ownerId: string;
  chatId: string;
  branchId: string | null;
  scope: KnowledgeScope;
  name: string;
  kind: string | null;
  description: string | null;
  status: KnowledgeCollectionStatus;
  origin: KnowledgeOrigin;
  layer: KnowledgeLayer;
  meta: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeRecordDto = {
  id: string;
  ownerId: string;
  chatId: string;
  branchId: string | null;
  collectionId: string;
  recordType: string;
  key: string;
  title: string;
  aliases: string[];
  tags: string[];
  summary: string | null;
  content: unknown;
  searchText: string;
  accessMode: KnowledgeAccessMode;
  origin: KnowledgeOrigin;
  layer: KnowledgeLayer;
  derivedFromRecordId: string | null;
  sourceMessageId: string | null;
  sourceOperationId: string | null;
  status: KnowledgeRecordStatus;
  gatePolicy: KnowledgeGatePolicy | null;
  meta: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeRecordLinkDto = {
  id: string;
  ownerId: string;
  chatId: string;
  branchId: string | null;
  fromRecordId: string;
  relationType: string;
  toRecordId: string;
  meta: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeRecordAccessStateDto = {
  id: string;
  ownerId: string;
  chatId: string;
  branchId: string | null;
  recordId: string;
  discoverState: KnowledgeDiscoverState;
  readState: KnowledgeReadState;
  promptState: KnowledgePromptState;
  revealState: KnowledgeRevealState;
  revealedAt: Date | null;
  revealedBy: KnowledgeRevealActor | null;
  revealReason: string | null;
  flags: Record<string, unknown>;
  updatedAt: Date;
};

export type KnowledgeRuntimeContext = {
  flags?: Record<string, unknown>;
  counters?: Record<string, number>;
  manualUnlock?: boolean;
};

export type KnowledgeSearchRequest = {
  textQuery?: string;
  keys?: string[];
  titles?: string[];
  aliases?: string[];
  tags?: string[];
  recordTypes?: string[];
  collectionIds?: string[];
  includeHiddenCandidates?: boolean;
  limit?: number;
  minScore?: number;
  minimumShouldMatch?: number;
  context?: KnowledgeRuntimeContext;
};

export type KnowledgeRecordPreview = {
  title: string;
  summary: string | null;
  aliases: string[];
  tags: string[];
  recordType: string;
};

export type KnowledgeSearchHit = {
  recordId: string;
  score: number;
  matchReasons: string[];
  visibility: "preview" | "full";
  preview: KnowledgeRecordPreview;
  record: KnowledgeRecordDto | null;
};

export type KnowledgeSearchResult = {
  hits: KnowledgeSearchHit[];
};

export type KnowledgeRevealRequest = {
  recordIds?: string[];
  recordKeys?: string[];
  reason?: string;
  revealedBy?: KnowledgeRevealActor;
  context?: KnowledgeRuntimeContext;
};

export type KnowledgeRevealItemResult = {
  recordId: string;
  status: "revealed" | "blocked" | "not_found";
  reason: string | null;
};

export type KnowledgeRevealResult = {
  results: KnowledgeRevealItemResult[];
};

export type KnowledgeCollectionExportPayload = {
  version: 1;
  collection: Omit<KnowledgeCollectionDto, "id" | "createdAt" | "updatedAt"> & {
    sourceCollectionId?: string;
  };
  records: KnowledgeRecordDto[];
  links: KnowledgeRecordLinkDto[];
  accessState: KnowledgeRecordAccessStateDto[];
  mode: KnowledgeExportMode;
};

export type KnowledgeCollectionImportResult = {
  collection: KnowledgeCollectionDto;
  records: KnowledgeRecordDto[];
  links: KnowledgeRecordLinkDto[];
  accessState: KnowledgeRecordAccessStateDto[];
};

export type KnowledgeRequestSource =
  | {
      mode: "inline";
      requestTemplate: string;
      strictVariables?: boolean;
    }
  | {
      mode: "artifact";
      artifactTag: string;
    };

export type KnowledgeSearchOperationParams = {
  source: KnowledgeRequestSource;
};

export type KnowledgeRevealOperationParams = {
  source: KnowledgeRequestSource;
};
