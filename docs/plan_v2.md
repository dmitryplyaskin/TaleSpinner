# WorldCreationV2 - Подробная гайд-спецификация

## Обзор архитектуры

Новая система создания миров, полностью независимая от существующей реализации. Использует HITL (Human-in-the-Loop) паттерн с LangGraph.js для оркестрации агентов.

---

## 1. Структура проекта

### Backend (`src/services/world-creation-v2/`)

```
world-creation-v2/
├── index.ts                    # Экспорт сервиса
├── world-creation-v2.service.ts # Основной сервис
├── schemas/
│   ├── index.ts
│   ├── genre.schema.ts         # Zod схема жанров
│   ├── session.schema.ts       # Схема сессии
│   ├── architect.schema.ts     # Схемы для архитектора
│   ├── world-elements.schema.ts # Динамические элементы мира
│   └── clarification.schema.ts # HITL схемы
├── graph/
│   ├── index.ts
│   ├── state.ts                # LangGraph State Annotation
│   ├── world-creation-v2.graph.ts # Основной граф
│   └── nodes/
│       ├── architect.node.ts   # Агент-архитектор
│       └── elements.node.ts    # Генерация элементов
├── db/
│   ├── index.ts
│   ├── session.repository.ts   # PGLite репозиторий сессий
│   └── migrations.ts           # SQL миграции
└── prompts/
    ├── architect.prompt.ts
    └── elements.prompt.ts
```

### Frontend (`frontend/src/features/world-creation-v2/`)

```
world-creation-v2/
├── index.ts
├── api/
│   └── world-creation-v2.api.ts
├── model/
│   ├── index.ts
│   ├── stores.ts               # Effector stores
│   ├── events.ts               # События
│   ├── effects.ts              # API эффекты
│   ├── types.ts                # TypeScript типы
│   └── init.ts                 # Инициализация
└── ui/
    ├── index.ts
    ├── wizard/
    │   └── wizard-v2.tsx       # Основной компонент
    ├── steps/
    │   ├── genre-step.tsx      # Шаг 1: Выбор жанра
    │   ├── input-step.tsx      # Шаг 2: Ввод описания
    │   ├── architect-step.tsx  # Шаг 3: HITL с архитектором
    │   ├── generation-step.tsx # Шаг 4: Генерация элементов
    │   └── review-step.tsx     # Шаг 5: Финальный просмотр
    └── components/
        ├── glass-card.tsx      # Glassmorphism компонент
        ├── question-panel.tsx  # Панель вопросов HITL
        ├── dynamic-form.tsx    # Динамическая форма из JSON
        └── progress-indicator.tsx
```

### Shared Types (`shared/types/world-creation-v2.ts`)

---

## 2. Zod Схемы (Backend)

### 2.1 Жанры сюжета

```typescript
// schemas/genre.schema.ts
import { z } from "zod";

export const GenreSchema = z.enum([
  "adventure",
  "mystery",
  "slice_of_life",
  "horror",
  "romance",
  "drama",
  "action",
  "thriller",
  "comedy",
  "survival",
  "political_intrigue",
  "heist",
]);

export type Genre = z.infer<typeof GenreSchema>;

export const GenreMetadata: Record<
  Genre,
  { label: string; description: string; icon: string }
> = {
  adventure: {
    label: "Приключение",
    description: "Путешествия, квесты, исследования",
    icon: "compass",
  },
  mystery: {
    label: "Детектив",
    description: "Расследования, загадки, тайны",
    icon: "search",
  },
  slice_of_life: {
    label: "Повседневность",
    description: "Спокойная жизнь, отношения",
    icon: "coffee",
  },
  horror: {
    label: "Хоррор",
    description: "Страх, выживание, угрозы",
    icon: "ghost",
  },
  romance: {
    label: "Романтика",
    description: "Любовь, эмоциональные связи",
    icon: "heart",
  },
  drama: {
    label: "Драма",
    description: "Конфликты, развитие персонажей",
    icon: "theater",
  },
  action: { label: "Экшен", description: "Бои, погони, динамика", icon: "zap" },
  thriller: {
    label: "Триллер",
    description: "Напряжение, опасность, интриги",
    icon: "alert",
  },
  comedy: {
    label: "Комедия",
    description: "Юмор, абсурд, лёгкость",
    icon: "smile",
  },
  survival: {
    label: "Выживание",
    description: "Суровые условия, ресурсы",
    icon: "shield",
  },
  political_intrigue: {
    label: "Интриги",
    description: "Политика, заговоры, власть",
    icon: "crown",
  },
  heist: {
    label: "Ограбление",
    description: "Планирование, операции",
    icon: "key",
  },
};
```

