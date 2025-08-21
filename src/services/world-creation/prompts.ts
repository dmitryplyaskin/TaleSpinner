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
- Your response must be formatted as valid JSON according to the specified schema.

Create three worlds right now, following all specified requirements and ensuring each offers a completely different RPG experience. Return the result as a JSON object with the specified structure.
`;
};

export const createMoreWorldsPrompt = (userPrompt?: string) => {
  return `
Generate 3 more variations of the game world based on the previous instructions.

${userPrompt ? `User's Specific Requirements: \n${userPrompt}` : ""}

Your response must be formatted as valid JSON according to the specified schema.
`;
};

export const createWorldsPrompt = (data: WorldCustomizationData) => {
  const { title, genre, toneText, synopsis } = data;
  const tone = toneText.split(",").map((t) => t.trim());

  const racesEnabled = data.racesEnabled;

  const racesPrompt = racesEnabled
    ? `## Races
Name ${
        data.racesCount || 3
      }  of the most prominent peoples or species. Briefly describe their fundamental relationship to the world's central conflict or unique feature. Who are the rulers, the oppressed, the forgotten?
${data.racesDescription ? `Description: ${data.racesDescription}` : ""}
`
    : "";

  const timelineEnabled = data.timelineEnabled;
  const timelinePrompt = timelineEnabled
    ? `## World History
Briefly explain the pivotal historical context that shaped the world into what is described in the synopsis. Answer the question "How did things get this way?" in a concise, narrative form.
World History: ${data.timelineDescription}`
    : "";

  const locationsEnabled = data.locationsEnabled;
  const locationsPrompt = locationsEnabled
    ? `## Locations
Name ${
        data.locationsCount || 3
      }  significant locations by name and state their importance. What is the center of power, a place of ancient mystery, or a hotbed of conflict?
${data.locationsDescription ? `Description: ${data.locationsDescription}` : ""}
`
    : "";

  const factionsEnabled = data.factionsEnabled;
  const factionsPrompt = factionsEnabled
    ? `## Factions
Name ${
        data.factionsCount || 3
      }  key groups, orders, or organizations. Summarize their core motivation or role in the world in a single phrase. Who holds the power, who rebels, who seeks forbidden knowledge?
${data.factionsDescription ? `Description: ${data.factionsDescription}` : ""}
`
    : "";

  const elements_to_introduce = [
    ...(racesEnabled ? ["Races"] : []),
    ...(timelineEnabled ? ["Timeline"] : []),
    ...(locationsEnabled ? ["Locations"] : []),
    ...(factionsEnabled ? ["Factions"] : []),
  ];

  return `
# RPG World Primer Generation Prompt

## Role and Expertise
You are a master world-builder and narrative designer. Your core skill is to take a high-level concept and enrich it with foundational lore, creating a cohesive and evocative "World Primer." This primer serves as the definitive source of truth for all future, more detailed world-building.

## Primary Objective
Your task is to expand the user's provided world synopsis into a single, flowing narrative text of about 800-1000 words. This new text, the "World Primer," must seamlessly integrate brief introductions to the key elements selected by the user (Races, History, Factions, Locations). The goal is NOT to create detailed lists, but to weave these concepts into a richer world description that establishes the core truths of the setting.

## Input Data
1.  **Core World Data:**
    *   **Name:** ${title}
    *   **Genre:** ${genre}
    *   **Tone:** ${tone.join(", ")}
    *   **Synopsis:** ${synopsis}

2.  **Elements to Introduce:**
    *   ${elements_to_introduce.join(", ")}

## Guiding Principles

1.  **From Synopsis to Primer:** The **Synopsis** is your starting point. The **World Primer** you create will be the new, expanded source of truth. Every sentence you write must build upon the original idea and align with the established **Genre** and **Tone**.
2.  **Integration, Not Enumeration:** Your primary goal is to create a holistic and readable description of the world. **DO NOT** create bullet points or separate sections for Races, Factions, etc. Instead, mention them organically within the narrative. For example, "The oppressive rule of the [Faction Name] is a direct result of [Historical Event], and is enforced primarily in the capital city of [Location Name], where the subservient [Race Name] toil..."
3.  **Brevity and Intrigue:** For each element you introduce, provide just enough information to establish its existence and importance, creating intrigue and leaving room for future detail. A name and a one-sentence descriptor is often enough (e.g., "...the reclusive Star-Gazers, a faction who believe the calamity was a divine punishment...").
4.  **Establish Connections:** Use this opportunity to explicitly link the different parts of the world. Show cause and effect. History should explain the factions' origins. Locations should be controlled by certain groups or be significant to a particular race.


