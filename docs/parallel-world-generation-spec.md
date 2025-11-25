# Параллельная генерация мира

**Статус:** Реализовано

## Обзор

Генерация мира разделена на этапы:

1. **BaseAgent** — генерирует основу мира (name, genre, tone, world_primer)
2. **Специализированные агенты** — параллельно генерируют детали (factions, locations, races, history, magic)

## Архитектура

```
                    ┌─────────────────┐
                    │   BaseAgent     │
                    │ (name, genre,   │
                    │  tone, primer)  │
                    └────────┬────────┘
                             │
                             ▼
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ FactionsAgent   │ │ LocationsAgent  │ │   RacesAgent    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │   ┌───────────────┼───────────────┐   │
         │   │               │               │   │
         │   ▼               ▼               ▼   │
         │ ┌─────────────────┐ ┌─────────────────┐
         │ │  HistoryAgent   │ │   MagicAgent    │
         │ └────────┬────────┘ └────────┬────────┘
         │          │                   │
         └──────────┴─────────┬─────────┴──────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Merge JSON    │
                    │   + Validate    │
                    └─────────────────┘
```

## Файлы

### Backend — Агенты

- `src/services/world-creation/agents/base.agent.ts` — генерирует основу мира
- `src/services/world-creation/agents/factions.agent.ts` — генерирует фракции
- `src/services/world-creation/agents/locations.agent.ts` — генерирует локации
- `src/services/world-creation/agents/races.agent.ts` — генерирует расы
- `src/services/world-creation/agents/history.agent.ts` — генерирует историю
- `src/services/world-creation/agents/magic.agent.ts` — генерирует магическую систему
- `src/services/world-creation/agents/index.ts` — экспорт всех агентов

### Backend — Сервис

- `src/services/world-creation/agent-world.service.ts` — оркестрация генерации
  - `generateWorld()` — запускает BaseAgent, затем параллельно остальные агенты
  - `generateWithRetry()` — retry логика для отдельных агентов
  - `updateProgress()` — обновление прогресса в БД
  - `getGenerationProgress()` — получение текущего прогресса

### Backend — Схемы

- `src/schemas/world.ts` — Zod-схемы:
  - `BaseWorldDataSchema` — результат BaseAgent
  - `FactionsResultSchema`, `LocationsResultSchema`, `RacesResultSchema`, `HistoryResultSchema`, `MagicResultSchema` — результаты специализированных агентов
  - `GenerationProgressSchema` — статус генерации

### Backend — API

- `src/api/world-create/index.ts`:
  - `GET /world-creation/agent/progress?sessionId=xxx` — получение прогресса генерации

### Frontend — Компоненты

- `frontend/src/components/world-creation/wizard/steps/GenerationProgress.tsx` — визуализация прогресса генерации
- `frontend/src/components/world-creation/wizard/steps/AgentChat.tsx` — интеграция с GenerationProgress

## Прогресс генерации

### Структура

```typescript
interface GenerationProgress {
  base: "pending" | "in_progress" | "completed" | "failed";
  factions: "pending" | "in_progress" | "completed" | "failed";
  locations: "pending" | "in_progress" | "completed" | "failed";
  races: "pending" | "in_progress" | "completed" | "failed";
  history: "pending" | "in_progress" | "completed" | "failed";
  magic: "pending" | "in_progress" | "completed" | "failed";
}
```

### БД

Поле `generation_progress` в таблице `world_generation_sessions` (JSONB).

## Сравнение с предыдущей реализацией

| Метрика           | Старое решение | Новое решение                       |
| ----------------- | -------------- | ----------------------------------- |
| Запросов к LLM    | 1              | 6                                   |
| Токенов на запрос | 8000+          | 500-1500                            |
| Время             | 30-60 сек      | ~15 сек (base) + ~10 сек (parallel) |
| Риск таймаута     | Высокий        | Низкий                              |
| Retry             | Весь мир       | Только упавший агент                |
