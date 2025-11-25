import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { OpenAI } from "openai";
import { BaseWorldDataSchema, BaseWorldData } from "src/schemas/world";

export class BaseAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(
    knownInfo: string[],
    setting: string,
    outputLanguage: LLMOutputLanguage = "ru"
  ): Promise<BaseWorldData> {
    const languageInstruction =
      outputLanguage === "ru"
        ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
        : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

    const prompt = `
You are an expert World Builder specializing in creating foundational world concepts.
Create the base foundation for an RPG world setting (${setting}) based on the following information.

Collected Information:
${JSON.stringify(knownInfo)}

Task:
Generate the core world foundation including:
- name: A memorable and evocative name for the world
- genre: The primary genre (e.g., "Dark Fantasy", "High Fantasy", "Steampunk Fantasy")
- tone: The overall atmosphere and mood (e.g., "Grim and mysterious", "Epic and heroic")
- world_primer: A comprehensive overview of the world (400-600 words) describing its unique features, central conflict, and what makes it special

Be creative, consistent, and engaging. This foundation will be used by other agents to generate detailed factions, locations, races, history, and magic systems.

${languageInstruction}
    `;

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "base_world_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            genre: { type: "string" },
            tone: { type: "string" },
            world_primer: { type: "string" },
          },
          required: ["name", "genre", "tone", "world_primer"],
          additionalProperties: false,
        },
      },
    };

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });

    return BaseWorldDataSchema.parse(result);
  }
}