### 2.2 Сессия создания мира

```typescript
// schemas/session.schema.ts
import { z } from "zod";
import { GenreSchema } from "./genre.schema";

export const SessionStatusSchema = z.enum([
  "genre_selected",
  "input_provided",
  "architect_working",
  "architect_asking",
  "skeleton_ready",
  "elements_generating",
  "elements_asking",
  "completed",
  "saved",
]);

export const SessionSchema = z.object({
  id: z.string().uuid(),
  status: SessionStatusSchema,
  genre: GenreSchema,
  userInput: z.string(),
  architectIterations: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
```

### 2.3 Архитектор - Скелет мира

```typescript
// schemas/architect.schema.ts
import { z } from "zod";

// Вопрос с вариантами ответов для HITL
export const ArchitectQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    )
    .length(3),
  allowCustomAnswer: z.boolean().default(true),
});

// Запрос уточнений от архитектора
export const ArchitectClarificationSchema = z.object({
  type: z.literal("architect_clarification"),
  reason: z.string(),
  questions: z.array(ArchitectQuestionSchema).min(1).max(5),
  iteration: z.number(),
});

// Скелет мира - основа для дальнейшей генерации
export const WorldSkeletonSchema = z.object({
  name: z.string(),
  setting: z
    .string()
    .describe("Тип сеттинга: fantasy, sci-fi, modern, post-apocalyptic и т.д."),
  era: z.string().describe("Эпоха/временной период"),
  tone: z.string().describe("Общий тон мира"),
  coreConflict: z.string().describe("Центральный конфликт мира"),
  uniqueFeatures: z.array(z.string()).describe("Уникальные особенности мира"),
  worldPrimer: z.string().describe("Краткое описание мира 2-3 абзаца"),

  // Что именно нужно сгенерировать (определяется агентом)
  elementsToGenerate: z.array(
    z.enum([
      "locations",
      "factions",
      "religions",
      "races",
      "magic_system",
      "technology",
      "history",
      "economy",
      "culture",
      "creatures",
      "notable_characters",
    ])
  ),
});

export type ArchitectQuestion = z.infer<typeof ArchitectQuestionSchema>;
export type ArchitectClarification = z.infer<
  typeof ArchitectClarificationSchema
>;
export type WorldSkeleton = z.infer<typeof WorldSkeletonSchema>;
```

### 2.4 Динамические элементы мира

```typescript
// schemas/world-elements.schema.ts
import { z } from "zod";

// Базовая структура для любого элемента мира
export const WorldElementBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

// Динамическая схема элемента с произвольными полями
export const DynamicWorldElementSchema = WorldElementBaseSchema.extend({
  fields: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

// Категория элементов мира
export const WorldElementCategorySchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categoryDescription: z.string(),
  elements: z.array(DynamicWorldElementSchema),
});

// Полный результат генерации мира
export const GeneratedWorldSchema = z.object({
  skeleton: z.lazy(() => WorldSkeletonSchema),
  categories: z.array(WorldElementCategorySchema),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    totalElements: z.number(),
    generationTime: z.number(),
  }),
});

// Ответ пользователя на вопросы при генерации элементов
export const ElementsClarificationResponseSchema = z.object({
  requestId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type WorldElementBase = z.infer<typeof WorldElementBaseSchema>;
export type DynamicWorldElement = z.infer<typeof DynamicWorldElementSchema>;
export type WorldElementCategory = z.infer<typeof WorldElementCategorySchema>;
export type GeneratedWorld = z.infer<typeof GeneratedWorldSchema>;
```

---

## 3. LangGraph State и Graph

### 3.1 State Annotation

