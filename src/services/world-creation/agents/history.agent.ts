import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { OpenAI } from "openai";
import {
  BaseWorldData,
  HistoryResultSchema,
  HistoryResult,
} from "src/schemas/world";

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

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "history_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
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
                required: [
                  "name",
                  "timeframe",
                  "description",
                  "impact_on_present",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["history"],
          additionalProperties: false,
        },
      },
    };

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });

    return HistoryResultSchema.parse(result);
  }
}

