# Настройка языка вывода LLM

## Описание

Функционал позволяет пользователю выбрать язык, на котором LLM будет генерировать контент. Доступные языки:
- Русский (`ru`)
- Английский (`en`)

Настройка влияет только на пользовательский контент (описания миров, персонажей, диалоги, вопросы агентов). Внутренняя коммуникация между агентами остаётся на английском языке.

## Файлы

### Типы

- `shared/types/settings.ts` — тип `LLMOutputLanguage` и поле `llmOutputLanguage` в `AppSettings`
- `shared/types/api-settings.ts` — тип `LLMOutputLanguage` и поле `llmOutputLanguage` в `ApiSettings`

### Backend

#### Промпты
- `src/services/world-creation/prompts.ts` — все функции генерации промптов принимают параметр `outputLanguage`:
  - `createDraftWorldsPrompt()`
  - `createMoreWorldsPrompt()`
  - `createWorldsPrompt()`
  - `createRacesPrompt()`
  - `createTimelinePrompt()`
  - `createMagicPrompt()`
  - `createLocationsPrompt()`
  - `createFactionsPrompt()`
  - `createFirstMessagePrompt()`

#### Агенты
- `src/services/world-creation/agents/analysis.agent.ts` — метод `analyze()` принимает параметр `outputLanguage`
- `src/services/world-creation/agents/generation.agent.ts` — метод `generate()` принимает параметр `outputLanguage`

#### Сервисы
- `src/services/world-creation/world-creation.service.ts` — получает `llmOutputLanguage` из настроек и передаёт в промпты
- `src/services/world-creation/agent-world.service.ts` — получает `llmOutputLanguage` из настроек и передаёт в агенты

### Frontend

- `frontend/src/components/settings-modal/tabs-system.tsx` — вкладка "Интерфейс"
- `frontend/src/components/settings-modal/interface-settings-section.tsx` — секция с выбором языка
- `frontend/src/components/settings-modal/settings-modal.tsx` — интеграция секции в модальное окно

## Хранение

Настройка сохраняется в файле `data/api-settings/api-settings.json` в поле `llmOutputLanguage`.

## Использование

1. Открыть настройки приложения
2. Перейти на вкладку "Интерфейс"
3. Выбрать язык вывода LLM из выпадающего списка
4. Сохранить настройки

После сохранения все последующие генерации контента будут выполняться на выбранном языке.



