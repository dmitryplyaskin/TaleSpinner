# Экран подготовки к игре

## Описание

Экран отображает полную информацию о сохранённом мире перед началом игры.

## Расположение файлов

- Компонент: `frontend/src/components/world-preparation/world-preparation-screen.tsx`
- Индекс: `frontend/src/components/world-preparation/index.ts`

## Навигация

- Step ID: `world-preparation`
- Branch: `main`
- Функция перехода: `goToWorldPreparation(worldId: string)` в `frontend/src/model/app-navigation.ts`

## Модель данных

- Store: `$selectedWorld` в `frontend/src/model/game-sessions.ts`
- Effect: `loadWorldByIdFx(id: string)` — загружает мир по ID через `/api/worlds/:id`
- Event: `setSelectedWorldId` — триггерит загрузку мира

## Отображаемые данные

Данные берутся из типа `WorldData` (`shared/types/world-data.ts`):

- `world_primer` — описание мира
- `factions` — список фракций (аккордеон)
- `locations` — список локаций (аккордеон)
- `races` — список рас (аккордеон)
- `history` — хронология событий (аккордеон)
- `magic` — магическая система (аккордеон)

## Кнопки

- **Подготовить мир для игры** — пока не реализовано
- **Начать играть** — пока не реализовано

## Локализация

Ключи в `frontend/src/locales/{lang}/common.json`:

- `worldPreparation.worldDescription`
- `worldPreparation.factions`
- `worldPreparation.locations`
- `worldPreparation.races`
- `worldPreparation.history`
- `worldPreparation.magicSystem`
- `worldPreparation.prepareWorld`
- `worldPreparation.startGame`

