import type { LLMOutputLanguage } from "@shared/types/settings";
import type { BaseWorldData } from "src/schemas/world";

export function buildRacesPrompt(
  baseWorld: BaseWorldData,
  knownInfo: string[],
  outputLanguage: LLMOutputLanguage,
  count: number = 2
): string {
  const languageInstruction =
    outputLanguage === "ru"
      ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
      : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

  return `
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
  `.trim();
}
