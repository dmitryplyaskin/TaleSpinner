import { z } from "zod";
import { LLMService, LLMResponseFormat } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import {
  BaseWorldData,
  MagicResultSchema,
  MagicResult,
} from "src/schemas/world";

// === Magic Schema ===
export const MagicSchoolSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const MagicSystemResponseSchema = z.object({
  magic: z.object({
    magic_fundamentals: z.string(),
    power_sources: z.string(),
    magic_schools: z.array(MagicSchoolSchema),
    limitations_and_costs: z.string(),
    societal_attitude: z.string(),
    role_in_conflict: z.string(),
    artifacts_and_places: z.string(),
  }),
});

export const magicSystemResponseFormat: LLMResponseFormat = {
  schema: MagicSystemResponseSchema,
  name: "magic_generation",
};

// === Types ===
export type MagicSchool = z.infer<typeof MagicSchoolSchema>;
export type MagicSystemResponse = z.infer<typeof MagicSystemResponseSchema>;

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

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat: magicSystemResponseFormat,
    });

    return MagicResultSchema.parse(result);
  }
}
