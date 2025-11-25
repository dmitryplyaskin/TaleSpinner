# Настройки API

## Обзор

Раздел настроек API позволяет управлять подключением к OpenRouter и конфигурацией моделей.

## Структура

### Типы данных

**Расположение:** `shared/types/settings.ts`

- `ApiToken` - метаданные токена (id, name, isActive)
- `CreateTokenRequest` - запрос на создание токена
- `UpdateTokenRequest` - запрос на обновление токена
- `ApiSettings` - настройки API (provider, tokens, model, providerOrder)
- `OpenRouterModel` - модель OpenRouter
- `OPENROUTER_PROVIDERS` - список доступных провайдеров

### Backend

**Сервис:** `src/services/api-settings.service.ts`

Класс `ApiSettingsServiceClass`:
- `getSettings()` - получить настройки без реальных значений токенов
- `updateSettings()` - обновить настройки
- `addToken()` - добавить новый токен
- `updateToken()` - обновить название токена
- `deleteToken()` - удалить токен
- `activateToken()` - активировать токен
- `getActiveToken()` - получить значение активного токена (только для бэкенда)
- `getInternalSettings()` - получить полные настройки с токеном (только для бэкенда)

**API эндпоинты:** `src/api/api-settings.api.ts`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/api-settings` | Получить настройки |
| POST | `/api/api-settings` | Обновить настройки |
| POST | `/api/api-settings/tokens` | Добавить токен |
| PUT | `/api/api-settings/tokens/:id` | Обновить токен |
| DELETE | `/api/api-settings/tokens/:id` | Удалить токен |
| PUT | `/api/api-settings/tokens/:id/activate` | Активировать токен |

**OpenRouter API:** `src/api/openrouter.api.ts`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/openrouter/models` | Получить список моделей |

### Frontend

**Модель:** `frontend/src/model/settings.ts`

Эффекты:
- `loadSettingsFx` - загрузка настроек
- `saveSettingsFx` - сохранение настроек
- `addTokenFx` - добавление токена
- `updateTokenFx` - обновление токена
- `deleteTokenFx` - удаление токена
- `activateTokenFx` - активация токена
- `loadModelsFx` - загрузка списка моделей

Сторы:
- `$settings` - текущие настройки
- `$models` - список моделей OpenRouter
- `$modelsLoading` - состояние загрузки моделей
- `$modelsError` - ошибка загрузки моделей
- `$tokenOperationPending` - состояние операций с токенами

**Компоненты:** `frontend/src/components/settings-modal/`

- `TokenManager` - управление токенами (добавление, редактирование, удаление, активация)
- `ModelSelect` - выбор модели с автокомплитом
- `ProviderOrderSelect` - мультиселект провайдеров для provider.order
- `ApiSettingsSection` - основной раздел настроек API
- `SettingsGroup` - группа настроек (RAG, Embedding, Response Generation)

## Безопасность

- Реальные значения токенов хранятся только на бэкенде
- Фронтенд получает только метаданные токенов (id, name, isActive)
- Токены передаются на бэкенд только при создании

## Provider Order

Параметр `providerOrder` определяет порядок предпочтения провайдеров при выполнении запросов к OpenRouter. Если указан, OpenRouter будет использовать провайдеров в указанном порядке с возможностью fallback.

Доступные провайдеры определены в `OPENROUTER_PROVIDERS`.

## Миграция

При первом запуске выполняется автоматическая миграция старого формата настроек (с одним токеном) в новый формат (массив токенов).

