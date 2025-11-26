# Agent Wizard Model

Effector-модель для управления состоянием wizard создания мира.

## Расположение

`frontend/src/model/agent-wizard/`

## Структура

```
agent-wizard/
├── index.ts     # Публичный API, sample-связи
├── types.ts     # Типы модели
├── effects.ts   # API эффекты
├── events.ts    # События
└── stores.ts    # Сторы состояния
```

## Типы (`types.ts`)

### WizardStep

```typescript
type WizardStep = 'setting' | 'input' | 'questions' | 'generating' | 'review';
```

### Параметры эффектов

- `StartSessionParams` - `{ setting: string }`
- `AnalyzeInputParams` - `{ sessionId: string; userInput: string }`
- `SubmitAnswersParams` - `{ sessionId: string; answers: Record<string, string> }`
- `GenerateWorldParams` - `{ sessionId: string }`
- `SaveWorldParams` - `{ sessionId: string; worldData: WorldData }`
- `ContinueGenerationParams` - `{ sessionId: string; response: ClarificationResponse }`

## Эффекты (`effects.ts`)

| Эффект | Endpoint | Описание |
|--------|----------|----------|
| `startSessionFx` | POST `/api/world-creation/agent/start` | Старт сессии |
| `analyzeInputFx` | POST `/api/world-creation/agent/analyze` | Анализ ввода |
| `submitAnswersFx` | POST `/api/world-creation/agent/submit-answers` | Отправка ответов |
| `generateWorldFx` | POST `/api/world-creation/agent/generate` | Генерация мира |
| `saveWorldFx` | POST `/api/world-creation/agent/save` | Сохранение мира |
| `fetchProgressFx` | GET `/api/world-creation/agent/progress` | Получение прогресса |
| `continueGenerationFx` | POST `/api/world-creation/agent/generate/:id/continue` | Продолжение после HITL |

## События (`events.ts`)

### Навигация
- `nextStep` - следующий шаг
- `prevStep` - предыдущий шаг
- `goToStep` - переход к конкретному шагу

### Данные
- `setSetting` - выбор сеттинга
- `setUserInput` - ввод описания
- `setAnswer` - ответ на вопрос
- `updateWorldData` - редактирование мира
- `setWorldData` - установка данных мира

### SSE
- `updateProgress` - обновление прогресса генерации
- `setClarificationRequest` - установка HITL запроса

### UI
- `openExitDialog` / `closeExitDialog` - диалог выхода
- `resetWizard` - сброс wizard
- `clearError` / `setError` - управление ошибками

## Сторы (`stores.ts`)

| Стор | Тип | Описание |
|------|-----|----------|
| `$step` | `WizardStep` | Текущий шаг |
| `$sessionId` | `string \| null` | ID сессии |
| `$setting` | `string` | Выбранный сеттинг |
| `$userInput` | `string` | Описание мира |
| `$analysis` | `AgentAnalysis \| null` | Результат анализа |
| `$questions` | `AgentQuestion[]` | Вопросы (derived) |
| `$answers` | `Record<string, string>` | Ответы |
| `$generationProgress` | `GenerationProgress` | Прогресс генерации |
| `$clarificationRequest` | `ClarificationRequest \| null` | HITL запрос |
| `$worldData` | `WorldData \| null` | Сгенерированный мир |
| `$error` | `string \| null` | Ошибка |
| `$exitDialogOpen` | `boolean` | Диалог выхода |
| `$isLoading` | `boolean` | Общая загрузка (derived) |

### Сторы загрузки
- `$isStartingSession`
- `$isAnalyzing`
- `$isSubmittingAnswers`
- `$isGenerating`
- `$isSaving`
- `$isContinuing`

## Sample-связи (`index.ts`)

### Автоматические переходы

1. `startSessionFx.done` → `goToStep('input')`
2. `analyzeInputFx.doneData` (ready) → `goToStep('generating')`
3. `analyzeInputFx.doneData` (questions) → `goToStep('questions')`
4. `submitAnswersFx.doneData` (world) → `setWorldData`, `goToStep('review')`
5. `submitAnswersFx.doneData` (ok) → `goToStep('generating')`
6. `generateWorldFx.done` → `goToStep('review')`
7. `saveWorldFx.done` → `goToWelcome()`

## Использование в компонентах

```typescript
import { useUnit } from 'effector-react';
import {
  $step,
  $setting,
  setSetting,
  startSessionFx,
} from '@model/agent-wizard';

const Component = () => {
  const { step, setting } = useUnit({
    step: $step,
    setting: $setting,
  });
  
  const handleSetSetting = useUnit(setSetting);
  const handleStartSession = useUnit(startSessionFx);
  
  // ...
};
```

## Компоненты

Все компоненты wizard используют модель через `useUnit`:

- `Wizard.tsx` - основной контейнер
- `SettingSelection.tsx` - выбор сеттинга
- `WorldInput.tsx` - ввод описания
- `QuestionForm.tsx` - форма вопросов
- `GenerationProgress.tsx` - прогресс генерации (SSE)
- `WorldReview.tsx` - просмотр и редактирование

## SSE Streaming

`GenerationProgress` использует `EventSource` для получения прогресса генерации. События SSE обрабатываются и эмитят `updateProgress` для обновления `$generationProgress`.

