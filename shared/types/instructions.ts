export type InstructionKind = "basic" | "st_base";

export type InstructionMeta = {
  [key: string]: unknown;
};

export type StBasePromptRole = "system" | "user" | "assistant";

export type StBasePrompt = {
  identifier: string;
  name?: string;
  role?: StBasePromptRole;
  content?: string;
  system_prompt?: boolean;
  marker?: boolean;
};

export type StBasePromptOrderEntry = {
  identifier: string;
  enabled: boolean;
};

export type StBasePromptOrder = {
  character_id: number;
  order: StBasePromptOrderEntry[];
};

export type StBaseResponseConfig = {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  top_a?: number;
  min_p?: number;
  repetition_penalty?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  openai_max_tokens?: number;
  seed?: number;
  n?: number;
  reasoning_effort?: string;
  verbosity?: string;
  enable_web_search?: boolean;
  stream_openai?: boolean;
};

export type StBaseImportInfo = {
  source: "sillytavern";
  fileName: string;
  importedAt: string;
};

export type StBaseConfig = {
  rawPreset: Record<string, unknown>;
  prompts: StBasePrompt[];
  promptOrder: StBasePromptOrder[];
  responseConfig: StBaseResponseConfig;
  importInfo: StBaseImportInfo;
};

export type BasicInstruction = {
  kind: "basic";
  templateText: string;
  meta?: InstructionMeta | null;
};

export type StBaseInstruction = {
  kind: "st_base";
  stBase: StBaseConfig;
  meta?: InstructionMeta | null;
};

export type InstructionDefinition = BasicInstruction | StBaseInstruction;
