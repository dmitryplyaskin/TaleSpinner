import type { LLMOutputLanguage } from "@shared/types/settings";

export function buildBasePrompt(
  knownInfo: string[],
  setting: string,
  outputLanguage: LLMOutputLanguage
): string {
  const languageInstruction =
    outputLanguage === "ru"
      ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
      : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

  return `
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
  `.trim();
}

