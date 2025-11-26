import type { LLMOutputLanguage } from "@shared/types/settings";
import type { BaseWorldData, Faction, Location, Race, TimelineEvent } from "src/schemas/world";

export interface MagicPromptContext {
  base: BaseWorldData;
  factions: Faction[];
  locations: Location[];
  races: Race[];
  history: TimelineEvent[];
  collectedInfo: string[];
  outputLanguage: LLMOutputLanguage;
}

export function buildMagicPrompt(context: MagicPromptContext): string {
  const { base, factions, locations, races, history, collectedInfo, outputLanguage } = context;

  const languageInstruction =
    outputLanguage === "ru"
      ? "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in Russian language. The entire response must be in Russian."
      : "IMPORTANT: Generate ALL content (names, descriptions, dialogue, etc.) in English language. The entire response must be in English.";

  // Извлекаем имена для контекста
  const factionNames = factions.map((f) => f.name).join(", ");
  const locationNames = locations.map((l) => l.name).join(", ");
  const raceNames = races.map((r) => r.name).join(", ");
  const historicalEvents = history.map((h) => h.name).join(", ");

  return `
You are an expert World Builder specializing in creating unique magic systems.
Create a detailed magic system for the following world.

World Foundation:
- Name: ${base.name}
- Genre: ${base.genre}
- Tone: ${base.tone}
- World Primer: ${base.world_primer}

Existing World Elements:
- Factions: ${factionNames}
- Locations: ${locationNames}
- Races: ${raceNames}
- Historical Events: ${historicalEvents}

World Context Summary:
- Factions: ${JSON.stringify(factions.map(f => ({ name: f.name, type: f.type })))}
- Races: ${JSON.stringify(races.map(r => ({ name: r.name, special_abilities: r.special_abilities })))}
- History: ${JSON.stringify(history.map(h => ({ name: h.name, timeframe: h.timeframe })))}

Additional Known Information:
${JSON.stringify(collectedInfo)}

Task:
Generate a comprehensive magic system including:
- magic_fundamentals: What magic is in this world and how it works
- power_sources: Where magical power comes from
- magic_schools: 3-5 schools or types of magic, each with name and description
- limitations_and_costs: What are the costs and limitations of using magic
- societal_attitude: How society views magic and mages
- role_in_conflict: How magic relates to the world's central conflict
- artifacts_and_places: Known magical artifacts or places of power

IMPORTANT: The magic system should be consistent with:
- The established races and their special abilities
- Historical events that may have shaped magical practices
- The world's tone and genre

Create a logical and consistent magic system that matches the tone of the world.

${languageInstruction}
  `.trim();
}



