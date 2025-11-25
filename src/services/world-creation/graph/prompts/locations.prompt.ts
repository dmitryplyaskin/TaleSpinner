import type { LLMOutputLanguage } from "@shared/types/settings";
import type { BaseWorldData } from "src/schemas/world";

export function buildLocationsPrompt(
  baseWorld: BaseWorldData,
  knownInfo: string[],
  outputLanguage: LLMOutputLanguage,
  count: number = 3
): string {
  const languageInstruction =
    outputLanguage === "ru"
      ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
      : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

  return `
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
  `.trim();
}

