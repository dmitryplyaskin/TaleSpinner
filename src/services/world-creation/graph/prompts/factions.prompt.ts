import type { LLMOutputLanguage } from "@shared/types/settings";
import type { BaseWorldData } from "src/schemas/world";

export function buildFactionsPrompt(
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
You are an expert World Builder specializing in creating political factions and organizations.
Create detailed factions for the following world.

World Foundation:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}
- World Primer: ${baseWorld.world_primer}

Additional Known Information:
${JSON.stringify(knownInfo)}

Task:
Generate ${count} distinct and compelling factions. Each faction should include:
- name: Faction name
- type: Type of organization (guild, kingdom, cult, order, etc.)
- ideology_and_goals: Core beliefs and objectives (150-200 words)
- structure: Organizational hierarchy and structure
- key_leaders: Notable leaders and their characteristics
- methods: How they achieve their goals
- relationships: Relations with other factions
- role_in_conflict: Their role in the world's central conflict
- resources_and_influence: Their power base and reach

Create factions that offer dynamic relationships and opportunities for political intrigue.

${languageInstruction}
  `.trim();
}

