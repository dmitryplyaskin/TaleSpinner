# 🛠️ Bug Fix: Infinite Loading on Analysis

## Проблема
После анализа инпута фронтенд зависал в состоянии загрузки, хотя в Network tab был виден успешный ответ.
Причина: Backend возвращал `status: "waiting_for_input"`, но поле `clarification` было `undefined`.

## Технические детали
В `AgentWorldService.ts` мы пытались достать `ClarificationRequest` из `state.values.pendingClarification`.
Однако, при использовании функции `interrupt(request)` в LangGraph, значение сохраняется не в `state.values`, а в `state.tasks[0].interrupts[0].value`.

## Решение
Обновил методы `startGeneration`, `continueGeneration` и `generateWorldStream` в `src/services/world-creation/agent-world.service.ts`.
Теперь логика поиска `ClarificationRequest` такая:

```typescript
let clarification = state.values.pendingClarification;

// Если в стейте нет, проверяем interrupts
if (!clarification && state.tasks && state.tasks.length > 0) {
  const interruptValue = state.tasks[0].interrupts?.[0]?.value;
  if (interruptValue) {
    clarification = interruptValue as ClarificationRequest;
  }
}
```

## Результат
Теперь фронтенд должен корректно получать вопросы от Архитектора и переключаться на экран `QuestionForm` или `SkeletonPreview`.
