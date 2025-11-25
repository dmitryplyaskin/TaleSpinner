# Отображение сохраненных миров из БД

## Обзор

Функционал отображения сохраненных миров на главном экране приложения. Миры загружаются из PostgreSQL таблицы `worlds`.

## Структура данных

### Таблица `worlds` (PostgreSQL)

| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT | Первичный ключ |
| name | TEXT | Название мира |
| genre | TEXT | Жанр |
| tone | TEXT | Тональность |
| description | TEXT | Описание (world_primer) |
| is_favorite | BOOLEAN | Избранное |
| data | JSONB | Полные данные мира (WorldData) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### Тип `SavedWorld` (`shared/types/saved-world.ts`)

```typescript
interface SavedWorld {
  id: string;
  name: string;
  genre: string;
  tone: string;
  description: string;
  is_favorite: boolean;
  data: WorldData;
  created_at: string;
  updated_at: string;
}
```

## Backend

### Сервис `WorldsService` (`src/services/worlds/worlds.service.ts`)

- `getAllWorlds()` — получение всех миров
- `getWorldById(id)` — получение мира по ID
- `deleteWorld(id)` — удаление мира
- `toggleFavorite(id)` — переключение избранного

### API эндпоинты (`src/api/worlds/index.ts`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/worlds` | Список всех миров |
| GET | `/api/worlds/:id` | Получение мира по ID |
| DELETE | `/api/worlds/:id` | Удаление мира |
| POST | `/api/worlds/:id/favorite` | Переключение избранного |

## Frontend

### Модель (`frontend/src/model/game-sessions.ts`)

- `$savedWorlds` — стор со списком миров
- `loadSavedWorldsFx` — эффект загрузки миров
- `deleteWorldFx` — эффект удаления мира
- `toggleFavoriteFx` — эффект переключения избранного

### Компонент `GameSessionsGrid` (`frontend/src/components/game-sessions-grid.tsx`)

Отображает карточки миров с:
- Названием, жанром, тоном
- Описанием
- Датой создания
- Кнопками: играть, избранное, удалить

Сортировка: избранные миры отображаются первыми.

