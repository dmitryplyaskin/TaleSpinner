import { z } from "zod";
import { WorldCustomizationData } from "@shared/types/world-creation";
import { LLMResponseFormat } from "@core/services/llm.service";

// === Draft Worlds Schema ===
export const DraftWorldSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  genre: z.string(),
  tone: z.array(z.string()),
  unique_feature: z.string(),
  synopsis: z.string(),
});

export const DraftWorldsResponseSchema = z.object({
  worlds: z.array(DraftWorldSchema),
});

export const draftWorldsResponseFormat: LLMResponseFormat = {
  schema: DraftWorldsResponseSchema,
  name: "rpg_worlds",
};

// === Races Schema ===
export const RaceItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  relationship_to_conflict: z.string(),
  special_abilities: z.string(),
  social_structure: z.string(),
});

export const RacesResponseSchema = z.object({
  races: z.array(RaceItemSchema),
});

export const racesResponseFormat: LLMResponseFormat = {
  schema: RacesResponseSchema,
  name: "world_races",
};

// === Timeline Schema ===
export const TimelineEventItemSchema = z.object({
  name: z.string(),
  timeframe: z.string(),
  description: z.string(),
  impact_on_present: z.string(),
});

export const TimelineResponseSchema = z.object({
  historical_events: z.array(TimelineEventItemSchema),
});

export const timelineResponseFormat: LLMResponseFormat = {
  schema: TimelineResponseSchema,
  name: "world_timeline",
};

// === Magic Schema ===
export const MagicSchoolItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const MagicResponseSchema = z.object({
  magic_fundamentals: z.string(),
  power_sources: z.string(),
  magic_schools: z.array(MagicSchoolItemSchema),
  limitations_and_costs: z.string(),
  societal_attitude: z.string(),
  role_in_conflict: z.string(),
  artifacts_and_places: z.string(),
});

export const magicResponseFormat: LLMResponseFormat = {
  schema: MagicResponseSchema,
  name: "world_magic",
};

// === Locations Schema ===
export const LocationItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  appearance: z.string(),
  history: z.string(),
  inhabitants: z.string(),
  significance: z.string(),
  features_and_secrets: z.string(),
  adventure_opportunities: z.string(),
});

export const LocationsResponseSchema = z.object({
  locations: z.array(LocationItemSchema),
});

export const locationsResponseFormat: LLMResponseFormat = {
  schema: LocationsResponseSchema,
  name: "world_locations",
};

// === Factions Schema ===
export const FactionItemSchema = z.object({
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

export const FactionsResponseSchema = z.object({
  factions: z.array(FactionItemSchema),
});

export const factionsResponseFormat: LLMResponseFormat = {
  schema: FactionsResponseSchema,
  name: "world_factions",
};

// === First Message Schema ===
export const MessageSegmentSchema = z.object({
  type: z.enum(["gm", "character"]),
  content: z.string(),
});

export const FirstMessageResponseSchema = z.object({
  message: z.array(MessageSegmentSchema),
});

export const firstMessageResponseFormat: LLMResponseFormat = {
  schema: FirstMessageResponseSchema,
  name: "generate_rpg_opening_message",
};

// === World Primer Schema (dynamic) ===
const BaseWorldPrimerSchema = z.object({
  name: z.string(),
  genre: z.string(),
  tone: z.string(),
  world_primer: z.string(),
});

const LocationPrimerItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const RacePrimerItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const FactionPrimerItemSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const createWorldPrimerResponseFormat = (
  data: WorldCustomizationData
): LLMResponseFormat => {
  let schema = BaseWorldPrimerSchema;

  if (data.locationsEnabled) {
    schema = schema.extend({
      locations: z.array(LocationPrimerItemSchema),
    });
  }

  if (data.racesEnabled) {
    schema = schema.extend({
      races: z.array(RacePrimerItemSchema),
    });
  }

  if (data.factionsEnabled) {
    schema = schema.extend({
      factions: z.array(FactionPrimerItemSchema),
    });
  }

  if (data.timelineEnabled) {
    schema = schema.extend({
      history: z.string(),
    });
  }

  return {
    schema,
    name: "rpg_world_primer",
  };
};

// === Type exports ===
export type DraftWorld = z.infer<typeof DraftWorldSchema>;
export type DraftWorldsResponse = z.infer<typeof DraftWorldsResponseSchema>;
export type RaceItem = z.infer<typeof RaceItemSchema>;
export type RacesResponse = z.infer<typeof RacesResponseSchema>;
export type TimelineEventItem = z.infer<typeof TimelineEventItemSchema>;
export type TimelineResponse = z.infer<typeof TimelineResponseSchema>;
export type MagicSchoolItem = z.infer<typeof MagicSchoolItemSchema>;
export type MagicResponse = z.infer<typeof MagicResponseSchema>;
export type LocationItem = z.infer<typeof LocationItemSchema>;
export type LocationsResponse = z.infer<typeof LocationsResponseSchema>;
export type FactionItem = z.infer<typeof FactionItemSchema>;
export type FactionsResponse = z.infer<typeof FactionsResponseSchema>;
export type MessageSegment = z.infer<typeof MessageSegmentSchema>;
export type FirstMessageResponse = z.infer<typeof FirstMessageResponseSchema>;
