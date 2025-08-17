import { WorldType } from "@shared/types/world";
import { WorldCustomizationData } from "@shared/types/world-creation";

export const createDraftWorldsPrompt = (
  worldType: WorldType,
  userPrompt?: string
) => {
  return `
# RPG World Generation Prompt

## Role and Expertise
You are an expert Game Master and world-builder with extensive experience in creating immersive fantasy settings for tabletop role-playing games. Your expertise includes deep knowledge of mythology, history, politics, economics, and narrative design.

## Primary Objective
Create three distinct and compelling world synopses that will serve as foundations for full-scale RPG campaigns. Each world should be unique in tone, setting, and central conflict to provide players with diverse gameplay experiences.

## Requirements for Each Synopsis
- **Length**: 200-400 words
- **Structure**: Clear description of setting, unique world features, and central conflict
- **Style**: Engaging and immersive, written to captivate and intrigue players
- **Uniqueness**: Each world must be dramatically different in genre, theme, and atmosphere

## Mandatory Elements for Each World
1. **World Name** - concise and memorable
2. **Genre and Tone** - clear definition of atmosphere (dark fantasy, high fantasy, steampunk, etc.)
3. **Unique Feature** - what makes this world special and distinct from standard settings 

${userPrompt ? `## User's Specific Requirements: \n${userPrompt}` : ""}

## Additional Guidelines
- Avoid clichés and overused tropes
- Each world should offer different gameplay styles (political intrigue, exploration, combat, mystery)
- Include elements that can lead to long-term campaigns
- Leave enough "blank spaces" for further world development
- Ensure conflicts can be meaningfully addressed by player actions
- Consider diverse cultural inspirations beyond typical European medieval fantasy
- Balance accessibility for new players with depth for experienced groups
- You don't have to impose on the main plot directly. The player can decide to stay out of the conflict, take the evil side, or just go about their business and ignore the world around them, playing the role of an ordinary being.
- Don't use MD formatting in the response.

Create three worlds right now, following all specified requirements and ensuring each offers a completely different RPG experience.
`;
};

export const createMoreWorldsPrompt = (userPrompt?: string) => {
  return `
Generate 3 more variations of the game world based on the previous instructions.

${userPrompt ? `User's Specific Requirements: \n${userPrompt}` : ""}
`;
};

export const createWorldsPrompt = (data: WorldCustomizationData) => {
  const { title, genre, toneText, synopsis } = data;
  const tone = toneText.split(",").map((t) => t.trim());

  const racesEnabled = data.racesEnabled;
  const timelineEnabled = data.timelineEnabled;
  const magicEnabled = data.magicEnabled;
  const factionsEnabled = data.factionsEnabled;

  return `
  # RPG World Generation Prompt

  ## Role and Expertise
  You are an expert Game Master and world-builder with extensive experience in creating immersive fantasy settings for tabletop role-playing games. Your expertise includes deep knowledge of mythology, history, politics, economics, and narrative design.

  ## Primary Objective

  ## Races
  ${racesEnabled ? `Races: ${data.racesCount}` : ""}
  ${racesEnabled ? `Description: ${data.racesDescription}` : ""}

  ## Timeline
  ${timelineEnabled ? `Timeline: ${data.timelineDescription}` : ""}

  ## Magic
  ${magicEnabled ? `Magic: ${data.magicDescription}` : ""}

  ## Factions
  ${factionsEnabled ? `Factions: ${data.factionsCount}` : ""}
  ${factionsEnabled ? `Description: ${data.factionsDescription}` : ""}
  `;
};
