import { z } from "zod";
import { LLMService, LLMResponseFormat } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import {
  BaseWorldData,
  HistoryResultSchema,
  HistoryResult,
} from "src/schemas/world";

// === History Schema ===
export const HistoricalEventSchema = z.object({
  name: z.string(),
  timeframe: z.string(),
  description: z.string(),
  impact_on_present: z.string(),
});

export const HistoryResponseSchema = z.object({
  history: z.array(HistoricalEventSchema),
});

export const historyResponseFormat: LLMResponseFormat = {
  schema: HistoryResponseSchema,
  name: "history_generation",
};

// === Types ===
export type HistoricalEvent = z.infer<typeof HistoricalEventSchema>;
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;

export class HistoryAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(
    baseWorld: BaseWorldData,
    knownInfo: string[],
    outputLanguage: LLMOutputLanguage = "ru",
    count: number = 3
  ): Promise<HistoryResult> {
    const languageInstruction =
      outputLanguage === "ru"
        ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
        : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

    const prompt = `
You are an expert World Builder specializing in creating rich historical timelines.
Create a detailed history for the following world.

World Foundation:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}
- World Primer: ${baseWorld.world_primer}

Additional Known Information:
${JSON.stringify(knownInfo)}

Task:
Generate ${count} key historical events or periods. Each event should include:
- name: Name of the period or event
- timeframe: When it occurred (e.g., "500 years ago", "The First Age")
- description: Detailed description of what happened (150-200 words)
- impact_on_present: How this event affects the current state of the world

Create a logical timeline that explains "How did things get this way?" and creates depth for the world.

${languageInstruction}
    `;

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat: historyResponseFormat,
    });

    return HistoryResultSchema.parse(result);
  }
}
