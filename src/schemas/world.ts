import { z } from "zod";

// World creation types - Zod schemas with TypeScript type exports
export const WorldSettingSchema = z.enum(["fantasy"]);

export const UserInputSchema = z.object({
  setting: WorldSettingSchema,
  description: z.string().min(1),
});

export const FactionSchema = z.object({
  name: z.string(),
  type: z.string(),
  ideology_and_goals: z.string(),
  structure: z.string(),
  key_leaders: z.string(),
  methods: z.string(),
  relationships: z.string(),
  role_in_conflict: z.string(),
  resources_and_influence: z.string(),
});

export const LocationSchema = z.object({
  name: z.string(),
  type: z.string(),
  appearance: z.string(),
  history: z.string(),
  inhabitants: z.string(),
  significance: z.string(),
  features_and_secrets: z.string(),
  adventure_opportunities: z.string(),
});

export const RaceSchema = z.object({
  name: z.string(),
  description: z.string(),
  relationship_to_conflict: z.string(),
  special_abilities: z.string(),
  social_structure: z.string(),
});

export const TimelineEventSchema = z.object({
  name: z.string(),
  timeframe: z.string(),
  description: z.string(),
  impact_on_present: z.string(),
});

export const MagicSystemSchema = z.object({
  magic_fundamentals: z.string(),
  power_sources: z.string(),
  magic_schools: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  limitations_and_costs: z.string(),
  societal_attitude: z.string(),
  role_in_conflict: z.string(),
  artifacts_and_places: z.string(),
});

export const WorldDataSchema = z.object({
  name: z.string(),
  genre: z.string(),
  tone: z.string(),
  world_primer: z.string(),
  factions: z.array(FactionSchema).optional(),
  locations: z.array(LocationSchema).optional(),
  races: z.array(RaceSchema).optional(),
  history: z.array(TimelineEventSchema).optional(),
  magic: MagicSystemSchema.optional(),
});

export const SessionStatusSchema = z.enum([
  "collecting_info",
  "generating",
  "review",
  "completed",
]);

export const AgentQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.string(),
});

export const AgentAnalysisSchema = z.object({
  known_info: z.array(z.string()),
  missing_info: z.array(z.string()),
  questions: z.array(AgentQuestionSchema),
  is_ready: z.boolean(),
});

// Schemas for parallel world generation agents

// BaseAgent result schema
export const BaseWorldDataSchema = z.object({
  name: z.string(),
  genre: z.string(),
  tone: z.string(),
  world_primer: z.string(),
});

// Specialized agent result schemas
export const FactionsResultSchema = z.object({
  factions: z.array(FactionSchema),
});

export const LocationsResultSchema = z.object({
  locations: z.array(LocationSchema),
});

export const RacesResultSchema = z.object({
  races: z.array(RaceSchema),
});

export const HistoryResultSchema = z.object({
  history: z.array(TimelineEventSchema),
});

export const MagicResultSchema = z.object({
  magic: MagicSystemSchema,
});

// Generation progress tracking
export const AgentStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

export const GenerationProgressSchema = z.object({
  base: AgentStatusSchema,
  factions: AgentStatusSchema,
  locations: AgentStatusSchema,
  races: AgentStatusSchema,
  history: AgentStatusSchema,
  magic: AgentStatusSchema,
});

// Export TypeScript types
export type WorldSetting = z.infer<typeof WorldSettingSchema>;
export type Faction = z.infer<typeof FactionSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Race = z.infer<typeof RaceSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type MagicSystem = z.infer<typeof MagicSystemSchema>;
export type WorldData = z.infer<typeof WorldDataSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type AgentQuestion = z.infer<typeof AgentQuestionSchema>;
export type AgentAnalysis = z.infer<typeof AgentAnalysisSchema>;

// Parallel generation types
export type BaseWorldData = z.infer<typeof BaseWorldDataSchema>;
export type FactionsResult = z.infer<typeof FactionsResultSchema>;
export type LocationsResult = z.infer<typeof LocationsResultSchema>;
export type RacesResult = z.infer<typeof RacesResultSchema>;
export type HistoryResult = z.infer<typeof HistoryResultSchema>;
export type MagicResult = z.infer<typeof MagicResultSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type GenerationProgress = z.infer<typeof GenerationProgressSchema>;
