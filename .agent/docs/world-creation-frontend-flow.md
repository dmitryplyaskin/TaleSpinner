# Создание Мира - Процесс на Фронтенде

## Оглавление
1. [Обзор](#обзор)
2. [Архитектура](#архитектура)
3. [Пошаговый Процесс](#пошаговый-процесс)
4. [API Запросы](#api-запросы)
5. [Потоки Данных](#потоки-данных)
6. [Компоненты UI](#компоненты-ui)

---

## Обзор

Процесс создания мира в TaleSpinner - это многошаговый wizard, который использует AI-агенты для генерации богатого игрового мира на основе пользовательского ввода. Процесс полностью управляется состоянием через Effector и включает Human-in-the-Loop (HITL) взаимодействие.

### Основные Этапы:
1. **Выбор Жанра** - пользователь выбирает сеттинг (фэнтези)
2. **Описание Мира** - пользователь описывает желаемый мир
3. **Уточнение Деталей** - AI задает вопросы и показывает скелет мира (паспорт)
4. **Генерация** - AI генерирует полные данные мира
5. **Проверка и Сохранение** - пользователь просматривает, редактирует и сохраняет

---

## Архитектура

### State Management (Effector)

**Основные Stores:**
```typescript
$step         // Текущий шаг wizard: 'setting' | 'input' | 'questions' | 'generating' | 'review'
$sessionId    // ID сессии создания мира
$setting      // Выбранный жанр (по умолчанию 'fantasy')
$userInput    // Текст описания мира от пользователя
$analysis     // Результат анализа пользовательского ввода
$questions    // Список вопросов для уточнения (derived from $analysis)
$answers      // Ответы пользователя на вопросы
$clarificationRequest  // HITL запрос на уточнение во время генерации
$generationProgress    // Прогресс генерации (статус каждого агента)
$worldData    // Сгенерированные данные мира
$error        // Ошибки
```

**Effects (API вызовы):**
```typescript
startSessionFx      // Запуск новой сессии
analyzeInputFx      // Анализ пользовательского ввода
submitAnswersFx     // Отправка ответов на вопросы (deprecated)
startGenerationFx   // Старт генерации (с Architect)
continueGenerationFx // Продолжение генерации после HITL
generateWorldFx     // Получение готового мира
saveWorldFx         // Сохранение мира в БД
```

### Файловая Структура
```
frontend/src/features/world-creation/
├── api/
│   ├── agent-api.ts          # API клиент
│   └── index.ts
├── model/
│   ├── events.ts             # Effector events
│   ├── effects.ts            # Effector effects
│   ├── stores.ts             # Effector stores
│   ├── init.ts               # Связи между событиями (sample)
│   ├── types.ts              # TypeScript типы
│   └── sse.ts                # SSE поддержка
├── ui/
│   ├── wizard/
│   │   └── wizard.tsx        # Главный компонент wizard
│   ├── steps/
│   │   ├── genre-selection.tsx
│   │   ├── world-input.tsx
│   │   ├── question-form.tsx
│   │   ├── skeleton-preview.tsx
│   │   ├── generation-progress.tsx
│   │   └── world-review.tsx
│   └── index.ts
└── index.ts                  # Публичный API фичи
```

---

## Пошаговый Процесс

### Шаг 1: Выбор Жанра (Genre Selection)

**Компонент:** `GenreSelection`  
**Состояние:** `$step = 'setting'`

#### Что происходит:
1. Пользователь видит карточки с жанрами (пока только Fantasy)
2. При клике на жанр:
   - Обновляется `$setting` (setSetting event)
   - Вызывается `startSessionFx({ setting: 'fantasy' })`

#### API Запрос:
```typescript
POST /api/world-creation/agent/start
Body: { setting: 'fantasy' }

Response: {
  sessionId: string  // UUID сессии
}
```

#### Результат:
- `$sessionId` сохраняет ID сессии
- Автоматический переход на шаг `input` (через sample в init.ts)

---

### Шаг 2: Описание Мира (World Input)

**Компонент:** `WorldInput`  
**Состояние:** `$step = 'input'`

#### Что происходит:
1. Пользователь вводит описание мира в текстовое поле
2. Лаконичный интерфейс без лишних кнопок и suggestions.
3. При нажатии "Продолжить":
   - Вызывается `analyzeInputFx({ sessionId, userInput })`

#### API Запрос:
```typescript
POST /api/world-creation/agent/analyze
Body: {
  sessionId: string,
  userInput: string  // Описание мира
}

Response: {
  summary: string,         // Краткое резюме
  questions: Array<{       // Вопросы для уточнения
    id: string,
    question: string,
    type: 'text' | 'choice'
  }>
}
```

#### Результат:
- `$analysis` сохраняет результат анализа
- Автоматически вызывается `startGenerationFx(sessionId)` (через sample)
  - Это запускает LangGraph и Architect Agent

---

### Шаг 3: Уточнение Деталей (Questions / Skeleton Preview)

**Компонент:** `QuestionForm` или `SkeletonPreview`  
**Состояние:** `$step = 'questions'`

#### 3.1 Architect создает скелет мира

После анализа запускается граф генерации:

```typescript
POST /api/world-creation/agent/generate/{sessionId}/start

Response: {
  status: 'waiting_for_input' | 'completed',
  clarification?: ClarificationRequest,
  world?: WorldData
}
```

#### HITL Request - Skeleton Approval

Architect Agent возвращает `clarificationRequest`:

```typescript
{
  id: string,
  context: {
    title: string,
    description: string,    // Описание скелета мира
    currentNode: 'architect',
    reason: string
  },
  fields: [
    { id: 'title', defaultValue: '...' },
    { id: 'synopsis', defaultValue: '...' },
    { id: 'tone', defaultValue: '...' },
    { id: 'themes', defaultValue: '...' },
    {
      id: 'modules',
      type: 'multiselect',
      label: 'Выберите модули',
      defaultValue: ['hasFactions', 'hasLocations', 'hasRaces', ...]
    }
  ],
  options: {
    allowSkip: false,
    submitLabel: 'Применить'
  },
  data: {
    skeleton: WorldSkeleton // Полный объект скелета
  }
}
```

#### Компонент SkeletonPreview

Показывает:
- **Паспорт мира** (редактируемые поля):
  - Название
  - Синопсис
  - Тон и Атмосфера
  - Ключевые темы
- **Модули генерации** (переключатели)
- Текстовое поле для feedback
- Кнопки:
  - "Перегенерировать" (`action: 'refine'`)
  - "Утвердить и Создать" (`action: 'approve'`)

#### При утверждении:

```typescript
continueGenerationFx({
  sessionId: string,
  response: {
    requestId: string,
    skipped: false,
    answers: {
      title: 'Новое Название', // Если изменено
      synopsis: '...',
      modules: ['hasFactions', 'hasLocations', ...],
      feedback: string,
      action: 'approve'  // или 'refine'
    }
  }
})
```

API:
```typescript
POST /api/world-creation/agent/generate/{sessionId}/continue
Body: { response: ClarificationResponse }

Response: {
  status: 'completed' | 'waiting_for_input',
  clarification?: ClarificationRequest,  // Если нужны еще уточнения
  world?: WorldData                      // Если генерация завершена
}
```

#### Результат:
- Если `action: 'approve'` → переход на шаг `generating`
- Если `action: 'refine'` → Architect создает новый скелет

---

### Шаг 4: Генерация Мира (Generation Progress)

**Компонент:** `GenerationProgress`  
**Состояние:** `$step = 'generating'`

#### Что происходит:

1. **SSE Stream подключается:**
```typescript
const eventSource = new EventSource(
  `/api/world-creation/agent/generate/${sessionId}/stream`
)
```

2. **Получение событий через SSE:**
   - Обновление статусов генерации агентов (factions, locations, etc.)
   - HITL запросы (waiting_for_input)

3. **Обновление UI:**
- `$generationProgress` обновляется для каждого агента.
- При HITL запросе показывается модальное окно с вопросом.

4. **Завершение:**
При получении события `type: 'done'`:
```typescript
generateWorldFx({ sessionId })
```

API:
```typescript
POST /api/world-creation/agent/generate
Body: { sessionId: string }

Response: WorldData { ... }
```

#### Результат:
- `$worldData` сохраняет полные данные мира
- Автоматический переход на шаг `review`

---

### Шаг 5: Проверка и Сохранение (World Review)

**Компонент:** `WorldReview`  
**Состояние:** `$step = 'review'`

#### Что происходит:

1. **Режимы Просмотра:**
   - **Read Mode:** Чистый просмотр с красивой типографикой.
   - **Edit Mode:** Переключение в режим редактирования всех полей.

2. **Вкладки:**
   - Обзор
   - Фракции
   - Локации
   - Расы
   - История
   - Магия

3. **Сохранение:**
При клике "Сохранить мир":
```typescript
saveWorldFx({ sessionId, worldData })
```

API:
```typescript
POST /api/world-creation/agent/save
Body: {
  sessionId: string,
  worldData: WorldData
}

Response: void (или success)
```

#### Результат:
- Мир сохраняется в PGlite БД
- Автоматический переход на Welcome Screen (через sample)

---

## API Запросы

### Полный список эндпоинтов:

| Эндпоинт | Метод | Описание | Используется на шаге |
|----------|-------|----------|----------------------|
| `/api/world-creation/agent/start` | POST | Старт сессии | Genre Selection |
| `/api/world-creation/agent/analyze` | POST | Анализ ввода | World Input |
| `/api/world-creation/agent/generate/{sessionId}/start` | POST | Запуск генерации (Architect) | После анализа |
| `/api/world-creation/agent/generate/{sessionId}/continue` | POST | Продолжение после HITL | Questions/Skeleton |
| `/api/world-creation/agent/generate/{sessionId}/stream` | GET (SSE) | Стрим прогресса | Generation Progress |
| `/api/world-creation/agent/generate` | POST | Получение готового мира | После генерации |
| `/api/world-creation/agent/save` | POST | Сохранение мира | World Review |

---

## Потоки Данных

### 1. Успешный Flow (без уточнений)

```
Пользователь → GenreSelection
                    ↓
            startSessionFx()
                    ↓
            [sessionId сохранен] → переход на 'input'
                    ↓
Пользователь → WorldInput (вводит текст)
                    ↓
            analyzeInputFx()
                    ↓
            [analysis сохранен]
                    ↓
            startGenerationFx() (автоматически)
                    ↓
            [Architect возвращает skeleton]
                    ↓
            $clarificationRequest обновлен → переход на 'questions'
                    ↓
Пользователь → SkeletonPreview (редактирует паспорт, выбирает модули, утверждает)
                    ↓
            continueGenerationFx({ action: 'approve', title: '...', ... })
                    ↓
            [status = 'generating'] → переход на 'generating'
                    ↓
            SSE Stream подключен
                    ↓
            [События прогресса обновляют $generationProgress]
                    ↓
            [Событие 'done']
                    ↓
            generateWorldFx()
                    ↓
            [$worldData сохранен] → переход на 'review'
                    ↓
Пользователь → WorldReview (проверяет, редактирует через Edit Mode)
                    ↓
            saveWorldFx()
                    ↓
            [Сохранение завершено] → переход на Welcome
```

---

## Компоненты UI

### Wizard (wizard.tsx)
Главный контейнер, управляющий шагами.

### GenreSelection (genre-selection.tsx)
Выбор жанра.

### WorldInput (world-input.tsx)
Лаконичный ввод описания мира.

### SkeletonPreview (skeleton-preview.tsx)
**Паспорт мира.** Позволяет пользователю вмешаться в процесс архитектуры: изменить название, тон, синопсис и выбрать модули генерации до того, как агенты начнут работу.

### QuestionForm (question-form.tsx)
Универсальная форма для ответов на вопросы агентов.

### GenerationProgress (generation-progress.tsx)
Визуализация процесса генерации с SSE.

### WorldReview (world-review.tsx)
Финальная проверка. Имеет режим чтения и редактирования. Позволяет внести последние правки перед сохранением.

---

## Заключение

Обновленный процесс создания мира ставит пользователя в центр управления (User-Centric Design). Вместо пассивного ожидания, пользователь активно участвует в формировании "скелета" мира на раннем этапе (Architect Phase) и имеет полный контроль над финальным результатом (Review Phase).