```typescript
// graph/state.ts
import { Annotation } from "@langchain/langgraph";
import type { Genre } from "../schemas/genre.schema";
import type {
  WorldSkeleton,
  ArchitectClarification,
} from "../schemas/architect.schema";
import type { WorldElementCategory } from "../schemas/world-elements.schema";

const appendReducer = <T>(current: T[], update: T[]): T[] => [
  ...current,
  ...update,
];
const replaceReducer = <T>(current: T, update: T): T => update ?? current;

export const WorldCreationV2State = Annotation.Root({
  // Входные данные
  sessionId: Annotation<string>(),
  genre: Annotation<Genre>(),
  userInput: Annotation<string>(),

  // Архитектор
  skeleton: Annotation<WorldSkeleton | null, WorldSkeleton | null>({
    value: replaceReducer,
    default: () => null,
  }),
  architectIterations: Annotation<number, number>({
    value: replaceReducer,
    default: () => 0,
  }),

  // HITL
  pendingClarification: Annotation<
    ArchitectClarification | null,
    ArchitectClarification | null
  >({
    value: replaceReducer,
    default: () => null,
  }),
  clarificationHistory: Annotation<
    Array<{ question: string; answer: string }>,
    Array<{ question: string; answer: string }>
  >({
    value: appendReducer,
    default: () => [],
  }),

  // Генерация элементов
  generatedCategories: Annotation<
    WorldElementCategory[],
    WorldElementCategory[]
  >({
    value: appendReducer,
    default: () => [],
  }),
  currentElementType: Annotation<string, string>({
    value: replaceReducer,
    default: () => "",
  }),

  // Прогресс и ошибки
  currentPhase: Annotation<string, string>({
    value: replaceReducer,
    default: () => "init",
  }),
  errors: Annotation<string[], string[]>({
    value: appendReducer,
    default: () => [],
  }),
});

export type WorldCreationV2StateType = typeof WorldCreationV2State.State;
```

### 3.2 Граф генерации

```typescript
// graph/world-creation-v2.graph.ts
import { StateGraph, END, interrupt, MemorySaver } from "@langchain/langgraph";
import { WorldCreationV2State, type WorldCreationV2StateType } from "./state";
import { architectNode } from "./nodes/architect.node";
import { elementsNode } from "./nodes/elements.node";

const MAX_ARCHITECT_ITERATIONS = 3;

function shouldContinueArchitect(
  state: WorldCreationV2StateType
): "architect" | "generateElements" {
  // Если есть pending clarification - ждём ответа пользователя
  if (state.pendingClarification) {
    return "architect"; // interrupt произойдёт в node
  }

  // Если скелет готов - переходим к генерации элементов
  if (state.skeleton) {
    return "generateElements";
  }

  return "architect";
}

function shouldContinueElements(
  state: WorldCreationV2StateType
): "generateElements" | "end" {
  if (state.pendingClarification) {
    return "generateElements";
  }

  // Проверяем, все ли элементы сгенерированы
  const elementsToGenerate = state.skeleton?.elementsToGenerate ?? [];
  const generatedTypes = state.generatedCategories.map((c) => c.categoryId);
  const allGenerated = elementsToGenerate.every((e) =>
    generatedTypes.includes(e)
  );

  return allGenerated ? "end" : "generateElements";
}

export function createWorldCreationV2Graph(checkpointer: MemorySaver) {
  const workflow = new StateGraph(WorldCreationV2State)
    .addNode("architect", architectNode)
    .addNode("generateElements", elementsNode)

    .addEdge("__start__", "architect")
    .addConditionalEdges("architect", shouldContinueArchitect, {
      architect: "architect",
      generateElements: "generateElements",
    })
    .addConditionalEdges("generateElements", shouldContinueElements, {
      generateElements: "generateElements",
      end: END,
    });

  return workflow.compile({ checkpointer });
}
```

### 3.3 Architect Node с interrupt

```typescript
// graph/nodes/architect.node.ts
import { interrupt } from "@langchain/langgraph";
import { generateObject } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { WorldCreationV2StateType } from "../state";
import {
  WorldSkeletonSchema,
  ArchitectClarificationSchema,
} from "../../schemas/architect.schema";
import { architectPrompt } from "../../prompts/architect.prompt";

export async function architectNode(
  state: WorldCreationV2StateType
): Promise<Partial<WorldCreationV2StateType>> {
  const { genre, userInput, clarificationHistory, architectIterations } = state;

  // Сначала пытаемся создать скелет или определить нужны ли уточнения
  const analysisResult = await generateObject({
    model: openrouter("anthropic/claude-sonnet-4"),
    schema: z.object({
      needsClarification: z.boolean(),
      clarification: ArchitectClarificationSchema.optional(),
      skeleton: WorldSkeletonSchema.optional(),
    }),
    prompt: architectPrompt(genre, userInput, clarificationHistory),
  });

  // Если нужны уточнения и не превышен лимит
  if (analysisResult.object.needsClarification && architectIterations < 3) {
    const clarification = analysisResult.object.clarification!;

    // Прерываем граф и ждём ответа пользователя
    const userResponse = interrupt(clarification);

    // После resume - обрабатываем ответ
    const newHistory = clarification.questions.map((q, i) => ({
      question: q.question,
      answer: userResponse.answers[q.id] || "",
    }));

    return {
      clarificationHistory: newHistory,
      architectIterations: architectIterations + 1,
      pendingClarification: null,
      currentPhase: "architect_processing",
    };
  }

  // Скелет готов
  return {
    skeleton: analysisResult.object.skeleton!,
    pendingClarification: null,
    currentPhase: "skeleton_ready",
  };
}
```

