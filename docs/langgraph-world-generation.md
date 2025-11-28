# LangGraph World Generation

Система генерации миров на основе LangGraph StateGraph.

## Архитектура

```
src/services/world-creation/graph/
├── state.ts                    # WorldGenerationState (Annotation)
├── world-generation.graph.ts   # Сборка графа
├── index.ts                    # Экспорты
├── nodes/
│   ├── base.node.ts           # Генерация основы мира
│   ├── factions.node.ts       # Генерация фракций
│   ├── locations.node.ts      # Генерация локаций
│   ├── races.node.ts          # Генерация рас
│   ├── history.node.ts        # Генерация истории (зависит от factions, locations, races)
│   ├── magic.node.ts          # Генерация магии (зависит от всего выше)
│   ├── review.node.ts         # Проверка консистентности
│   ├── refine.node.ts         # Исправление проблем
│   └── index.ts
├── prompts/
│   ├── base.prompt.ts
│   ├── factions.prompt.ts
│   ├── locations.prompt.ts
│   ├── races.prompt.ts
│   ├── history.prompt.ts
│   ├── magic.prompt.ts
│   ├── review.prompt.ts
│   ├── refine.prompt.ts
│   └── index.ts
└── utils/
    └── clarification.utils.ts  # Утилиты для HITL
```

## Граф выполнения

```
START -> base -> [factions, locations, races] (параллельно) -> history -> magic -> review
review -> (consistent?) -> END
review -> (issues?) -> refine -> review (max 2 итерации)
```

## State

Определён в `state.ts` через `Annotation.Root`:

- Входные данные: `sessionId`, `setting`, `collectedInfo`, `outputLanguage`
- Результаты: `base`, `factions`, `locations`, `races`, `history`, `magic`
- Review: `reviewIssues`, `isConsistent`, `iterationCount`
- HITL: `pendingClarification`, `clarificationHistory`
- Progress: `currentNode`, `errors`

## Human-in-the-Loop

Узлы могут вызывать `interrupt()` для запроса уточнений у пользователя.

Типы: `shared/types/human-in-the-loop.ts`
Схемы: `src/schemas/clarification.ts`
Frontend: `frontend/src/components/clarification/`

## API Endpoints

- `POST /world-creation/agent/generate/:sessionId/start` - запуск генерации
- `POST /world-creation/agent/generate/:sessionId/continue` - продолжение после HITL
- `GET /world-creation/agent/generate/:sessionId/stream` - SSE streaming прогресса

## Использование

```typescript
import { getWorldGenerationGraph } from "./graph";
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = getWorldGenerationGraph(checkpointer);

const result = await graph.invoke(initialState, {
  configurable: { thread_id: sessionId },
});
```

## Frontend интеграция

Компоненты:

- `frontend/src/components/clarification/ClarificationRenderer.tsx` - рендерер динамических форм HITL
- `frontend/src/components/clarification/fields/` - компоненты полей (TextInput, SliderInput, RadioGroup и т.д.)

Интеграция в wizard:

- `GenerationProgress.tsx` - поддерживает SSE streaming и показывает `ClarificationRenderer` при interrupt
- `QuestionForm.tsx` - переходит к `GenerationProgress` для отображения прогресса
