import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { OpenAI } from "openai";
import {
  BaseWorldData,
  MagicResultSchema,
  MagicResult,
} from "src/schemas/world";

export class MagicAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(
    baseWorld: BaseWorldData,
    knownInfo: string[],
    outputLanguage: LLMOutputLanguage = "ru"
  ): Promise<MagicResult> {
    const languageInstruction =
      outputLanguage === "ru"
        ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
        : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

    const prompt = `
You are an expert World Builder specializing in creating unique magic systems.
Create a detailed magic system for the following world.

World Foundation:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}
- World Primer: ${baseWorld.world_primer}

Additional Known Information:
${JSON.stringify(knownInfo)}

Task:
Generate a comprehensive magic system including:
- magic_fundamentals: What magic is in this world and how it works
- power_sources: Where magical power comes from
- magic_schools: 3-5 schools or types of magic, each with name and description
- limitations_and_costs: What are the costs and limitations of using magic
- societal_attitude: How society views magic and mages
- role_in_conflict: How magic relates to the world's central conflict
- artifacts_and_places: Known magical artifacts or places of power

Create a logical and consistent magic system that matches the tone of the world.

${languageInstruction}
    `;

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "magic_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
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
              required: [
                "magic_fundamentals",
                "power_sources",
                "magic_schools",
                "limitations_and_costs",
                "societal_attitude",
                "role_in_conflict",
                "artifacts_and_places",
              ],
              additionalProperties: false,
            },
          },
          required: ["magic"],
          additionalProperties: false,
        },
      },
    };

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });

    return MagicResultSchema.parse(result);
  }
}