---

## 4. PGLite Схема БД

```typescript
// db/migrations.ts
export const migrations = `
  CREATE TABLE IF NOT EXISTS world_creation_v2_sessions (
    id UUID PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    user_input TEXT,
    skeleton JSONB,
    generated_world JSONB,
    langgraph_thread_id VARCHAR(255),
    architect_iterations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE IF NOT EXISTS world_creation_v2_clarifications (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES world_creation_v2_sessions(id),
    clarification_type VARCHAR(50),
    request JSONB,
    response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE INDEX idx_sessions_status ON world_creation_v2_sessions(status);
`;
```

---

## 5. API Endpoints

```typescript
// api/world-creation-v2/index.ts
const routerBuilder = new RouterBuilder();

// POST /api/v2/world-creation/session - Создать сессию с выбранным жанром
routerBuilder.addRoute({
  path: "/v2/world-creation/session",
  method: "POST",
  handler: async (req, res) => {
    const { genre } = req.body;
    const session = await worldCreationV2Service.createSession(genre);
    res.json(session);
  },
});

// POST /api/v2/world-creation/:sessionId/start - Начать генерацию с пользовательским вводом
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/start",
  method: "POST",
  handler: async (req, res) => {
    const { sessionId } = req.params;
    const { userInput } = req.body;
    const result = await worldCreationV2Service.startGeneration(
      sessionId,
      userInput
    );
    res.json(result);
  },
});

// POST /api/v2/world-creation/:sessionId/respond - Ответ на HITL вопросы
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/respond",
  method: "POST",
  handler: async (req, res) => {
    const { sessionId } = req.params;
    const { answers } = req.body;
    const result = await worldCreationV2Service.respondToClarification(
      sessionId,
      answers
    );
    res.json(result);
  },
});

// POST /api/v2/world-creation/:sessionId/approve-skeleton - Одобрить скелет
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/approve-skeleton",
  method: "POST",
  handler: async (req, res) => {
    const { sessionId } = req.params;
    const { editedSkeleton } = req.body; // Опционально отредактированный скелет
    const result = await worldCreationV2Service.approveSkeleton(
      sessionId,
      editedSkeleton
    );
    res.json(result);
  },
});

// GET /api/v2/world-creation/:sessionId/status - Получить текущий статус
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/status",
  method: "GET",
  handler: async (req, res) => {
    const { sessionId } = req.params;
    const status = await worldCreationV2Service.getSessionStatus(sessionId);
    res.json(status);
  },
});

// POST /api/v2/world-creation/:sessionId/save - Сохранить финальный мир
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/save",
  method: "POST",
  handler: async (req, res) => {
    const { sessionId } = req.params;
    const { editedWorld } = req.body;
    const result = await worldCreationV2Service.saveWorld(
      sessionId,
      editedWorld
    );
    res.json(result);
  },
});
```

---

## 6. Frontend - Effector Model

### 6.1 Types

```typescript
// model/types.ts
import type { Genre } from "@shared/types/world-creation-v2";

export type WizardStepV2 =
  | "genre" // Шаг 1
  | "input" // Шаг 2
  | "architect" // Шаг 3 (HITL цикл)
  | "skeleton_review" // Шаг 3.5 (просмотр скелета)
  | "generation" // Шаг 4 (генерация элементов)
  | "review"; // Шаг 5 (финальный просмотр)

export interface ArchitectQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; label: string }>;
  allowCustomAnswer: boolean;
}

export interface ClarificationState {
  reason: string;
  questions: ArchitectQuestion[];
  iteration: number;
}
```

### 6.2 Stores

```typescript
// model/stores.ts
import { createStore, combine } from "effector";
import type { WizardStepV2, ClarificationState } from "./types";
import type {
  Genre,
  WorldSkeleton,
  GeneratedWorld,
} from "@shared/types/world-creation-v2";

export const $step = createStore<WizardStepV2>("genre");
export const $sessionId = createStore<string | null>(null);
export const $genre = createStore<Genre | null>(null);
export const $userInput = createStore<string>("");

// Architect HITL
export const $clarification = createStore<ClarificationState | null>(null);
export const $answers = createStore<Record<string, string>>({});
export const $architectIteration = createStore<number>(0);

// Skeleton
export const $skeleton = createStore<WorldSkeleton | null>(null);
export const $editedSkeleton = createStore<WorldSkeleton | null>(null);

// Generated world
export const $generatedWorld = createStore<GeneratedWorld | null>(null);
export const $generationProgress = createStore<{
  current: string;
  completed: string[];
  total: number;
}>({ current: "", completed: [], total: 0 });

// UI
export const $isLoading = createStore<boolean>(false);
export const $error = createStore<string | null>(null);
```

---

## 7. UI Компоненты (Glassmorphism)

### 7.1 Glass Card Component

```typescript
// ui/components/glass-card.tsx
import { Box, type BoxProps } from "@mui/material";

interface GlassCardProps extends BoxProps {
  blur?: number;
  opacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  blur = 10,
  opacity = 0.15,
  sx,
  ...props
}) => (
  <Box
    sx={{
      background: `rgba(255, 255, 255, ${opacity})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius: 3,
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);
```

### 7.2 Dynamic Form для финального шага

```typescript
// ui/components/dynamic-form.tsx
import React from "react";
import {
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import type {
  WorldElementCategory,
  DynamicWorldElement,
} from "@shared/types/world-creation-v2";
import { GlassCard } from "./glass-card";

interface DynamicFormProps {
  categories: WorldElementCategory[];
  onChange: (
    categoryId: string,
    elementId: string,
    field: string,
    value: string
  ) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  categories,
  onChange,
}) => (
  <>
    {categories.map((category) => (
      <GlassCard key={category.categoryId} sx={{ mb: 2 }}>
        <Accordion defaultExpanded sx={{ background: "transparent" }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">{category.categoryName}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {category.elements.map((element) => (
              <ElementEditor
                key={element.id}
                element={element}
                onChange={(field, value) =>
                  onChange(category.categoryId, element.id, field, value)
                }
              />
            ))}
          </AccordionDetails>
        </Accordion>
      </GlassCard>
    ))}
  </>
);
```

---

## 8. Визуальный дизайн

### Цветовая схема (Dark Theme + Glassmorphism)

- **Background**: Градиент `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
- **Glass cards**: `rgba(255, 255, 255, 0.1)` с `backdrop-filter: blur(10px)`
- **Accent**: `#e94560` (красный) для кнопок действий
- **Secondary**: `#4a90a4` (синий) для индикаторов прогресса
- **Text**: `#ffffff` основной, `rgba(255, 255, 255, 0.7)` второстепенный

### Анимации

- Плавные переходы между шагами (300ms ease)
- Fade-in для карточек вопросов
- Pulse-эффект для индикатора загрузки
- Staggered animation для списка элементов

---

## 9. Flow диаграмма

```
[Start] → [Genre Selection] → [User Input] → [Architect Agent]
                                                    ↓
                                          ┌─── Need clarification? ───┐
                                          │                           │
                                          Yes (max 3x)                No
                                          │                           │
                                          ↓                           ↓
                                   [Show Questions]            [Show Skeleton]
                                          │                           │
                                          ↓                           ↓
                                   [User Answers]              [User Approves/Edits]
                                          │                           │
                                          └───────────┬───────────────┘
                                                      ↓
                                            [Elements Generation]
                                                      ↓
                                          ┌─── Need clarification? ───┐
                                          │                           │
                                          Yes                         No
                                          │                           │
                                          ↓                           ↓
                                   [Show Questions]           [Continue/Next Element]
                                          │                           │
                                          └───────────┬───────────────┘
                                                      ↓
                                              [All Elements Done]
                                                      ↓
                                            [Final Review/Edit]
                                                      ↓
                                              [Save to DB]
                                                      ↓
                                                  [Done]
```
