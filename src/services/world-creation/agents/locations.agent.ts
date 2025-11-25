import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/api-settings";
import { OpenAI } from "openai";
import {
  BaseWorldData,
  LocationsResultSchema,
  LocationsResult,
} from "src/schemas/world";

export class LocationsAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async generate(
    baseWorld: BaseWorldData,
    knownInfo: string[],
    outputLanguage: LLMOutputLanguage = "ru",
    count: number = 3
  ): Promise<LocationsResult> {
    const languageInstruction =
      outputLanguage === "ru"
        ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
        : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

    const prompt = `
You are an expert World Builder specializing in creating memorable locations and places.
Create detailed locations for the following world.

World Foundation:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}
- World Primer: ${baseWorld.world_primer}

Additional Known Information:
${JSON.stringify(knownInfo)}

Task:
Generate ${count} key locations in the world. Each location should include:
- name: Location name
- type: Type of location (city, ruins, natural area, fortress, etc.)
- appearance: Detailed visual description (200-300 words)
- history: Historical background of the location
- inhabitants: Current inhabitants and their activities
- significance: Importance to the world's central conflict
- features_and_secrets: Interesting features or hidden secrets
- adventure_opportunities: Potential adventures and quests

Create diverse locations that offer different types of gameplay experiences.

${languageInstruction}
    `;

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "locations_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
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
                required: [
                  "name",
                  "type",
                  "appearance",
                  "history",
                  "inhabitants",
                  "significance",
                  "features_and_secrets",
                  "adventure_opportunities",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["locations"],
          additionalProperties: false,
        },
      },
    };

    const result = await this.llm.call({
      messages: [{ role: "user", content: prompt }],
      responseFormat,
    });

    return LocationsResultSchema.parse(result);
  }
}

