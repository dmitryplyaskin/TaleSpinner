# Artifacts v1.0 — Migration Plan (2026-02-21)

## 1. Цель

Перевести текущую систему операций на контракт из `knowledge-base/Artifacts v1.0.md` без big-bang переписывания:

1. единый output: только `artifact.emit` / `artifact.emit_many`;
2. детерминированный commit и materialization через views;
3. canonicalization через `TurnRewriteView`;
4. единая prompt-сборка с ровно одним `system` сообщением;
5. поддержка UI-view (`inline_part`, `panel`) из artifact store.

## 2. Ключевые разрывы (что закрываем)

1. В коде живут legacy-выходы `prompt_time` и `turn_canonicalization`.
2. `turn.assistant.replace_text` не персистится в entry parts после after-фазы.
3. Artifact value/history не поддерживает envelope/event-метаданные и writeMode.
4. Формат tag не совместим со spec dot-path.
5. Нет view-движка materialization (`prompt_part`, `turn_rewrite`, `virtual_entry`, `inline_part`, `panel`).
6. Prompt runtime допускает несколько `system` сообщений.
7. Уникальность artifact tag валидируется только внутри блока, не во всем профиле.

## 3. План по этапам (PR-by-PR)

## PR1 — Контракты v1.0 (без включения в runtime)

Изменения:

1. Ввести новые типы в `shared/types/operation-profiles.ts`:
   - `ArtifactDefinition`, `ArtifactView`, `RenderSpec`, `ArtifactEmit`, `OperationOutputV1`.
2. В `server/src/services/chat-generation-v3/contracts.ts` добавить runtime-типы:
   - `artifact.emit`, `artifact.emit_many`, `ArtifactValueEnvelope`, `ArtifactHistoryItem`.
3. Оставить legacy-типы временно как deprecated (для чтения старых профилей).

Критерий готовности:

1. Типы компилируются.
2. Нет breaking API для чтения старых профилей.

Проверки:

1. `yarn typecheck:server`
2. `yarn typecheck:web`

## PR2 — Валидация профиля и tags

Изменения:

1. В `server/src/services/operations/operation-block-validator.ts`:
   - ввести dot-path валидацию tag;
   - добавить profile-level проверку уникальности writer tag (между всеми блоками профиля).
2. Запретить создание новых `prompt_time`/`turn_canonicalization` в API.
3. Оставить импорт legacy c явной нормализацией в новый контракт.

Критерий готовности:

1. Новые профили сохраняются только с artifacts output.
2. Дубликат tag между блоками не проходит.

Проверки:

1. `yarn typecheck:server`
2. `yarn --cwd server test -- operation-block-validator`

## PR3 — Artifact commit engine (ядро)

Изменения:

1. В `server/src/services/chat-generation-v3/operations/execute-operations-phase.ts`:
   - операции возвращают только `artifact.emit(_many)`.
2. В `server/src/services/chat-generation-v3/operations/commit-effects-phase.ts`:
   - commit только через artifact events;
   - порядок: dependsOn topo -> order -> opId;
   - каждый emit: `store update -> materialization`.
3. Удалить применение `prompt.*` и `turn.*` эффектов напрямую.

Критерий готовности:

1. Commit детерминирован и не зависит от фактического времени завершения операций.
2. Legacy prompt/turn эффекты не используются в runtime.

Проверки:

1. `yarn typecheck:server`
2. `yarn --cwd server test -- commit-effects-phase`
3. `yarn --cwd server test -- execute-operations-phase`

## PR4 — Artifact store v1.0 data model

Изменения:

1. Обновить `RunArtifactStore` и `ProfileSessionArtifactStore`:
   - `current: ArtifactValueEnvelope | null`;
   - `history: ArtifactHistoryItem[]`;
   - поддержка `writeMode: set|append`;
   - `history.maxItems` на уровне definition.
2. Поддержать `format: text|markdown|json`.
3. Сохранить `schemaId` в envelope для json.

Критерий готовности:

1. Store хранит canonical envelope/history в формате спецификации.
2. `append` и `set` работают по правилам spec.

Проверки:

1. `yarn typecheck:server`
2. `yarn --cwd server test -- artifact-effects`
3. `yarn --cwd server test -- commit-effects-phase`

