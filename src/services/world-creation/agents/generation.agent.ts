import { LLMService } from "@core/services/llm.service";
import { OpenAI } from "openai";
import { WorldDataSchema } from "src/schemas/world";


export class GenerationAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(knownInfo: string[], setting: string): Promise<any> {
    try {
      const prompt = `
        You are an expert World Builder.
        Create a detailed RPG world setting (${setting}) based on the following information.

        Collected Information:
        ${JSON.stringify(knownInfo)}

        Task:
        Generate a comprehensive world primer including:
        - Name, Genre, Tone
        - Detailed World Primer (Overview)
        - Factions (at least 3)
        - Locations (at least 3)
        - Races (at least 2)
        - History/Timeline (at least 3 events)
        - Magic/Tech System

        Be creative, consistent, and engaging. Fill in any gaps with logical and interesting details that fit the established tone.
      `;

      // Using a simplified version of the schema for the agent to ensure reliability
      const responseFormat: OpenAI.ResponseFormatJSONSchema = {
        type: "json_schema",
        json_schema: {
          name: "world_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              genre: { type: "string" },
              tone: { type: "string" },
              world_primer: { type: "string" },
              factions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    ideology_and_goals: { type: "string" },
                    structure: { type: "string" },
                    key_leaders: { type: "string" },
                    methods: { type: "string" },
                    relationships: { type: "string" },
                    role_in_conflict: { type: "string" },
                    resources_and_influence: { type: "string" },
                  },
                  required: ["name", "type", "ideology_and_goals", "structure", "key_leaders", "methods", "relationships", "role_in_conflict", "resources_and_influence"],
                  additionalProperties: false,
                },
              },
              locations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    appearance: { type: "string" },
                    history: { type: "string" },
                    inhabitants: { type: "string" },
                    significance: { type: "string" },
                    features_and_secrets: { type: "string" },
                    adventure_opportunities: { type: "string" },
                  },
                  required: ["name", "type", "appearance", "history", "inhabitants", "significance", "features_and_secrets", "adventure_opportunities"],
                  additionalProperties: false,
                },
              },
              races: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    relationship_to_conflict: { type: "string" },
                    special_abilities: { type: "string" },
                    social_structure: { type: "string" },
                  },
                  required: ["name", "description", "relationship_to_conflict", "special_abilities", "social_structure"],
                  additionalProperties: false,
                },
              },
              history: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    timeframe: { type: "string" },
                    description: { type: "string" },
                    impact_on_present: { type: "string" },
                  },
                  required: ["name", "timeframe", "description", "impact_on_present"],
                  additionalProperties: false,
                },
              },
              magic: {
                type: "object",
                properties: {
                  magic_fundamentals: { type: "string" },
                  power_sources: { type: "string" },
                  magic_schools: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  limitations_and_costs: { type: "string" },
                  societal_attitude: { type: "string" },
                  role_in_conflict: { type: "string" },
                  artifacts_and_places: { type: "string" },
                },
                required: ["magic_fundamentals", "power_sources", "magic_schools", "limitations_and_costs", "societal_attitude", "role_in_conflict", "artifacts_and_places"],
                additionalProperties: false,
              },
            },
            required: ["name", "genre", "tone", "world_primer", "factions", "locations", "races", "history", "magic"],
            additionalProperties: false,
          },
        },
      };

      const result = await this.llm.call({
        messages: [{ role: "user", content: prompt }],
        responseFormat,
      });

      // Validate with Zod schema before returning
      return WorldDataSchema.parse(result);
    } catch (error) {
      console.error("Failed to generate world:", error);
      throw new Error("Failed to generate world data");
    }
  }
}
