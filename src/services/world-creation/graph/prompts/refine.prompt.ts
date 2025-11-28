import type { WorldGenerationStateType } from "../state";

export function buildRefinePrompt(state: WorldGenerationStateType): string {
  const issuesText = state.reviewIssues
    .map(
      (i) => `- [${i.severity.toUpperCase()}] ${i.category}: ${i.description}`
    )
    .join("\n");

  return `
You are a World Refinement Agent. Fix the consistency issues in this world.

Current World:
${JSON.stringify(
  {
    name: state.base?.name,
    genre: state.base?.genre,
    tone: state.base?.tone,
    world_primer: state.base?.world_primer,
    factions: state.factions,
    locations: state.locations,
    races: state.races,
    history: state.history,
    magic: state.magic,
  },
  null,
  2
)}

Issues to fix:
${issuesText}

Instructions:
1. Return the complete refined world with all issues resolved
2. Preserve all existing content that doesn't need changes
3. Only modify what's necessary to fix the issues
4. Maintain the original tone, style, and creativity
5. Ensure all cross-references are now valid
6. Keep names and terminology consistent

For each issue:
- CRITICAL issues MUST be fixed
- WARNING issues should be fixed if possible without major changes

The output should be a complete, valid world data structure.
  `.trim();
}
