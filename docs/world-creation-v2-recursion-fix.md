# World Creation V2 - Исправление ошибки рекурсии графа

## Проблема

При запуске генерации мира (`/api/v2/world-creation/:sessionId/start`) возникала ошибка:
```
GraphRecursionError: Recursion limit of 25 reached without hitting a stop condition
```

## Причина

Две связанные проблемы:

### 1. Отсутствие обработки ошибок в условных переходах

В `shouldContinueArchitect` не было обработки состояния ошибки:

```typescript
// Было (неправильно)
function shouldContinueArchitect(state): "architect" | "waitForApproval" {
  if (state.skeleton && state.currentPhase === "skeleton_ready") {
    return "waitForApproval";
  }
  return "architect"; // Возвращает architect даже при ошибке!
}
```

При возникновении ошибки в ноде `architectNode`, она возвращала `currentPhase: "error"`, но условный переход не учитывал это и направлял граф обратно в `architect`, создавая бесконечный цикл.

### 2. Отсутствие API-ключа OpenRouter

`@openrouter/ai-sdk-provider` требует явной передачи API-ключа. Использование `openrouter(modelId)` без ключа вызывало ошибку `LoadAPIKeyError`, которая попадала в catch-блок и возвращала `currentPhase: "error"`.

## Решение

### 1. Добавлена обработка ошибок в `shouldContinueArchitect`

Файл: [`graph/world-creation-v2.graph.ts`](../src/services/world-creation-v2/graph/world-creation-v2.graph.ts)

```typescript
function shouldContinueArchitect(
  state: WorldCreationV2StateType
): "architect" | "waitForApproval" | "end" {
  // Если возникла ошибка - завершаем граф
  if (state.currentPhase === "error") {
    return "end";
  }
  // ...
}
```

Добавлен маршрут `end: END` в `addConditionalEdges`.

### 2. Передача API-ключа в OpenRouter провайдер

Файлы:
- [`graph/nodes/architect.node.ts`](../src/services/world-creation-v2/graph/nodes/architect.node.ts)
- [`graph/nodes/elements.node.ts`](../src/services/world-creation-v2/graph/nodes/elements.node.ts)

Заменено использование `openrouter` на `createOpenRouter`:

```typescript
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const apiSettings = await ApiSettingsService.getInternalSettings();
const apiKey = apiSettings?.token;

if (!apiKey) {
  return {
    errors: ["API ключ OpenRouter не настроен"],
    currentPhase: "error",
  };
}

const openrouter = createOpenRouter({ apiKey });
```

## Дата исправления

2025-12-01

