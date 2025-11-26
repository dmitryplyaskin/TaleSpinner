# Выбор жанра при создании мира

## Описание

Экран выбора жанра — первый шаг в мастере создания мира. Позволяет пользователю выбрать один из 6 жанров для ролевой игры.

## Расположение

- Компонент: `frontend/src/features/world-creation/ui/genre-selection/`
- Локализация: `frontend/src/locales/{lang}/world-creation.json`

## Структура FSD

```
frontend/src/features/world-creation/
├── ui/
│   └── genre-selection/
│       ├── genre-selection.tsx    # Основной компонент
│       ├── genre-card.tsx         # Карточка жанра
│       ├── types.ts               # Типы GenreId, GenreOption
│       └── index.ts               # Экспорты
└── index.ts                       # Публичный API фичи
```

## Жанры

| ID | RU | EN |
|----|----|----|
| adventure | Приключения | Adventure |
| mystery | Детектив | Mystery |
| drama | Драма | Drama |
| action | Экшн | Action |
| horror | Ужасы | Horror |
| romance | Романтика | Romance |

## Локализация

Переводы хранятся в namespace `worldCreation`:

```typescript
import { useTranslation } from '@hooks/useTranslation';

const { t } = useTranslation('worldCreation');
t('genreSelection.title'); // "Выберите жанр"
t('genreSelection.genres.adventure.title'); // "Приключения"
```

## Интеграция

Компонент используется в `Wizard.tsx`:

```typescript
import { GenreSelection } from '../../../features/world-creation';

// ...
{step === 'setting' && <GenreSelection />}
```

## Зависимости

- Модель: `@model/agent-wizard` — `$setting`, `setSetting`, `startSessionFx`
- UI: Material UI, анимации через `@mui/material/keyframes`

