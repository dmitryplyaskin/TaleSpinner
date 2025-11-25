import { z } from "zod";
import { LLMService, LLMResponseFormat } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { BaseWorldDataSchema, BaseWorldData } from "src/schemas/world";

// === Base World Schema ===
export const BaseWorldResponseSchema = z.object({
  name: z.string(),
  genre: z.string(),
  tone: z.string(),
  world_primer: z.string(),
});

export const baseWorldResponseFormat: LLMResponseFormat = {
  schema: BaseWorldResponseSchema,
  name: "base_world_generation",
};

// === Types ===
export type BaseWorldResponse = z.infer<typeof BaseWorldResponseSchema>;

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

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat: baseWorldResponseFormat,
    });

    return BaseWorldDataSchema.parse(result);
  }
}
