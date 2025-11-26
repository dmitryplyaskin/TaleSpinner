import type { WorldGenerationStateType } from "../state";

export function buildReviewPrompt(state: WorldGenerationStateType): string {
  return `
You are a World Consistency Reviewer. Analyze the generated world for logical consistency.

World Data:
- Name: ${state.base?.name}
- Genre: ${state.base?.genre}
- Tone: ${state.base?.tone}
- World Primer: ${state.base?.world_primer}

Factions: ${JSON.stringify(state.factions, null, 2)}
Locations: ${JSON.stringify(state.locations, null, 2)}
Races: ${JSON.stringify(state.races, null, 2)}
History: ${JSON.stringify(state.history, null, 2)}
Magic: ${JSON.stringify(state.magic, null, 2)}

Check for:
1. Factions mentioned in history actually exist in factions list
2. Locations referenced are defined
3. Races mentioned are consistent
4. Magic system aligns with world tone
5. Historical events make logical sense
6. No contradictions between sections
7. Names and terminology are consistent across all sections

Return issues only if they are significant. Minor stylistic differences are acceptable.
If the world is consistent, set isConsistent to true and return empty issues array.

Focus on:
- Critical issues: Direct contradictions, missing references, logical impossibilities
- Warnings: Minor inconsistencies, potential improvements

Be thorough but practical. A world doesn't need to be perfect, just coherent.
  `.trim();
}



