import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { OpenAI } from "openai";
import {
  BaseWorldData,
  RacesResultSchema,
  RacesResult,
} from "src/schemas/world";

export class RacesAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(
    baseWorld: BaseWorldData,
    knownInfo: string[],
    outputLanguage: LLMOutputLanguage = "ru",
    count: number = 2
  ): Promise<RacesResult> {
    const languageInstruction =
      outputLanguage === "ru"
        ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
        : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

    const prompt = `
You are an expert World Builder specializing in creating unique races and peoples.
Create detailed races for the following world.

World Foundation:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}
- World Primer: ${baseWorld.world_primer}

Additional Known Information:
${JSON.stringify(knownInfo)}

Task:
Generate ${count} unique races or peoples for this world. Each race should include:
- name: Race name
- description: Detailed description of appearance and culture (200-300 words)
- relationship_to_conflict: Their role in the world's central conflict
- special_abilities: Unique abilities or characteristics
- social_structure: Social organization and place in the world

Create races that organically fit the established tone and genre of the world.

${languageInstruction}
    `;

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "races_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
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
                required: [
                  "name",
                  "description",
                  "relationship_to_conflict",
                  "special_abilities",
                  "social_structure",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["races"],
          additionalProperties: false,
        },
      },
    };

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });

    return RacesResultSchema.parse(result);
  }
}