## Core Generation Task: Weaving the World Primer

Based on the **Elements to Introduce**, incorporate the following concepts into your narrative:
  ${racesPrompt}

  ${timelinePrompt}

  ${locationsPrompt}

  ${factionsPrompt}

Your final output must be a single, cohesive text that reads like a chapter from a campaign setting guide, setting the stage for adventure.

## Final Instruction
Generate the **World Primer** as a single block of text, following all instructions. The output should be structured as a simple JSON object containing this text. Do not use MD formatting in the response. Your response must be formatted as valid JSON according to the specified schema.
`;
};

// Отдельные промпты для дополнительных элементов мира
export const createRacesPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# World Races Detailing

## Context
You are a master world creator. You have been provided with a basic world primer, and now you need to develop the races of this world in detail.

## Basic World Primer:
${worldPrimer}

## Initial race data:
- Number of races: ${data.racesCount || 3}
- User description: ${data.racesDescription || "No special requirements"}

## Task
Create a detailed description of ${
    data.racesCount || 3
  } races for this world. Each race should:
1. Have a unique name
2. Detailed description of appearance and culture (200-300 words)
3. Relationship to the world's central conflict
4. Special abilities or characteristics
5. Social structure and place in the world

The races should organically fit into the established tone and genre of the world.

## Response Format
The response should be formatted as valid JSON according to the specified schema.
`;
};

export const createTimelinePrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# World History Detailing

## Context
You are a master world creator. You have been provided with a basic world primer, and now you need to develop the history of this world in detail.

## Basic World Primer:
${worldPrimer}

## Initial history data:
- User description: ${data.timelineDescription || "No special requirements"}

## Task
Create a detailed timeline of the world's history, including:
1. 5-7 key historical periods or events
2. Each event should include:
   - Name of the period/event
   - Time frame (if applicable)
   - Detailed description (150-200 words)
   - Impact on the current state of the world
3. Logical connection between events
4. Explanation of how history led to the current conflict

The history should explain "How did it all come to this?" and create depth for the world.

## Response Format
The response should be formatted as valid JSON according to the specified schema.
`;
};

export const createMagicPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# Magic System Detailing

## Context
You are a master world creator. You have been provided with a basic world primer, and now you need to develop the magic system of this world in detail.

## Basic World Primer:
${worldPrimer}

## Initial magic data:
- User description: ${data.magicDescription || "No special requirements"}

## Task
Create a detailed magic system, including:
1. Fundamentals of magic - what it is in this world
2. Sources of magical power
3. 3-5 schools or types of magic with descriptions
4. Limitations and cost of using magic
5. Society's attitude towards magic and mages
6. Role of magic in the world's central conflict
7. Known magical artifacts or places of power

The magic system should be logical and match the tone of the world.

## Response Format
The response should be formatted as valid JSON according to the specified schema.
`;
};

export const createLocationsPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# World Locations Detailing

## Context
You are a master world creator. You have been provided with a basic world primer, and now you need to develop the key locations of this world in detail.

## Basic World Primer:
${worldPrimer}

## Initial location data:
- Number of locations: ${data.locationsCount || 3}
- User description: ${data.locationsDescription || "No special requirements"}

## Task
Create a detailed description of ${
    data.locationsCount || 3
  } key locations in the world. Each location should include:
1. Name and type of location (city, ruins, natural area, etc.)
2. Detailed description of appearance (200-300 words)
3. History of the location
4. Current inhabitants and their activities
5. Significance to the world's central conflict
6. Interesting features or secrets
7. Adventure opportunities

Locations should be diverse and create opportunities for different types of gameplay.

## Response Format
The response should be formatted as valid JSON according to the specified schema.
`;
};

export const createFactionsPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# World Factions Detailing

## Context
You are a master world creator. You have been provided with a basic world primer, and now you need to develop the factions of this world in detail.

## Basic World Primer:
${worldPrimer}

## Initial faction data:
- Number of factions: ${data.factionsCount || 3}
- User description: ${data.factionsDescription || "No special requirements"}

## Task
Create a detailed description of ${
    data.factionsCount || 3
  } key factions in the world. Each faction should include:
1. Name and type of organization
2. Core ideology and goals (150-200 words)
3. Structure and hierarchy
4. Key leaders and their characteristics
5. Methods of achieving goals
6. Relationships with other factions
7. Role in the world's central conflict
8. Resources and influence

Factions should create dynamic relationships and opportunities for political intrigue.

## Response Format
The response should be formatted as valid JSON according to the specified schema.
`;
};
