# World Creation Feature

Фича для создания игровых миров с использованием AI-агентов.

## Расположение

`frontend/src/features/world-creation/`

## Структура FSD

```
features/world-creation/
├── index.ts                    # Публичный API фичи
├── api/                        # API слой
│   ├── index.ts
│   └── agent-api.ts           # HTTP запросы к backend
├── model/                      # Бизнес-логика (Effector)
│   ├── index.ts               # Публичный API модели
│   ├── types.ts               # Типы
│   ├── stores.ts              # Сторы состояния
│   ├── events.ts              # События
│   ├── effects.ts             # Эффекты
│   └── init.ts                # Sample-связи
└── ui/                         # UI компоненты
    ├── index.ts
    ├── wizard/                 # Основной компонент wizard
    │   ├── index.ts
    │   └── wizard.tsx
    ├── steps/                  # Шаги wizard
    │   ├── index.ts
    │   ├── world-input.tsx
    │   ├── question-form.tsx
    │   ├── generation-progress.tsx
    │   └── world-review.tsx
    └── genre-selection/        # Выбор жанра
        ├── index.ts
        ├── genre-selection.tsx
        ├── genre-card.tsx
        └── types.ts
```

## API (`api/`)

HTTP-клиент для взаимодействия с backend.

| Функция | Endpoint | Описание |
|---------|----------|----------|
| `startSession` | POST `/api/world-creation/agent/start` | Старт сессии |
| `analyzeInput` | POST `/api/world-creation/agent/analyze` | Анализ ввода |
| `submitAnswers` | POST `/api/world-creation/agent/submit-answers` | Отправка ответов |
| `generateWorld` | POST `/api/world-creation/agent/generate` | Генерация мира |
| `saveWorld` | POST `/api/world-creation/agent/save` | Сохранение мира |
| `fetchProgress` | GET `/api/world-creation/agent/progress` | Получение прогресса |
| `continueGeneration` | POST `/api/world-creation/agent/generate/:id/continue` | Продолжение HITL |

## Model (`model/`)

Effector-модель для управления состоянием.

### Типы

```typescript
type WizardStep = 'setting' | 'input' | 'questions' | 'generating' | 'review';
```

### Сторы

| Стор | Тип | Описание |
|------|-----|----------|
| `$step` | `WizardStep` | Текущий шаг |
| `$sessionId` | `string \| null` | ID сессии |
| `$setting` | `string` | Выбранный жанр |
| `$userInput` | `string` | Описание мира |
| `$analysis` | `AgentAnalysis \| null` | Результат анализа |
| `$questions` | `AgentQuestion[]` | Вопросы (derived) |
| `$answers` | `Record<string, string>` | Ответы |
| `$generationProgress` | `GenerationProgress` | Прогресс генерации |
| `$clarificationRequest` | `ClarificationRequest \| null` | HITL запрос |
| `$worldData` | `WorldData \| null` | Сгенерированный мир |
| `$error` | `string \| null` | Ошибка |
| `$exitDialogOpen` | `boolean` | Диалог выхода |
| `$isLoading` | `boolean` | Общая загрузка |

### События

- `goToStep`, `nextStep`, `prevStep` — навигация
- `setSetting`, `setUserInput`, `setAnswer` — ввод данных
- `updateWorldData`, `setWorldData` — редактирование мира
- `updateProgress`, `setClarificationRequest` — SSE
- `openExitDialog`, `closeExitDialog`, `resetWizard` — UI
- `clearError`, `setError` — ошибки

### Эффекты

- `startSessionFx`, `analyzeInputFx`, `submitAnswersFx`
- `generateWorldFx`, `saveWorldFx`, `fetchProgressFx`
- `continueGenerationFx`

## UI (`ui/`)

### Wizard

Основной контейнер с Stepper и переключением шагов.

```typescript
import { Wizard } from '@features/world-creation';
```

### Шаги

1. **GenreSelection** — выбор жанра (adventure, mystery, drama, action, horror, romance)
2. **WorldInput** — ввод описания мира
3. **QuestionForm** — уточняющие вопросы от AI
4. **GenerationProgress** — прогресс генерации (SSE streaming)
5. **WorldReview** — просмотр и редактирование результата

## Использование

```typescript
import { Wizard } from './features/world-creation';

// В App.tsx
{currentScreen === 'agent-wizard' && <Wizard />}
```

## SSE Streaming

`GenerationProgress` использует `EventSource` для получения прогресса генерации в реальном времени. События обрабатываются и обновляют `$generationProgress`.

## Локализация

Переводы в `locales/{lang}/world-creation.json`, namespace `worldCreation`.










