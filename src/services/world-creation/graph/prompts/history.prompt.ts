import type { LLMOutputLanguage } from "@shared/types/settings";
import type { BaseWorldData, Faction, Location, Race } from "src/schemas/world";

export interface HistoryPromptContext {
  base: BaseWorldData;
  factions: Faction[];
  locations: Location[];
  races: Race[];
  collectedInfo: string[];
  outputLanguage: LLMOutputLanguage;
  count?: number;
}

export function buildHistoryPrompt(context: HistoryPromptContext): string {
  const {
    base,
    factions,
    locations,
    races,
    collectedInfo,
    outputLanguage,
    count = 3,
  } = context;

  const languageInstruction =
    outputLanguage === "ru"
      ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
      : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

  // Извлекаем имена для контекста
  const factionNames = factions.map((f) => f.name).join(", ");
  const locationNames = locations.map((l) => l.name).join(", ");
  const raceNames = races.map((r) => r.name).join(", ");

  return `
You are an expert World Builder specializing in creating rich historical timelines.
Create a detailed history for the following world.

World Foundation:
- Name: ${base.name}
- Genre: ${base.genre}
- Tone: ${base.tone}
- World Primer: ${base.world_primer}

Existing World Elements:
- Factions: ${factionNames}
- Locations: ${locationNames}
- Races: ${raceNames}

Faction Details:
${JSON.stringify(factions, null, 2)}

Location Details:
${JSON.stringify(locations, null, 2)}

Race Details:
${JSON.stringify(races, null, 2)}

Additional Known Information:
${JSON.stringify(collectedInfo)}

Task:
Generate ${count} key historical events or periods. Each event should include:
- name: Name of the period or event
- timeframe: When it occurred (e.g., "500 years ago", "The First Age")
- description: Detailed description of what happened (150-200 words)
- impact_on_present: How this event affects the current state of the world

IMPORTANT: Reference the existing factions, locations, and races in your historical events.
Create a logical timeline that explains "How did things get this way?" and creates depth for the world.
Ensure historical events are consistent with the established world elements.

${languageInstruction}
  `.trim();
}
