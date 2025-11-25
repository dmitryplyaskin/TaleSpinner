import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { OpenAI } from "openai";
import {
  BaseWorldData,
  FactionsResultSchema,
  FactionsResult,
} from "src/schemas/world";

export class FactionsAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(
    baseWorld: BaseWorldData,
    knownInfo: string[],
    outputLanguage: LLMOutputLanguage = "ru",
    count: number = 3
  ): Promise<FactionsResult> {
    const languageInstruction =
      outputLanguage === "ru"
        ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
        : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

    const prompt = `
You are an expert World Builder specializing in creating political factions and organizations.
Create detailed factions for the following world.

World Foundation:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}
- World Primer: ${baseWorld.world_primer}

Additional Known Information:
${JSON.stringify(knownInfo)}

Task:
Generate ${count} distinct and compelling factions. Each faction should include:
- name: Faction name
- type: Type of organization (guild, kingdom, cult, order, etc.)
- ideology_and_goals: Core beliefs and objectives (150-200 words)
- structure: Organizational hierarchy and structure
- key_leaders: Notable leaders and their characteristics
- methods: How they achieve their goals
- relationships: Relations with other factions
- role_in_conflict: Their role in the world's central conflict
- resources_and_influence: Their power base and reach

Create factions that offer dynamic relationships and opportunities for political intrigue.

${languageInstruction}
    `;

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "factions_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
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
                required: [
                  "name",
                  "type",
                  "ideology_and_goals",
                  "structure",
                  "key_leaders",
                  "methods",
                  "relationships",
                  "role_in_conflict",
                  "resources_and_influence",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["factions"],
          additionalProperties: false,
        },
      },
    };

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });

    return FactionsResultSchema.parse(result);
  }
}

