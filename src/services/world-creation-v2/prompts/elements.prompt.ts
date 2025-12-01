import type { WorldSkeleton, WorldElementType } from "../schemas";

/**
 * Метаданные для каждого типа элемента
 */
const ELEMENT_TYPE_INFO: Record<
  WorldElementType,
  {
    name: string;
    description: string;
    fields: string[];
  }
> = {
  locations: {
    name: "Локации",
    description: "Ключевые места мира",
    fields: [
      "type",
      "appearance",
      "atmosphere",
      "significance",
      "secrets",
      "inhabitants",
    ],
  },
  factions: {
    name: "Фракции",
    description: "Организации и группировки",
    fields: [
      "type",
      "ideology",
      "goals",
      "methods",
      "structure",
      "relationships",
      "resources",
    ],
  },
  religions: {
    name: "Религии",
    description: "Верования и культы",
    fields: [
      "deity",
      "beliefs",
      "practices",
      "followers",
      "influence",
      "sacred_places",
    ],
  },
  races: {
    name: "Расы",
    description: "Виды разумных существ",
    fields: [
      "appearance",
      "abilities",
      "culture",
      "society",
      "relationships",
      "history",
    ],
  },
  magic_system: {
    name: "Система магии",
    description: "Магические законы и практики",
    fields: [
      "source",
      "types",
      "limitations",
      "cost",
      "users",
      "artifacts",
      "societal_view",
    ],
  },
  technology: {
    name: "Технологии",
    description: "Технический уровень и инновации",
    fields: [
      "level",
      "key_technologies",
      "limitations",
      "distribution",
      "impact_on_society",
    ],
  },
  history: {
    name: "История",
    description: "Ключевые события прошлого",
    fields: ["era", "event", "causes", "consequences", "impact_on_present"],
  },
  economy: {
    name: "Экономика",
    description: "Экономическая система",
    fields: [
      "currency",
      "trade_routes",
      "resources",
      "industries",
      "wealth_distribution",
    ],
  },
  culture: {
    name: "Культуры",
    description: "Традиции и обычаи",
    fields: [
      "values",
      "traditions",
      "arts",
      "cuisine",
      "celebrations",
      "taboos",
    ],
  },
  creatures: {
    name: "Существа",
    description: "Флора и фауна мира",
    fields: [
      "type",
      "habitat",
      "behavior",
      "abilities",
      "danger_level",
      "uses",
    ],
  },
  notable_characters: {
    name: "Ключевые персонажи",
    description: "Важные NPC мира",
    fields: [
      "role",
      "appearance",
      "personality",
      "goals",
      "background",
      "relationships",
    ],
  },
};

/**
 * Промпт для генерации элементов мира
 */
export function elementsPrompt(
  skeleton: WorldSkeleton,
  elementType: WorldElementType,
  existingCategories: string[]
): string {
  const info = ELEMENT_TYPE_INFO[elementType];

  const contextSection =
    existingCategories.length > 0
      ? `
## Уже сгенерированные элементы:
${existingCategories.join(", ")}

Новые элементы должны быть СОГЛАСОВАНЫ с уже существующими!
`
      : "";

  return `Ты - опытный мироустроитель. Твоя задача - создать ${info.name.toLowerCase()} для игрового мира.

## Мир: ${skeleton.name}
- **Сеттинг**: ${skeleton.setting}
- **Эпоха**: ${skeleton.era}
- **Тон**: ${skeleton.tone}
- **Центральный конфликт**: ${skeleton.coreConflict}

## Описание мира:
${skeleton.worldPrimer}

## Уникальные особенности:
${skeleton.uniqueFeatures.map((f) => `- ${f}`).join("\n")}

${contextSection}

## Задача: Создать ${info.name}

${info.description}. Каждый элемент должен иметь:
- **id**: уникальный идентификатор (например, "loc_tavern_01")
- **name**: название
- **description**: общее описание (1-2 абзаца)
- **fields**: дополнительные поля:
  ${info.fields.map((f) => `- ${f}`).join("\n  ")}

## Правила:
1. Создай 3-5 элементов (не больше, если не указано иное)
2. Каждый элемент должен быть связан с миром и его конфликтом
3. Элементы должны быть разнообразными и интересными
4. Используй уникальные особенности мира
5. Отвечай на том же языке, что и описание мира

Если тебе не хватает информации для создания качественных элементов, можешь задать уточняющие вопросы (установив needsClarification = true).`;
}

/**
 * Получить информацию о типе элемента
 */
export function getElementTypeInfo(elementType: WorldElementType): {
  name: string;
  description: string;
  fields: string[];
} {
  return ELEMENT_TYPE_INFO[elementType];
}

