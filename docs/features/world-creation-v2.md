# WorldCreationV2

Новая система создания миров с HITL (Human-in-the-Loop) паттерном.

## Интеграция

Wizard активируется при нажатии кнопки "Создать новый мир":
- Кнопка в `Sidebar` (`frontend/src/components/layout/Sidebar.tsx`)
- Кнопка на `WelcomeScreen` (`frontend/src/components/welcome-screen.tsx`)

Навигация: `goToWorldCreation()` → step `agent-wizard` → `WizardV2`.

Файлы интеграции:
- `frontend/src/App.tsx` - рендеринг `WizardV2`
- `frontend/src/model/app-navigation.ts` - навигационные функции

## Структура

### Backend

```
src/services/world-creation-v2/
├── schemas/           # Zod схемы
├── db/               # PGLite репозиторий
├── graph/            # LangGraph граф
│   ├── state.ts      # State Annotation
│   ├── nodes/        # Ноды графа
│   └── world-creation-v2.graph.ts
├── prompts/          # Промпты для LLM
└── world-creation-v2.service.ts
```

### Frontend

```
frontend/src/features/world-creation-v2/
├── api/              # API функции
├── model/            # Effector stores/events/effects
└── ui/
    ├── components/   # GlassCard, QuestionPanel и др.
    ├── steps/        # Шаги wizard
    └── wizard/       # Основной компонент
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v2/world-creation/genres` | Список жанров |
| POST | `/api/v2/world-creation/session` | Создать сессию |
| GET | `/api/v2/world-creation/:id/status` | Статус сессии |
| POST | `/api/v2/world-creation/:id/start` | Начать генерацию |
| POST | `/api/v2/world-creation/:id/respond` | Ответ на HITL |
| POST | `/api/v2/world-creation/:id/approve-skeleton` | Одобрить скелет |
| POST | `/api/v2/world-creation/:id/save` | Сохранить мир |

## Шаги Wizard

1. **GenreStep** - выбор жанра сюжета (12 вариантов)
2. **InputStep** - ввод описания мира
3. **ArchitectStep** - HITL уточнения (до 3 итераций)
4. **SkeletonStep** - просмотр/редактирование скелета
5. **GenerationStep** - генерация элементов мира
6. **ReviewStep** - финальный просмотр с динамической формой

## Жанры

- adventure, mystery, slice_of_life, horror
- romance, drama, action, thriller
- comedy, survival, political_intrigue, heist

Жанр определяет тип сюжета, не сеттинг мира.

## LangGraph Flow

```
START → architect → [clarification?] → skeleton_ready
                                             ↓
                                    waitForApproval
                                             ↓
                    generateElements ← [approved]
                           ↓
                    [elements_done?] → END
```

## Схемы данных

### WorldSkeleton

```typescript
{
  name: string;
  setting: string;
  era: string;
  tone: string;
  coreConflict: string;
  uniqueFeatures: string[];
  worldPrimer: string;
  elementsToGenerate: WorldElementType[];
}
```

### GeneratedWorld

```typescript
{
  skeleton: WorldSkeleton;
  categories: WorldElementCategory[];
  metadata: GenerationMetadata;
}
```

## База данных

Таблицы:
- `world_creation_v2_sessions` - сессии
- `world_creation_v2_clarifications` - история HITL

