# Настройки API

## Обзор

Фича настроек позволяет управлять подключением к OpenRouter, выбором модели и языковыми настройками.

## Структура (FSD)

```
frontend/src/features/settings/
├── index.ts           # Публичный API
├── model/
│   ├── index.ts       # Экспорт модели
│   ├── effects.ts     # Эффекты для работы с API
│   ├── events.ts      # События (openSettings, closeSettings)
│   ├── stores.ts      # Сторы ($settings, $models, $isSettingsOpen)
│   ├── types.ts       # Реэкспорт типов из shared
│   └── init.ts        # Связи между эффектами и сторами
└── ui/
    ├── index.ts
    ├── settings-drawer.tsx      # Боковая панель настроек
    ├── tabs-system.tsx          # Система табов
    ├── api-section.tsx          # Секция API (токены, модели)
    ├── interface-section.tsx    # Секция интерфейса (языки)
    ├── token-list.tsx           # Список токенов
    ├── model-select.tsx         # Выбор модели
    ├── settings-group.tsx       # Группа настроек модели
    └── provider-order-select.tsx # Выбор порядка провайдеров
```

### Типы данных

**Расположение:** `shared/types/settings.ts`

- `ApiToken` - метаданные токена (id, name, isActive)
- `CreateTokenRequest` - запрос на создание токена
- `UpdateTokenRequest` - запрос на обновление токена
- `ApiSettings` - настройки API (provider, tokens, model, providerOrder)
- `RagSettings`, `EmbeddingSettings`, `ResponseGenerationSettings` - настройки моделей для задач
- `OpenRouterModel` - модель OpenRouter
- `LLMOutputLanguage` - язык генерации контента ('ru' | 'en')
- `OPENROUTER_PROVIDERS` - список доступных провайдеров

### Backend

**Сервис:** `src/services/api-settings.service.ts`

| Метод | Описание |
|-------|----------|
| `getSettings()` | Получить настройки без реальных значений токенов |
| `updateSettings()` | Обновить настройки |
| `addToken()` | Добавить новый токен |
| `updateToken()` | Обновить название токена |
| `deleteToken()` | Удалить токен |
| `activateToken()` | Активировать токен |
| `getActiveToken()` | Получить значение активного токена (только backend) |

**API эндпоинты:** `src/api/api-settings.api.ts`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/api-settings` | Получить настройки |
| POST | `/api/api-settings` | Обновить настройки |
| POST | `/api/api-settings/tokens` | Добавить токен |
| PUT | `/api/api-settings/tokens/:id` | Обновить токен |
| DELETE | `/api/api-settings/tokens/:id` | Удалить токен |
| PUT | `/api/api-settings/tokens/:id/activate` | Активировать токен |

### Frontend Model

**Расположение:** `frontend/src/features/settings/model/`

Эффекты:
- `loadSettingsFx` - загрузка настроек
- `saveSettingsFx` - сохранение настроек
- `addTokenFx` - добавление токена
- `updateTokenFx` - обновление токена
- `deleteTokenFx` - удаление токена
- `activateTokenFx` - активация токена
- `loadModelsFx` - загрузка списка моделей

События:
- `openSettings` - открыть панель настроек
- `closeSettings` - закрыть панель настроек
- `resetSettings` - сбросить настройки

Сторы:
- `$settings` - текущие настройки
- `$models` - список моделей OpenRouter
- `$modelsLoading` - состояние загрузки моделей
- `$modelsError` - ошибка загрузки моделей
- `$isSettingsOpen` - состояние открытия панели
- `$tokenOperationPending` - состояние операций с токенами

### UI компоненты

**Расположение:** `frontend/src/features/settings/ui/`

- `SettingsDrawer` - боковая панель (drawer) с настройками
- `TabsSystem` - система табов (API и Модели / Интерфейс)
- `ApiSection` - секция API (токены, модели, провайдеры)
- `InterfaceSection` - секция интерфейса (язык UI + язык LLM)
- `TokenList` - управление токенами
- `ModelSelect` - автокомплит для выбора модели
- `SettingsGroup` - группа настроек модели (RAG, Embedding, Response Generation)
- `ProviderOrderSelect` - выбор порядка провайдеров OpenRouter

## Использование

```tsx
import { SettingsDrawer, openSettings, $settings } from '@features/settings';

// Открыть панель настроек
openSettings();

// Использовать настройки
const settings = useUnit($settings);
```

## Безопасность

- Реальные значения токенов хранятся только на бэкенде
- Фронтенд получает только метаданные токенов (id, name, isActive)
- Токены передаются на бэкенд только при создании
