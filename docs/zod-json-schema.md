# Zod JSON Schema для LLM Response Format

## Обзор

Проект использует Zod 4 для определения схем структурированного вывода LLM. Схемы конвертируются в JSON Schema через `z.toJSONSchema()`.

## Архитектура

### LLMService (`src/core/services/llm.service.ts`)

Сервис принимает `LLMResponseFormat`:

```typescript
interface LLMResponseFormat {
  schema: z.ZodType;
  name: string;
}
```

Метод `zodToResponseFormat()` конвертирует Zod схему в `OpenAI.ResponseFormatJSONSchema`.

### Схемы

#### Общие схемы (`src/services/world-creation/schemas.ts`)

- `DraftWorldSchema`, `draftWorldsResponseFormat` — черновики миров
- `RaceItemSchema`, `racesResponseFormat` — расы
- `TimelineEventItemSchema`, `timelineResponseFormat` — история
- `MagicSchoolItemSchema`, `MagicResponseSchema`, `magicResponseFormat` — магия
- `LocationItemSchema`, `locationsResponseFormat` — локации
- `FactionItemSchema`, `factionsResponseFormat` — фракции
- `MessageSegmentSchema`, `firstMessageResponseFormat` — первое сообщение
- `createWorldPrimerResponseFormat(data)` — динамическая схема primer'а мира

#### Схемы агентов

Каждый агент экспортирует свою схему и responseFormat:

| Файл | Схема | ResponseFormat |
|------|-------|----------------|
| `analysis.agent.ts` | `AnalysisResponseSchema` | `analysisResponseFormat` |
| `base.agent.ts` | `BaseWorldResponseSchema` | `baseWorldResponseFormat` |
| `magic.agent.ts` | `MagicSystemResponseSchema` | `magicSystemResponseFormat` |
| `history.agent.ts` | `HistoryResponseSchema` | `historyResponseFormat` |
| `factions.agent.ts` | `FactionsResponseSchema` | `factionsResponseFormat` |
| `locations.agent.ts` | `LocationsResponseSchema` | `locationsResponseFormat` |
| `races.agent.ts` | `RacesResponseSchema` | `racesResponseFormat` |

## Использование

```typescript
import { z } from "zod";
import { LLMService, LLMResponseFormat } from "@core/services/llm.service";

// Определение схемы
export const MyResponseSchema = z.object({
  field: z.string(),
  items: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })),
});

// Создание responseFormat
export const myResponseFormat: LLMResponseFormat = {
  schema: MyResponseSchema,
  name: "my_response",
};

// Использование
const llm = LLMService.getInstance();
const result = await llm.call({
  messages: [{ role: "user", content: prompt }],
  responseFormat: myResponseFormat,
});
```

## Динамические схемы

Для схем, зависящих от параметров:

```typescript
export const createDynamicResponseFormat = (
  options: Options
): LLMResponseFormat => {
  let schema = BaseSchema;
  
  if (options.includeExtra) {
    schema = schema.extend({
      extra: z.string(),
    });
  }
  
  return {
    schema,
    name: "dynamic_response",
  };
};
```

## Ссылки

- [Zod JSON Schema](https://zod.dev/json-schema)

