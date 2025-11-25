# Пайплайн генерации нового мира

## Обзор

Генерация мира — многоэтапный процесс с использованием LLM-агентов для интерактивного сбора информации и создания детализированного игрового мира. Генерация выполняется параллельно несколькими специализированными агентами.

## Архитектура

```
Frontend (AgentChat) → API → AgentWorldService → Agents → LLMService → OpenRouter
```

**Ключевые компоненты:**
- `AgentWorldService` (`src/services/world-creation/agent-world.service.ts`) — оркестратор
- `AnalysisAgent` (`src/services/world-creation/agents/analysis.agent.ts`) — анализ и сбор данных
- Специализированные агенты генерации:
  - `BaseAgent` (`base.agent.ts`) — основа мира
  - `FactionsAgent` (`factions.agent.ts`) — фракции
  - `LocationsAgent` (`locations.agent.ts`) — локации
  - `RacesAgent` (`races.agent.ts`) — расы
  - `HistoryAgent` (`history.agent.ts`) — история
  - `MagicAgent` (`magic.agent.ts`) — магическая система
- `LLMService` (`src/core/services/llm.service.ts`) — взаимодействие с LLM

## Этапы пайплайна

### 1. Инициализация сессии

```
POST /world-creation/agent/start { setting: "fantasy" }
```

- Создаётся запись в `world_generation_sessions` со статусом `collecting_info`
- Инициализируется `generation_progress` с pending для всех агентов
- Возвращается `sessionId`

### 2. Сбор информации (итеративный)

```
POST /world-creation/agent/analyze { sessionId, userInput }
```

**Цикл:**
1. `AnalysisAgent` анализирует ввод пользователя
2. Извлекает факты о мире → `known_info`
3. Определяет недостающие категории → `missing_info`
4. Генерирует вопросы (3-7 шт.) или устанавливает `is_ready: true`
5. Обновляет `collected_info` в БД

**Категории информации:**
- Основная концепция и тон
- География и локации
- Фракции и политика
- Расы и обитатели
- История и хронология
- Система магии/технологий

**Условия завершения:**
- Пользователь сказал "удиви меня" / "решай сам"
- Собрано достаточно информации

### 3. Ответы на вопросы (альтернативный путь)

```
POST /world-creation/agent/submit-answers { sessionId, answers: Record<string, string> }
```

- Обрабатывает ответы пользователя
- Фильтрует пустые ответы и фразы типа "решай сам"
- Автоматически запускает генерацию

### 4. Генерация мира (параллельная)

```
POST /world-creation/agent/generate { sessionId }
```

**Этап 1: Генерация базы**
- `BaseAgent` создаёт основу мира (name, genre, tone, world_primer)
- Обновляет `generation_progress.base`

**Этап 2: Параллельная генерация деталей**
- Запускаются параллельно через `Promise.all()`:
  - `FactionsAgent` — фракции
  - `LocationsAgent` — локации
  - `RacesAgent` — расы
  - `HistoryAgent` — история
  - `MagicAgent` — магическая система
- Каждый агент обновляет свой статус в `generation_progress`

**Этап 3: Сборка и валидация**
- Объединение результатов всех агентов
- Валидация через `WorldDataSchema` (Zod)
- Сохранение в `generated_world`, статус → `review`

### 5. Отслеживание прогресса

```
GET /world-creation/agent/progress?sessionId=xxx
```

Возвращает текущий статус каждого агента:
```json
{
  "base": "completed",
  "factions": "in_progress",
  "locations": "completed",
  "races": "in_progress",
  "history": "pending",
  "magic": "pending"
}
```

### 6. Сохранение мира

```
POST /world-creation/agent/save { sessionId, worldData }
```

- Валидация `worldData` через `WorldDataSchema`
- Сохранение в таблицу `worlds`
- Статус сессии → `completed`

## Схема данных

### Таблица `world_generation_sessions`
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PK |
| status | enum | collecting_info / generating / review / completed |
| setting | string | Тип сеттинга (fantasy, sci-fi, etc.) |
| collected_info | JSON | Массив собранных фактов |
| user_input | string | Последний ввод пользователя |
| generated_world | JSON | Результат генерации |
| generation_progress | JSON | Статус каждого агента |

### Таблица `worlds`
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | PK |
| name | string | Название мира |
| genre | string | Жанр |
| tone | string | Тон/атмосфера |
| description | string | World primer |
| data | JSON | Полные данные WorldData |

## Диаграмма потока

```
┌─────────────────┐
│  /agent/start   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ /agent/analyze  │◄──────┐
└────────┬────────┘       │
         ▼                │
    is_ready?  ──No──────►┘
         │
        Yes
         ▼
┌─────────────────┐     ┌─────────────────┐
│ /agent/generate │────►│ /agent/progress │ (polling)
└────────┬────────┘     └─────────────────┘
         ▼
┌─────────────────┐
│  /agent/save    │
└────────┬────────┘
         ▼
      [Готово]
```

## Связанные файлы

- API роуты: `src/api/world-create/index.ts`
- Схемы валидации: `src/schemas/world.ts`
- Агенты: `src/services/world-creation/agents/`
- UI компонент: `frontend/src/components/world-creation/wizard/steps/AgentChat.tsx`
- UI прогресса: `frontend/src/components/world-creation/wizard/steps/GenerationProgress.tsx`
