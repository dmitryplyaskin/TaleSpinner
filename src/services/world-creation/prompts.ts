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
# Детализация Рас Мира

## Контекст
Ты мастер-создатель миров. Тебе предоставлен базовый Primer мира, и теперь нужно детально проработать расы этого мира.

## Базовый Primer мира:
${worldPrimer}

## Исходные данные о расах:
- Количество рас: ${data.racesCount || 3}
- Описание от пользователя: ${
    data.racesDescription || "Нет специальных требований"
  }

## Задача
Создай детальное описание ${
    data.racesCount || 3
  } рас этого мира. Каждая раса должна:
1. Иметь уникальное название
2. Подробное описание внешности и культуры (200-300 слов)
3. Отношение к центральному конфликту мира
4. Особые способности или характеристики
5. Социальную структуру и место в мире

Расы должны органично вписываться в установленный тон и жанр мира.

## Формат ответа
Ответ должен быть отформатирован как валидный JSON согласно указанной схеме.
`;
};

export const createTimelinePrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# Детализация Истории Мира

## Контекст
Ты мастер-создатель миров. Тебе предоставлен базовый Primer мира, и теперь нужно детально проработать историю этого мира.

## Базовый Primer мира:
${worldPrimer}

## Исходные данные об истории:
- Описание от пользователя: ${
    data.timelineDescription || "Нет специальных требований"
  }

## Задача
Создай детальную временную линию истории мира, включающую:
1. 5-7 ключевых исторических периодов или событий
2. Каждое событие должно включать:
   - Название периода/события
   - Временные рамки (если применимо)
   - Подробное описание (150-200 слов)
   - Влияние на текущее состояние мира
3. Логическую связь между событиями
4. Объяснение того, как история привела к текущему конфликту

История должна объяснить "Как все дошло до этого?" и создать глубину мира.

## Формат ответа
Ответ должен быть отформатирован как валидный JSON согласно указанной схеме.
`;
};

export const createMagicPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# Детализация Магической Системы

## Контекст
Ты мастер-создатель миров. Тебе предоставлен базовый Primer мира, и теперь нужно детально проработать магическую систему этого мира.

## Базовый Primer мира:
${worldPrimer}

## Исходные данные о магии:
- Описание от пользователя: ${
    data.magicDescription || "Нет специальных требований"
  }

## Задача
Создай детальную магическую систему, включающую:
1. Основы магии - что это такое в этом мире
2. Источники магической силы
3. 3-5 школ или типов магии с описанием
4. Ограничения и цена использования магии
5. Отношение общества к магии и магам
6. Роль магии в центральном конфликте мира
7. Известные магические артефакты или места силы

Магическая система должна быть логичной и соответствовать тону мира.

## Формат ответа
Ответ должен быть отформатирован как валидный JSON согласно указанной схеме.
`;
};

export const createLocationsPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# Детализация Локаций Мира

## Контекст
Ты мастер-создатель миров. Тебе предоставлен базовый Primer мира, и теперь нужно детально проработать ключевые локации этого мира.

## Базовый Primer мира:
${worldPrimer}

## Исходные данные о локациях:
- Количество локаций: ${data.locationsCount || 3}
- Описание от пользователя: ${
    data.locationsDescription || "Нет специальных требований"
  }

## Задача
Создай детальное описание ${
    data.locationsCount || 3
  } ключевых локаций мира. Каждая локация должна включать:
1. Название и тип локации (город, руины, природная зона и т.д.)
2. Подробное описание внешнего вида (200-300 слов)
3. История локации
4. Текущие обитатели и их занятия
5. Значение для центрального конфликта мира
6. Интересные особенности или тайны
7. Возможности для приключений

Локации должны быть разнообразными и создавать возможности для различных типов игрового процесса.

## Формат ответа
Ответ должен быть отформатирован как валидный JSON согласно указанной схеме.
`;
};

export const createFactionsPrompt = (
  data: WorldCustomizationData,
  worldPrimer: string
) => {
  return `
# Детализация Фракций Мира

## Контекст
Ты мастер-создатель миров. Тебе предоставлен базовый Primer мира, и теперь нужно детально проработать фракции этого мира.

## Базовый Primer мира:
${worldPrimer}

## Исходные данные о фракциях:
- Количество фракций: ${data.factionsCount || 3}
- Описание от пользователя: ${
    data.factionsDescription || "Нет специальных требований"
  }

## Задача
Создай детальное описание ${
    data.factionsCount || 3
  } ключевых фракций мира. Каждая фракция должна включать:
1. Название и тип организации
2. Основную идеологию и цели (150-200 слов)
3. Структуру и иерархию
4. Ключевых лидеров и их характеристики
5. Методы достижения целей
6. Отношения с другими фракциями
7. Роль в центральном конфликте мира
8. Ресурсы и влияние

Фракции должны создавать динамичные отношения и возможности для политических интриг.

## Формат ответа
Ответ должен быть отформатирован как валидный JSON согласно указанной схеме.
`;
};
