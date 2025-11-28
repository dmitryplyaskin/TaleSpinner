# Интеграция LangGraph + Vercel AI SDK

Спецификация для рефакторинга системы генерации миров TaleSpinner.

## Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Зависимости](#зависимости)
3. [Структура файлов](#структура-файлов)
4. [Реализация State](#реализация-state)
5. [Реализация узлов графа](#реализация-узлов-графа)
6. [Сборка графа](#сборка-графа)
7. [Интеграция с API](#интеграция-с-api)
8. [Human-in-the-Loop](#human-in-the-loop)
9. [Миграция существующих агентов](#миграция-существующих-агентов)

---

## Обзор архитектуры

### Текущая архитектура

```
AgentWorldService
    ├── BaseAgent.generate()
    └── Promise.all([
            FactionsAgent.generate(),
            LocationsAgent.generate(),
            RacesAgent.generate(),
            HistoryAgent.generate(),
            MagicAgent.generate()
        ])
```

**Проблемы:**

- Агенты не знают о результатах друг друга
- Нет итеративного улучшения
- Нет проверки консистентности

### Целевая архитектура

```
LangGraph StateGraph
    │
    ├── [START]
    │       │
    │       ▼
    ├── baseNode ──────────────────────────────────┐
    │       │                                      │
    │       ├──────────┬──────────┬───────────────┤
    │       ▼          ▼          ▼               │
    ├── factionsNode  locationsNode  racesNode    │ (параллельно)
    │       │          │          │               │
    │       └──────────┴──────────┴───────────────┤
    │                      │                      │
    │                      ▼                      │
    ├── historyNode ◄──────┴── (зависит от factions, locations, races)
    │       │
    │       ▼
    ├── magicNode ◄────────── (зависит от всего выше)
    │       │
    │       ▼
    ├── reviewNode ◄───────── (проверяет консистентность)
    │       │
    │       ├── [consistent] ──► [END]
    │       │
    │       └── [issues] ──► refineNode ──► reviewNode (цикл, max 2)
```

---

## Зависимости

Уже установлены в `package.json`:

```json
{
  "@langchain/langgraph": "^1.0.2",
  "@langchain/core": "^1.1.0",
  "ai": "^5.0.102",
  "@ai-sdk/openai": "^2.0.72",
  "zod": "^4.1.13"
}
```

---

## Структура файлов

```
src/services/world-creation/
├── graph/
│   ├── index.ts                 # Экспорт графа
│   ├── state.ts                 # Определение WorldState
│   ├── nodes/
│   │   ├── index.ts
│   │   ├── base.node.ts
│   │   ├── factions.node.ts
│   │   ├── locations.node.ts
│   │   ├── races.node.ts
│   │   ├── history.node.ts
│   │   ├── magic.node.ts
│   │   ├── review.node.ts
│   │   └── refine.node.ts
│   ├── prompts/
│   │   ├── index.ts
│   │   ├── base.prompt.ts
│   │   ├── factions.prompt.ts
│   │   └── ...
│   └── world-generation.graph.ts  # Сборка графа
├── agents/                       # [DEPRECATED] Старые агенты
└── agent-world.service.ts        # Рефакторинг под новый граф
```

---

## Реализация State

### Файл: `src/services/world-creation/graph/state.ts`

```typescript
import { Annotation } from "@langchain/langgraph";
import type {
  BaseWorldData,
  Faction,
  Location,
  Race,
  TimelineEvent,
  MagicSystem,
} from "src/schemas/world";
import type { LLMOutputLanguage } from "@shared/types/settings";

// Типы для review
export interface ReviewIssue {
  category:
    | "factions"
    | "locations"
    | "races"
    | "history"
    | "magic"
    | "general";
  description: string;
  severity: "critical" | "warning";
}

// Определение State через Annotation
export const WorldGenerationState = Annotation.Root({
  // === Входные данные ===
  sessionId: Annotation<string>(),
  setting: Annotation<string>(),
  collectedInfo: Annotation<string[]>({
    default: () => [],
    reducer: (current, update) => [...current, ...update],
  }),
  outputLanguage: Annotation<LLMOutputLanguage>({
    default: () => "ru",
  }),

  // === Результаты генерации ===
  base: Annotation<BaseWorldData | null>({
    default: () => null,
  }),
  factions: Annotation<Faction[] | null>({
    default: () => null,
  }),
  locations: Annotation<Location[] | null>({
    default: () => null,
  }),
  races: Annotation<Race[] | null>({
    default: () => null,
  }),
  history: Annotation<TimelineEvent[] | null>({
    default: () => null,
  }),
  magic: Annotation<MagicSystem | null>({
    default: () => null,
  }),

  // === Review & Refinement ===
  reviewIssues: Annotation<ReviewIssue[]>({
    default: () => [],
  }),
  isConsistent: Annotation<boolean>({
    default: () => false,
  }),
  iterationCount: Annotation<number>({
    default: () => 0,
  }),

  // === Progress tracking ===
  currentNode: Annotation<string>({
    default: () => "",
  }),
  errors: Annotation<string[]>({
    default: () => [],
    reducer: (current, update) => [...current, ...update],
  }),
});

export type WorldGenerationStateType = typeof WorldGenerationState.State;
```

---

## Реализация узлов графа

### Базовый паттерн узла

Каждый узел — это async-функция, которая:

1. Получает текущий state
2. Вызывает LLM через Vercel AI SDK
3. Возвращает частичное обновление state

### Файл: `src/services/world-creation/graph/nodes/base.node.ts`

```typescript
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { BaseWorldDataSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildBasePrompt } from "../prompts/base.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function baseNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  const settings = await ApiSettingsService.getInternalSettings();

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: BaseWorldDataSchema,
    prompt: buildBasePrompt(
      state.collectedInfo,
      state.setting,
      state.outputLanguage
    ),
  });

  return {
    base: object,
    currentNode: "base",
  };
}
```

### Файл: `src/services/world-creation/graph/nodes/history.node.ts`

```typescript
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { HistoryResultSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildHistoryPrompt } from "../prompts/history.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function historyNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  // History получает контекст от других агентов
  if (!state.base || !state.factions || !state.locations || !state.races) {
    throw new Error(
      "historyNode requires base, factions, locations, and races"
    );
  }

  const settings = await ApiSettingsService.getInternalSettings();

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: HistoryResultSchema,
    prompt: buildHistoryPrompt({
      base: state.base,
      factions: state.factions,
      locations: state.locations,
      races: state.races,
      collectedInfo: state.collectedInfo,
      outputLanguage: state.outputLanguage,
    }),
  });

  return {
    history: object.history,
    currentNode: "history",
  };
}
```

### Файл: `src/services/world-creation/graph/nodes/review.node.ts`

```typescript
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { WorldGenerationStateType, ReviewIssue } from "../state";
import { ApiSettingsService } from "@services/api-settings.service";

const ReviewResultSchema = z.object({
  isConsistent: z.boolean(),
  issues: z.array(
    z.object({
      category: z.enum([
        "factions",
        "locations",
        "races",
        "history",
        "magic",
        "general",
      ]),
      description: z.string(),
      severity: z.enum(["critical", "warning"]),
    })
  ),
});

export async function reviewNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  const settings = await ApiSettingsService.getInternalSettings();

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const prompt = buildReviewPrompt(state);

  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: ReviewResultSchema,
    prompt,
  });

  return {
    isConsistent: object.isConsistent,
    reviewIssues: object.issues as ReviewIssue[],
    iterationCount: state.iterationCount + 1,
    currentNode: "review",
  };
}

function buildReviewPrompt(state: WorldGenerationStateType): string {
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

Return issues only if they are significant. Minor stylistic differences are acceptable.
If the world is consistent, set isConsistent to true and return empty issues array.
  `;
}
```

### Файл: `src/services/world-creation/graph/nodes/refine.node.ts`

```typescript
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { WorldDataSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { ApiSettingsService } from "@services/api-settings.service";

export async function refineNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  const settings = await ApiSettingsService.getInternalSettings();

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const prompt = buildRefinePrompt(state);

  // Refine возвращает полный WorldData с исправлениями
  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: WorldDataSchema,
    prompt,
  });

  return {
    base: {
      name: object.name,
      genre: object.genre,
      tone: object.tone,
      world_primer: object.world_primer,
    },
    factions: object.factions ?? state.factions,
    locations: object.locations ?? state.locations,
    races: object.races ?? state.races,
    history: object.history ?? state.history,
    magic: object.magic ?? state.magic,
    currentNode: "refine",
  };
}

function buildRefinePrompt(state: WorldGenerationStateType): string {
  const issuesText = state.reviewIssues
    .map((i) => `- [${i.severity}] ${i.category}: ${i.description}`)
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

Return the complete refined world with all issues resolved.
Preserve all existing content that doesn't need changes.
Only modify what's necessary to fix the issues.
  `;
}
```

---

## Сборка графа

### Файл: `src/services/world-creation/graph/world-generation.graph.ts`

```typescript
import { StateGraph, END } from "@langchain/langgraph";
import { WorldGenerationState, type WorldGenerationStateType } from "./state";
import {
  baseNode,
  factionsNode,
  locationsNode,
  racesNode,
  historyNode,
  magicNode,
  reviewNode,
  refineNode,
} from "./nodes";

// Условная функция для review
function shouldRefine(state: WorldGenerationStateType): "refine" | "end" {
  // Максимум 2 итерации рефайнмента
  if (state.iterationCount >= 2) {
    return "end";
  }

  // Если есть критические проблемы — рефайним
  const hasCriticalIssues = state.reviewIssues.some(
    (issue) => issue.severity === "critical"
  );

  if (!state.isConsistent && hasCriticalIssues) {
    return "refine";
  }

  return "end";
}

// Создание графа
export function createWorldGenerationGraph() {
  const workflow = new StateGraph(WorldGenerationState)
    // Добавляем узлы
    .addNode("base", baseNode)
    .addNode("factions", factionsNode)
    .addNode("locations", locationsNode)
    .addNode("races", racesNode)
    .addNode("history", historyNode)
    .addNode("magic", magicNode)
    .addNode("review", reviewNode)
    .addNode("refine", refineNode)

    // Edges: START -> base
    .addEdge("__start__", "base")

    // base -> параллельный запуск factions, locations, races
    .addEdge("base", "factions")
    .addEdge("base", "locations")
    .addEdge("base", "races")

    // factions, locations, races -> history (ждёт всех)
    .addEdge("factions", "history")
    .addEdge("locations", "history")
    .addEdge("races", "history")

    // history -> magic
    .addEdge("history", "magic")

    // magic -> review
    .addEdge("magic", "review")

    // review -> conditional (refine или end)
    .addConditionalEdges("review", shouldRefine, {
      refine: "refine",
      end: END,
    })

    // refine -> review (цикл)
    .addEdge("refine", "review");

  return workflow.compile();
}

// Singleton instance
let graphInstance: ReturnType<typeof createWorldGenerationGraph> | null = null;

export function getWorldGenerationGraph() {
  if (!graphInstance) {
    graphInstance = createWorldGenerationGraph();
  }
  return graphInstance;
}
```

---

## Интеграция с API

### Файл: `src/services/world-creation/agent-world.service.ts` (рефакторинг)

```typescript
import { DbService } from "@core/services/db.service";
import { v4 as uuidv4 } from "uuid";
import {
  WorldDataSchema,
  type WorldData,
  type GenerationProgress,
} from "src/schemas/world";
import { ApiSettingsService } from "@services/api-settings.service";
import { getWorldGenerationGraph } from "./graph/world-generation.graph";
import type { WorldGenerationStateType } from "./graph/state";

export class AgentWorldService {
  private db = DbService.getInstance().getClient();

  async generateWorld(sessionId: string): Promise<WorldData> {
    const session = await this.getSession(sessionId);
    const outputLanguage = await this.getOutputLanguage();

    // Получаем граф
    const graph = getWorldGenerationGraph();

    // Начальное состояние
    const initialState: Partial<WorldGenerationStateType> = {
      sessionId,
      setting: session.setting,
      collectedInfo: session.collected_info,
      outputLanguage,
    };

    // Запускаем граф
    const result = await graph.invoke(initialState);

    // Собираем WorldData из результата
    const worldData: WorldData = {
      name: result.base!.name,
      genre: result.base!.genre,
      tone: result.base!.tone,
      world_primer: result.base!.world_primer,
      factions: result.factions ?? undefined,
      locations: result.locations ?? undefined,
      races: result.races ?? undefined,
      history: result.history ?? undefined,
      magic: result.magic ?? undefined,
    };

    // Валидация
    const validated = WorldDataSchema.parse(worldData);

    // Сохранение в БД
    await this.db.query(
      `UPDATE world_generation_sessions SET generated_world = $1, status = 'review' WHERE id = $2`,
      [JSON.stringify(validated), sessionId]
    );

    return validated;
  }

  // Streaming версия для real-time progress
  async *generateWorldStream(sessionId: string): AsyncGenerator<{
    node: string;
    status: "started" | "completed" | "error";
    data?: Partial<WorldGenerationStateType>;
  }> {
    const session = await this.getSession(sessionId);
    const outputLanguage = await this.getOutputLanguage();

    const graph = getWorldGenerationGraph();

    const initialState: Partial<WorldGenerationStateType> = {
      sessionId,
      setting: session.setting,
      collectedInfo: session.collected_info,
      outputLanguage,
    };

    // Используем stream для получения промежуточных результатов
    for await (const event of await graph.stream(initialState)) {
      for (const [nodeName, nodeOutput] of Object.entries(event)) {
        yield {
          node: nodeName,
          status: "completed",
          data: nodeOutput as Partial<WorldGenerationStateType>,
        };
      }
    }
  }

  private async getSession(sessionId: string) {
    const result = await this.db.query(
      `SELECT * FROM world_generation_sessions WHERE id = $1`,
      [sessionId]
    );
    const session = result.rows[0];
    if (!session) {
      throw new Error("Session not found");
    }
    return {
      ...session,
      collected_info:
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [],
    };
  }

  private async getOutputLanguage() {
    const settings = await ApiSettingsService.getSettings();
    return settings?.llmOutputLanguage || "ru";
  }

  // ... остальные методы без изменений
}
```

---

## Human-in-the-Loop

Система динамического UI для уточняющих вопросов от агентов во время генерации.

### Концепция

```
┌─────────────────────────────────────────────────────────────────┐
│                         LangGraph                                │
│                                                                  │
│   [Agent] ──► interrupt ──► { type: "clarification", ... }      │
│                                    │                             │
│                                    ▼                             │
│                          ┌─────────────────┐                     │
│                          │   JSON Schema   │                     │
│                          │   (вопросы UI)  │                     │
│                          └─────────────────┘                     │
└────────────────────────────────────│─────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│                                                                  │
│   JSON Schema ──► Dynamic Form Renderer ──► User Input          │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  "Какой тон мира вы предпочитаете?"                     │   │
│   │  ○ Мрачный и жестокий                                   │   │
│   │  ○ Эпический и героический                              │   │
│   │  ○ Другое: [____________]                               │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         LangGraph                                │
│                                                                  │
│   User Response ──► resume ──► [Agent continues]                │
└─────────────────────────────────────────────────────────────────┘
```

### Преимущества

| Аспект                | Польза                                                   |
| --------------------- | -------------------------------------------------------- |
| **Гибкость**          | Агент сам решает что спросить, не нужно хардкодить формы |
| **Контекстуальность** | Вопросы зависят от уже сгенерированного контента         |
| **Масштабируемость**  | Один рендерер для любых вопросов                         |
| **Адаптивность**      | Можно менять логику вопросов без изменения фронтенда     |

### Типы данных

#### Файл: `shared/types/human-in-the-loop.ts`

```typescript
// Типы полей формы
export type ClarificationFieldType =
  | "text" // Текстовое поле
  | "textarea" // Многострочный текст
  | "select" // Выбор из списка
  | "multiselect" // Множественный выбор
  | "radio" // Радио-кнопки
  | "checkbox" // Чекбоксы
  | "slider" // Слайдер (1-10)
  | "confirm" // Да/Нет
  | "custom"; // Свободный ввод с подсказкой

// Опция для select/radio/multiselect
export interface ClarificationOption {
  value: string;
  label: string;
  description?: string; // Подсказка при наведении
}

// Поле формы
export interface ClarificationField {
  id: string;
  type: ClarificationFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: ClarificationOption[]; // Для select/radio/multiselect
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number; // Для slider
    max?: number;
  };
  defaultValue?: string | string[] | boolean | number;
  conditional?: {
    dependsOn: string; // id другого поля
    showWhen: string[]; // значения при которых показывать
  };
}

// Запрос уточнения от агента
export interface ClarificationRequest {
  id: string;
  type: "clarification";

  // Контекст для пользователя
  context: {
    title: string; // "Уточнение деталей мира"
    description: string; // "Мне нужно больше информации о..."
    currentNode: string; // "factions" - какой агент спрашивает
    reason: string; // Почему нужно уточнение
  };

  // Поля формы
  fields: ClarificationField[];

  // Опции поведения
  options: {
    allowSkip: boolean; // Можно ли пропустить
    skipLabel?: string; // "Реши сам" / "Пропустить"
    submitLabel: string; // "Продолжить генерацию"
    timeout?: number; // Автоскип через N секунд (опционально)
  };

  // Мета-информация
  meta: {
    generatedAt: string;
    estimatedImpact: "minor" | "moderate" | "significant";
  };
}

// Ответ пользователя
export interface ClarificationResponse {
  requestId: string;
  skipped: boolean;
  answers: Record<string, string | string[] | boolean | number>;
}
```

### Zod-схема для валидации

#### Файл: `src/schemas/clarification.ts`

```typescript
import { z } from "zod";

export const ClarificationFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "slider",
  "confirm",
  "custom",
]);

export const ClarificationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const ClarificationFieldSchema = z.object({
  id: z.string(),
  type: ClarificationFieldTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(ClarificationOptionSchema).optional(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  defaultValue: z
    .union([z.string(), z.array(z.string()), z.boolean(), z.number()])
    .optional(),
  conditional: z
    .object({
      dependsOn: z.string(),
      showWhen: z.array(z.string()),
    })
    .optional(),
});

export const ClarificationRequestSchema = z.object({
  id: z.string(),
  type: z.literal("clarification"),
  context: z.object({
    title: z.string(),
    description: z.string(),
    currentNode: z.string(),
    reason: z.string(),
  }),
  fields: z.array(ClarificationFieldSchema),
  options: z.object({
    allowSkip: z.boolean(),
    skipLabel: z.string().optional(),
    submitLabel: z.string(),
    timeout: z.number().optional(),
  }),
  meta: z.object({
    generatedAt: z.string(),
    estimatedImpact: z.enum(["minor", "moderate", "significant"]),
  }),
});

export type ClarificationRequest = z.infer<typeof ClarificationRequestSchema>;
```

### Примеры запросов уточнения

#### Пример 1: Уточнение тона мира

```json
{
  "id": "clarify-tone-001",
  "type": "clarification",
  "context": {
    "title": "Атмосфера мира",
    "description": "Вы упомянули 'тёмное фэнтези', но я хочу уточнить детали",
    "currentNode": "base",
    "reason": "Разные оттенки тёмного фэнтези требуют разного подхода"
  },
  "fields": [
    {
      "id": "darkness_level",
      "type": "slider",
      "label": "Насколько мрачным должен быть мир?",
      "description": "1 = лёгкая меланхолия, 10 = безнадёжность и ужас",
      "required": true,
      "validation": { "min": 1, "max": 10 },
      "defaultValue": 6
    },
    {
      "id": "violence_level",
      "type": "radio",
      "label": "Уровень насилия в повествовании",
      "required": true,
      "options": [
        {
          "value": "implied",
          "label": "Подразумевается",
          "description": "Насилие происходит 'за кадром'"
        },
        {
          "value": "moderate",
          "label": "Умеренный",
          "description": "Описания без излишних деталей"
        },
        {
          "value": "graphic",
          "label": "Детальный",
          "description": "Реалистичные описания"
        }
      ]
    },
    {
      "id": "hope_exists",
      "type": "confirm",
      "label": "Есть ли в мире надежда на лучшее?",
      "required": true,
      "defaultValue": true
    }
  ],
  "options": {
    "allowSkip": true,
    "skipLabel": "Реши на своё усмотрение",
    "submitLabel": "Продолжить"
  },
  "meta": {
    "generatedAt": "2025-01-15T10:30:00Z",
    "estimatedImpact": "significant"
  }
}
```

#### Пример 2: Выбор между вариантами фракций

```json
{
  "id": "clarify-factions-002",
  "type": "clarification",
  "context": {
    "title": "Конфликт фракций",
    "description": "Я сгенерировал несколько вариантов центрального конфликта",
    "currentNode": "factions",
    "reason": "Выбор повлияет на всю историю мира"
  },
  "fields": [
    {
      "id": "conflict_type",
      "type": "radio",
      "label": "Какой тип конфликта вам ближе?",
      "required": true,
      "options": [
        {
          "value": "religious",
          "label": "Религиозная война",
          "description": "Культ Вечного Пламени vs Хранители Тьмы"
        },
        {
          "value": "political",
          "label": "Борьба за трон",
          "description": "Три королевских дома сражаются за корону"
        },
        {
          "value": "ideological",
          "label": "Идеологическое противостояние",
          "description": "Маги vs Технократы — будущее мира на кону"
        }
      ]
    },
    {
      "id": "custom_conflict",
      "type": "textarea",
      "label": "Или опишите свой вариант",
      "placeholder": "Ваша идея конфликта...",
      "required": false
    }
  ],
  "options": {
    "allowSkip": false,
    "submitLabel": "Выбрать этот конфликт"
  },
  "meta": {
    "generatedAt": "2025-01-15T10:35:00Z",
    "estimatedImpact": "significant"
  }
}
```

#### Пример 3: Уточнение после Review

```json
{
  "id": "clarify-review-003",
  "type": "clarification",
  "context": {
    "title": "Найдено несоответствие",
    "description": "В истории упоминается 'Великая Магическая Война', но в разделе магии нет информации о военном применении магии",
    "currentNode": "review",
    "reason": "Нужно решить как устранить противоречие"
  },
  "fields": [
    {
      "id": "resolution",
      "type": "radio",
      "label": "Как исправить?",
      "required": true,
      "options": [
        {
          "value": "add_war_magic",
          "label": "Добавить боевую магию",
          "description": "Расширить систему магии школой боевых заклинаний"
        },
        {
          "value": "rename_war",
          "label": "Переименовать войну",
          "description": "Это была не магическая война, а война ЗА магию"
        },
        {
          "value": "lost_knowledge",
          "label": "Утерянные знания",
          "description": "Боевая магия существовала, но была забыта после войны"
        }
      ]
    }
  ],
  "options": {
    "allowSkip": true,
    "skipLabel": "Исправь как считаешь нужным",
    "submitLabel": "Применить решение"
  },
  "meta": {
    "generatedAt": "2025-01-15T10:45:00Z",
    "estimatedImpact": "moderate"
  }
}
```

### Интеграция с LangGraph

#### Использование interrupt в узле

```typescript
// src/services/world-creation/graph/nodes/base.node.ts

import { interrupt } from "@langchain/langgraph";
import { generateObject } from "ai";
import { ClarificationRequestSchema } from "src/schemas/clarification";
import type {
  ClarificationRequest,
  ClarificationResponse,
} from "@shared/types/human-in-the-loop";

export async function baseNode(state: WorldGenerationStateType) {
  // Генерируем базовый мир
  const { object: baseWorld } = await generateObject({
    model: openrouter(settings.model),
    schema: BaseWorldDataSchema,
    prompt: buildBasePrompt(state),
  });

  // Проверяем нужно ли уточнение
  if (needsClarification(baseWorld, state.collectedInfo)) {
    // Агент генерирует структуру вопросов
    const clarificationRequest = await generateClarificationRequest(
      baseWorld,
      state
    );

    // Прерываем выполнение и ждём ответа пользователя
    const userResponse: ClarificationResponse = interrupt(clarificationRequest);

    // Продолжаем с ответом пользователя
    if (!userResponse.skipped) {
      return {
        base: refineBaseWorld(baseWorld, userResponse.answers),
        currentNode: "base",
      };
    }
  }

  return { base: baseWorld, currentNode: "base" };
}

// Агент сам генерирует вопросы на основе контекста
async function generateClarificationRequest(
  baseWorld: BaseWorldData,
  state: WorldGenerationStateType
): Promise<ClarificationRequest> {
  const { object } = await generateObject({
    model: openrouter("openai/gpt-4o"),
    schema: ClarificationRequestSchema,
    prompt: `
You are generating a clarification request for the user during world generation.

Current world state:
- Name: ${baseWorld.name}
- Genre: ${baseWorld.genre}
- Tone: ${baseWorld.tone}

User's original input: ${JSON.stringify(state.collectedInfo)}

Determine what clarifications would improve the world quality.
Generate appropriate fields (slider, radio, text, etc.) based on what needs clarification.
Make questions specific, contextual, and engaging.
Questions should be in ${state.outputLanguage === "ru" ? "Russian" : "English"}.

Rules:
- Maximum 3-4 fields per request
- Use radio for choosing between options
- Use slider for degree/intensity questions
- Use confirm for yes/no questions
- Always provide helpful descriptions
    `,
  });

  return object;
}

function needsClarification(
  baseWorld: BaseWorldData,
  collectedInfo: string[]
): boolean {
  // Логика определения нужно ли уточнение
  // Например: если tone слишком общий, или есть противоречия
  const vagueTones = ["fantasy", "dark", "epic"];
  const toneIsVague = vagueTones.some(
    (t) =>
      baseWorld.tone.toLowerCase().includes(t) &&
      baseWorld.tone.split(" ").length < 3
  );

  return toneIsVague || collectedInfo.length < 2;
}
```

### Обновление State для HITL

```typescript
// Добавить в state.ts

export const WorldGenerationState = Annotation.Root({
  // ... существующие поля ...

  // === Human-in-the-Loop ===
  pendingClarification: Annotation<ClarificationRequest | null>({
    default: () => null,
  }),
  clarificationHistory: Annotation<ClarificationResponse[]>({
    default: () => [],
    reducer: (current, update) => [...current, ...update],
  }),
});
```

### API endpoint для HITL

```typescript
// src/api/world-create/world-create.api.ts

import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

// Запуск генерации с поддержкой interrupt
router.post("/generate/:sessionId/start", async (req, res) => {
  const { sessionId } = req.params;
  const graph = getWorldGenerationGraph(checkpointer);

  const config = { configurable: { thread_id: sessionId } };

  try {
    const result = await graph.invoke(initialState, config);

    // Проверяем есть ли interrupt
    const state = await graph.getState(config);

    if (state.next.length > 0) {
      // Граф прерван, ждём ответа пользователя
      res.json({
        status: "waiting_for_input",
        clarification: state.values.pendingClarification,
      });
    } else {
      res.json({
        status: "completed",
        world: result,
      });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Продолжение после ответа пользователя
router.post("/generate/:sessionId/continue", async (req, res) => {
  const { sessionId } = req.params;
  const { response }: { response: ClarificationResponse } = req.body;

  const graph = getWorldGenerationGraph(checkpointer);
  const config = { configurable: { thread_id: sessionId } };

  try {
    // Продолжаем выполнение с ответом пользователя
    const result = await graph.invoke(response, config);

    const state = await graph.getState(config);

    if (state.next.length > 0) {
      res.json({
        status: "waiting_for_input",
        clarification: state.values.pendingClarification,
      });
    } else {
      res.json({
        status: "completed",
        world: result,
      });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
```

### Frontend: Dynamic Form Renderer

#### Файл: `frontend/src/components/clarification/ClarificationRenderer.tsx`

```typescript
import { useState, useMemo } from "react";
import type {
  ClarificationRequest,
  ClarificationResponse,
  ClarificationField,
} from "@shared/types/human-in-the-loop";

interface ClarificationRendererProps {
  request: ClarificationRequest;
  onSubmit: (response: ClarificationResponse) => void;
  onSkip: () => void;
}

export function ClarificationRenderer({
  request,
  onSubmit,
  onSkip,
}: ClarificationRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Инициализация значениями по умолчанию
    const defaults: Record<string, unknown> = {};
    request.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      }
    });
    return defaults;
  });

  // Фильтрация полей с учётом conditional
  const visibleFields = useMemo(() => {
    return request.fields.filter((field) => {
      if (!field.conditional) return true;
      const dependsValue = values[field.conditional.dependsOn];
      return field.conditional.showWhen.includes(String(dependsValue));
    });
  }, [request.fields, values]);

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    onSubmit({
      requestId: request.id,
      skipped: false,
      answers: values as Record<string, string | string[] | boolean | number>,
    });
  };

  const handleSkip = () => {
    onSubmit({
      requestId: request.id,
      skipped: true,
      answers: {},
    });
  };

  // Рендеринг поля по типу
  const renderField = (field: ClarificationField) => {
    switch (field.type) {
      case "text":
        return (
          <TextInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "textarea":
        return (
          <TextareaInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "slider":
        return (
          <SliderInput
            field={field}
            value={values[field.id] as number}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "radio":
        return (
          <RadioGroup
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "confirm":
        return (
          <ConfirmToggle
            field={field}
            value={values[field.id] as boolean}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "select":
        return (
          <SelectInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "multiselect":
        return (
          <MultiSelectInput
            field={field}
            value={values[field.id] as string[]}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "checkbox":
        return (
          <CheckboxGroup
            field={field}
            value={values[field.id] as string[]}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="clarification-card">
      <div className="clarification-header">
        <h2>{request.context.title}</h2>
        <span className="node-badge">{request.context.currentNode}</span>
      </div>

      <p className="clarification-description">{request.context.description}</p>

      <p className="clarification-reason">
        <strong>Причина:</strong> {request.context.reason}
      </p>

      <div className="clarification-fields">
        {visibleFields.map((field) => (
          <div key={field.id} className="field-wrapper">
            <label>{field.label}</label>
            {field.description && (
              <p className="field-description">{field.description}</p>
            )}
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="clarification-actions">
        {request.options.allowSkip && (
          <button className="skip-button" onClick={handleSkip}>
            {request.options.skipLabel || "Пропустить"}
          </button>
        )}
        <button className="submit-button" onClick={handleSubmit}>
          {request.options.submitLabel}
        </button>
      </div>
    </div>
  );
}
```

### Структура файлов для HITL

```
shared/types/
└── human-in-the-loop.ts          # Типы для HITL

src/schemas/
└── clarification.ts               # Zod-схемы для валидации

src/services/world-creation/graph/
├── nodes/
│   └── *.node.ts                  # Узлы с поддержкой interrupt
└── utils/
    └── clarification.utils.ts     # Утилиты для генерации вопросов

frontend/src/components/clarification/
├── ClarificationRenderer.tsx      # Главный рендерер
├── fields/
│   ├── TextInput.tsx
│   ├── TextareaInput.tsx
│   ├── SliderInput.tsx
│   ├── RadioGroup.tsx
│   ├── SelectInput.tsx
│   ├── MultiSelectInput.tsx
│   ├── CheckboxGroup.tsx
│   └── ConfirmToggle.tsx
└── index.ts
```

### Checklist для HITL

- [ ] Создать `shared/types/human-in-the-loop.ts`
- [ ] Создать `src/schemas/clarification.ts`
- [ ] Добавить `pendingClarification` и `clarificationHistory` в State
- [ ] Реализовать `generateClarificationRequest()` утилиту
- [ ] Добавить `interrupt()` в узлы где нужно уточнение
- [ ] Настроить `MemorySaver` checkpointer
- [ ] Создать API endpoints `/start` и `/continue`
- [ ] Реализовать `ClarificationRenderer` на фронтенде
- [ ] Реализовать все компоненты полей
- [ ] Интегрировать с основным UI генерации
- [ ] Тестирование полного цикла HITL

---

## Миграция существующих агентов

### Шаг 1: Извлечение промптов

Переместить промпты из агентов в отдельные файлы:

```typescript
// src/services/world-creation/graph/prompts/base.prompt.ts
import type { LLMOutputLanguage } from "@shared/types/settings";

export function buildBasePrompt(
  knownInfo: string[],
  setting: string,
  outputLanguage: LLMOutputLanguage
): string {
  const languageInstruction =
    outputLanguage === "ru"
      ? "IMPORTANT: Generate ALL content in Russian language."
      : "IMPORTANT: Generate ALL content in English language.";

  return `
You are an expert World Builder specializing in creating foundational world concepts.
Create the base foundation for an RPG world setting (${setting}).

Collected Information:
${JSON.stringify(knownInfo)}

Task:
Generate the core world foundation including:
- name: A memorable and evocative name for the world
- genre: The primary genre (e.g., "Dark Fantasy", "High Fantasy")
- tone: The overall atmosphere and mood
- world_primer: A comprehensive overview (400-600 words)

${languageInstruction}
  `;
}
```

### Шаг 2: Удаление старых агентов

После полной миграции удалить папку `src/services/world-creation/agents/`.

### Шаг 3: Обновление API endpoints

Обновить `src/api/world-create/world-create.api.ts` для поддержки streaming:

```typescript
import { Router } from "express";
import { AgentWorldService } from "@services/world-creation/agent-world.service";

const router = Router();
const service = new AgentWorldService();

// Streaming endpoint
router.get("/generate/:sessionId/stream", async (req, res) => {
  const { sessionId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    for await (const event of service.generateWorldStream(sessionId)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`
    );
  } finally {
    res.end();
  }
});

export default router;
```

---

## Checklist миграции

- [ ] Создать структуру папок `graph/`
- [ ] Реализовать `state.ts`
- [ ] Мигрировать `BaseAgent` → `base.node.ts`
- [ ] Мигрировать `FactionsAgent` → `factions.node.ts`
- [ ] Мигрировать `LocationsAgent` → `locations.node.ts`
- [ ] Мигрировать `RacesAgent` → `races.node.ts`
- [ ] Мигрировать `HistoryAgent` → `history.node.ts` (с зависимостями)
- [ ] Мигрировать `MagicAgent` → `magic.node.ts`
- [ ] Реализовать `review.node.ts` (новый)
- [ ] Реализовать `refine.node.ts` (новый)
- [ ] Собрать граф в `world-generation.graph.ts`
- [ ] Рефакторинг `AgentWorldService`
- [ ] Добавить streaming endpoint
- [ ] Обновить фронтенд для streaming progress
- [ ] Тестирование полного пайплайна
- [ ] Удалить старые агенты

---

## Дополнительные возможности

### Checkpoints (сохранение состояния)

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });

// Запуск с thread_id для возобновления
const result = await graph.invoke(initialState, {
  configurable: { thread_id: sessionId },
});
```

### Параллельные ветки с разными моделями

```typescript
// Использовать разные модели для разных задач
async function factionsNode(state) {
  const openrouter = createOpenRouter({ apiKey });

  // Более креативная модель для фракций
  const { object } = await generateObject({
    model: openrouter("anthropic/claude-3.5-sonnet"),
    schema: FactionsResultSchema,
    prompt: buildFactionsPrompt(state),
    temperature: 0.9, // выше для креативности
  });

  return { factions: object.factions };
}
```