## PR5 — Materialization engine (Prompt + Rewrite + Virtual + UI)

Изменения:

1. Добавить модуль materializer в `server/src/services/chat-generation-v3/operations/`:
   - `prompt_part`
   - `turn_rewrite`
   - `virtual_entry`
   - `inline_part`
   - `panel`
2. `turn_rewrite` реализовать через новый part с `replacesPartId` от текущего effective main part.
3. Исправить текущий баг с assistant canonicalization: rewrite assistant должен персиститься в part.

Критерий готовности:

1. Любой artifact emit может материализовать prompt/UI по views.
2. User/assistant rewrite последовательно применяются в commit order.

Проверки:

1. `yarn typecheck:server`
2. `yarn --cwd server test -- operations-flow.integration`
3. Добавить новые integration tests на rewrite chain и virtual entries.

## PR6 — Prompt builder: ровно одно system message

Изменения:

1. Перенести prompt-сборку на parts-подход из spec:
   - единый system content = concat system parts;
   - promptLifespan фильтрация;
   - deterministic sort by order.
2. Убрать множественные system-сообщения из runtime.

Критерий готовности:

1. На финальном `llmMessages` всегда один `system`.
2. Prompt snapshot соответствует новому builder.

Проверки:

1. `yarn typecheck:server`
2. `yarn --cwd server test -- build-base-prompt`
3. `yarn --cwd server test -- run-chat-generation-v3`

## PR7 — Web editor migration (только новый output/view)

Изменения:

1. В `web/src/features/sidebars/operation-profiles/ui/operation-editor/sections/output-section.tsx`:
   - удалить UI выбора `prompt_time`/`turn_canonicalization`;
   - добавить конфиг emit/views (минимально: artifact + view presets).
2. Обновить маппинг формы и i18n (`web/src/features/.../operation-profile-form-mapping.ts`, `web/src/i18n/resources/*/operationProfiles.ts`).

Критерий готовности:

1. UI не дает создать legacy output.
2. RU/EN ключи синхронизированы.

Проверки:

1. `yarn typecheck:web`
2. `yarn build:web`

## PR8 — Совместимость и миграция данных

Изменения:

1. Legacy profile reader:
   - `prompt_time` -> `artifact.emit + virtual_entry/prompt_part`;
   - `turn_canonicalization` -> `artifact.emit + turn_rewrite`.
2. Скрипт миграции профилей/блоков (dry-run + apply).
3. Логировать авто-конверсии и ошибки несовместимых кейсов.

Критерий готовности:

1. Старые профили исполняются через новый runtime.
2. Есть безопасный rollback-путь.

Проверки:

1. `yarn typecheck:server`
2. `yarn --cwd server test`
3. Smoke e2e на старом и новом профиле.

## PR9 — Наблюдаемость и финальная зачистка

Изменения:

1. Удалить legacy effect коды из debug и runtime (`prompt.*`, `turn.*`).
2. Обновить debug payload/events под artifact materialization.
3. Обновить документацию `knowledge-base` и API docs.

Критерий готовности:

1. В коде нет runtime-зависимости от legacy effect types.
2. Доки соответствуют фактическому поведению.

Проверки:

1. `yarn typecheck:server`
2. `yarn typecheck:web`
3. `yarn --cwd server test`
4. `yarn docs:check` (если обновлялись docs в `docs/**`)

## 4. Порядок внедрения и риски

Рекомендуемый порядок: `PR1 -> PR2 -> PR3 -> PR4 -> PR5 -> PR6 -> PR7 -> PR8 -> PR9`.

Основные риски:

1. Несовместимость старых профилей при жестком отключении legacy-типов.
2. Регрессии prompt-сборки из-за перехода на parts-only.
3. Рост сложности тестов и необходимость новых integration fixtures.

Снижение рисков:

1. Feature flag на новый commit/materialize engine.
2. Параллельный dual-read для legacy профилей до завершения PR8.
3. Golden tests на prompt hash/snapshot до и после миграции.

## 5. Definition of Done (общая)

1. Runtime использует только artifact emit контракт.
2. Turn canonicalization полностью реализована через `TurnRewriteView`.
3. Prompt builder выдает один system message.
4. UI поддерживает только новый способ настройки output/views.
5. Все обязательные проверки сервера и веба проходят.
