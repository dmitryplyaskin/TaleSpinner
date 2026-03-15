# Spec: План Внедрения Guard Operation

_Дата: 2026-03-15_

## 1) Цель

Цель этого документа: зафиксировать полный рабочий план внедрения `kind="guard"` в текущую архитектуру TaleSpinner.

Feature goal:

- дать пользователю возможность вычислять структурированные boolean-флаги по контексту чата;
- использовать эти флаги для ветвления исполнения других операций;
- отобразить ветви guard в node-editor;
- сохранить совместимость с текущей моделью `Operation -> artifact -> effects -> orchestrator`.

## 2) Ключевое решение

Guard не должен становиться отдельной магической подсистемой.

Guard должен быть:

- обычной операцией в профиле;
- с новым `kind="guard"`;
- с собственным typed output contract;
- с одним JSON-артефактом на выходе;
- с отдельным механизмом `runConditions` для downstream-ветвления.

Важное архитектурное решение:

- `dependsOn` отвечает за порядок исполнения;
- `runConditions` отвечает за логическое ветвление;
- `@core/operation-orchestrator` остаётся универсальным и не знает про guard-специфику;
- guard-специфика реализуется в operation runtime-слое.

## 3) Scope

Входит в scope:

- shared contracts для guard и `runConditions`;
- save-time validation;
- runtime support в chat-generation-v3;
- поддержка `liquid` и `aux_llm` guard engine;
- node-editor representation;
- editor UX;
- тесты;
- внутренняя документация.

Не входит в scope первого цикла:

- nested guard outputs;
- сложные логические выражения (`AND/OR groups`) между несколькими условиями;
- arbitrary JSON-schema outputs вместо boolean map;
- условные связи между разными hook phases без явных зависимостей;
- отдельный DSL для правил.

## 4) Target Contract

### 4.1 Shared types

Нужно расширить `shared/types/operation-profiles.ts`.

Новые типы:

```ts
export type GuardEngine = "liquid" | "aux_llm";

export type GuardRunOnError = "error" | "all_false";

export type GuardOutputDefinition = {
  key: string;
  title: string;
  description?: string;
};

export type GuardOutputContract = GuardOutputDefinition[];

export type GuardLiquidParams = {
  engine: "liquid";
  outputContract: GuardOutputContract;
  template: string;
  strictVariables?: boolean;
  runOnError?: GuardRunOnError;
};

export type GuardAuxLlmParams = {
  engine: "aux_llm";
  outputContract: GuardOutputContract;
  system?: string;
  prompt: string;
  strictVariables?: boolean;
  providerId: "openrouter" | "openai_compatible";
  credentialRef: string;
  model?: string;
  timeoutMs?: number;
  retry?: LlmOperationRetry;
  samplers?: LlmOperationSamplers;
  runOnError?: GuardRunOnError;
};

export type GuardOperationParams =
  | (GuardLiquidParams & { artifact: OperationArtifactConfig })
  | (GuardAuxLlmParams & { artifact: OperationArtifactConfig });

export type OperationRunCondition =
  | {
      type: "guard_output";
      sourceOpId: string;
      outputKey: string;
      operator: "is_true";
    }
  | {
      type: "guard_output";
      sourceOpId: string;
      outputKey: string;
      operator: "is_false";
    };
```

Изменения существующих типов:

```ts
export type OperationKind =
  | "template"
  | "llm"
  | "guard"
  | "rag"
  | "tool"
  | "compute"
  | "transform"
  | "legacy";
```

```ts
export type OperationConfig<TParams extends OperationParams = OperationParams> = {
  enabled: boolean;
  required: boolean;
  hooks: OperationHook[];
  triggers?: OperationTrigger[];
  activation?: OperationActivationConfig;
  order: number;
  dependsOn?: string[];
  runConditions?: OperationRunCondition[];
  params: TParams;
};
```

Примечание:

- guard лучше описывать отдельным специализированным params-типом, а не generic `paramsJson`;
- это упростит и backend validation, и frontend editor.

### 4.2 Runtime result

Runtime value guard-артефакта:

```ts
export type GuardOutputValue = Record<string, boolean>;
```

Новые runtime причины пропуска:

```ts
export type OperationSkipReason =
  | "activation_not_reached"
  | "dependency_not_done"
  | "dependency_missing"
  | "guard_not_matched"
  | "unsupported_kind"
  | "orchestrator_aborted"
  | "filtered_out"
  | "disabled";
```

Расширение `skipDetails`:

```ts
export type OperationSkipDetails = {
  activation?: { ... };
  blockedByOpIds?: string[];
  blockedByReason?: "activation_not_reached";
  guard?: {
    sourceOpId: string;
    outputKey: string;
    operator: "is_true" | "is_false";
    actual: boolean | null;
  };
};
```

## 5) Save-time Validation Plan

Затрагиваемый код:

- `server/src/services/operations/operation-block-validator.ts`
- возможно `server/src/services/operations/operation-profile-validator.ts`

Что нужно добавить:

1. Распознавание `kind="guard"` в Zod-схеме.
2. Новую Zod-схему для guard params.
3. Валидацию `outputContract`.
4. Валидацию `runConditions`.
5. Валидацию совместимости hooks/dependencies.
6. Валидацию artifact policy для guard.

Правила:

- `artifact.format === "json"` обязательно;
- `outputContract.length >= 1`;
- все `outputContract.key` уникальны;
- `runConditions[].sourceOpId` существует;
- `runConditions[].sourceOpId` ссылается на `kind="guard"`;
- `runConditions[].outputKey` существует в source guard;
- каждый `runCondition.sourceOpId` должен быть в `dependsOn`;
- hooks target operation должны быть подмножеством hooks source guard, как и для обычных dependency rules;
- для `engine="aux_llm"` нельзя разрешать не-json поведение;
- для `engine="liquid"` `template` должен компилироваться.

Рекомендация:

- не разрешать `runConditions` без явного `dependsOn`, даже если source guard идёт раньше по `order`.

## 6) Runtime Execution Plan

Затрагиваемый код:

- `server/src/services/chat-generation-v3/operations/execute-operations-phase.ts`
- новый helper-файл под guard runtime
- `server/src/services/chat-generation-v3/contracts.ts`

### 6.1 Что не нужно делать

Не нужно:

- переписывать `@core/operation-orchestrator`;
- делать task ids вида `guard:isBattle`;
- учить оркестратор понимать branch outputs.

Почему:

- это бизнес-логика operation runtime, а не generic DAG runtime;
- core orchestrator сейчас правильно изолирован.

### 6.2 Что нужно сделать

Нужно расширить `executeOperationsPhase` так, чтобы:

1. `kind="guard"` входил в executable operations.
2. Для guard выполнялся отдельный runtime executor.
3. После выполнения dependency chain, но до старта конкретной операции, проверялись `runConditions`.
4. Если `runConditions` не совпали, операция помечалась `skipped` с `guard_not_matched`.

Рекомендуемое разбиение:

- `execute-operations-phase.ts` оставляет orchestration flow;
- новый `guard-operation-executor.ts` выполняет guard;
- новый `guard-run-conditions.ts` оценивает условия перед стартом операции;
- новый helper для извлечения guard value из runtime artifacts.

### 6.3 Порядок проверки

Порядок в runtime:

1. Отфильтровать операции по enabled/hook/trigger/activation.
2. Оркестратор ждёт выполнения `dependsOn`.
3. Когда конкретная операция становится runnable:
   - собрать preview state от зависимостей;
   - проверить `runConditions`;
   - если хотя бы одно условие не совпало, не исполнять `run`, а вернуть `skipped`.

Рекомендация:

- condition evaluation делать внутри runtime execution path конкретной задачи, а не как статический pre-filter.

Причина:

- условие зависит от runtime values зависимостей, а не только от статической конфигурации.

### 6.4 Guard executor

`guard-operation-executor.ts` должен:

- принимать `op`, `liquidContext`, `abortSignal`;
- возвращать:
  - `renderedValue: Record<string, boolean>`
  - `debugSummary`

#### `engine="liquid"`

Алгоритм:

1. Render Liquid template to string.
2. Parse JSON.
3. Validate against derived contract.
4. Return object.

#### `engine="aux_llm"`

Алгоритм:

1. Render `system` and `prompt`.
2. Build derived schema from `outputContract`.
3. Invoke aux LLM in strict json mode.
4. Validate JSON.
5. Return object.

### 6.5 Artifact write

Guard effect:

```ts
{
  type: "artifact.upsert",
  opId: op.opId,
  artifactId: artifactRuntimeKey,
  format: "json",
  persistence: artifact.persistence,
  writeMode: "replace",
  history: artifact.history,
  semantics: artifact.semantics ?? "intermediate",
  value: guardValue
}
```

### 6.6 Debug / observability

Нужно логировать безопасно:

- engine type;
- output keys;
- whether parsing/validation passed;
- which downstream operations were skipped by guard;
- condition mismatch details.

Не нужно логировать без лимитов:

- полный prompt aux guard;
- полный model output;
- большие payloads.

## 7) Template Context Plan

Затрагиваемый код:

- `server/src/services/chat-core/prompt-template-context.ts`
- `server/src/services/chat-core/prompt-template-renderer.ts`

Что уже достаточно:

- `messages`
- `promptSystem`
- `art`
- `artByOpId`
- `chat`
- `user`
- `char`

Что желательно добавить в рамках guard:

- `worldInfo.activatedCount`
- `worldInfo.activatedEntries`
- `worldInfo.warnings`

Рекомендация:

- расширять `InstructionRenderContext`, потому что это полезно не только guard.

Что ещё потребуется для `liquid` guard:

- фильтры/хелперы для boolean-friendly вычислений;
- возможно `json` filter для безопасной сериализации boolean/string values;
- при необходимости regex helpers.

Рекомендация для v1:

- не делать слишком широкий DSL;
- добавить только минимальный набор helpers, который нужен для первых реальных сценариев.

## 8) Web / Editor Plan

Затрагиваемый код:

- `web/src/features/sidebars/operation-profiles/form/operation-profile-form-mapping.ts`
- `web/src/features/sidebars/operation-profiles/ui/operation-editor/sections/params-section.tsx`
- новые guard-specific sections
- `web/src/features/sidebars/operation-profiles/ui/operation-editor/sections/execution-section.tsx`
- `web/src/features/sidebars/operation-profiles/node-editor/flow/operation-flow-node.tsx`
- `web/src/features/sidebars/operation-profiles/node-editor/block-node-editor-modal.tsx`
- RU/EN i18n resources

### 8.1 Form model

Нужно добавить новый form-kind:

- `kind="guard"`
- редактор `outputContract`
- переключатель engine
- textarea для liquid template
- LLM config subset для aux_llm
- отображение `artifact.format=json` как фиксированного ограничения

### 8.2 Execution section

Нужно добавить UI для `runConditions`.

Вид:

- `source guard`
- `output key`
- `operator (is true / is false)`

UX rules:

- список source guards берётся из операций того же блока;
- список `outputKey` зависит от выбранного source guard;
- если выбран source guard, которого больше нет, форма показывает ошибку;
- `source guard` автоматически добавляется в `dependsOn`, либо UI требует сделать это явно.

Рекомендация:

- добавлять dependency автоматически и показывать пользователю это явно.

### 8.3 Node editor

Нужно расширить node model:

- guard node показывает multi-output handles;
- обычные edges остаются для `dependsOn`;
- guard-condition edges рисуются отдельно.

Нужны структурированные данные для condition edges:

```ts
type GuardConditionEdge = {
  sourceOpId: string;
  outputKey: string;
  operator: "is_true" | "is_false";
  targetOpId: string;
};
```

Хранение:

- condition edges не должны вычисляться из строк;
- они должны строиться из `runConditions`.

Рекомендованный rollout:

1. Сначала form/editor support без сложного graph editing.
2. Потом node-editor render support.
3. Потом полноценное редактирование guard edges прямо на графе.

Это уменьшит размер первого PR.

## 9) i18n Plan

Затрагиваемый код:

- `web/src/i18n/resources/ru/operationProfiles.ts`
- `web/src/i18n/resources/en/operationProfiles.ts`

Нужно добавить:

- новый kind label `guard`;
- labels для engine;
- labels для outputs contract;
- labels для run conditions;
- help text о том, что guard возвращает JSON boolean map;
- help text про difference between `dependsOn` and `runConditions`.

## 10) Persistence / Migration

DB migration для нового kind не требуется, если `operations` уже сохраняются как JSON blob и validator просто начнёт
пропускать новый `kind`.

Нужно проверить:

- не существует ли в UI/server мест с жёстким перечислением `OperationKind`;
- import/export bundle contracts корректно пропускают новый kind;
- legacy import paths не ломаются.

Backwards compatibility:

- старые профили должны продолжать работать без изменений;
- новые guard-операции должны экспортироваться/импортироваться обычным путём;
- никакой миграции старых `dependsOn` строк не требуется, потому что guard routing вводится как новый контракт.

## 11) Testing Plan

По AGENTS backend/frontend изменения должны идти через TDD.

### 11.1 Shared / validator tests

Нужны тесты на:

- валидный guard block;
- duplicate output keys;
- invalid artifact format;
- runCondition с неизвестным source op;
- runCondition с source op не guard;
- runCondition с неизвестным outputKey;
- runCondition без `dependsOn`.

### 11.2 Runtime tests

Нужны тесты на:

- guard liquid returns valid JSON;
- guard liquid parse error;
- guard aux_llm returns valid JSON;
- guard aux_llm schema validation error;
- downstream op runs when guard output is true;
- downstream op skips with `guard_not_matched` when false;
- multiple outputs branch independently;
- guard artifact is visible through `art` and `artByOpId`.

### 11.3 UI tests

Нужны тесты на:

- form mapping for guard params;
- runConditions form serialization/deserialization;
- node-editor meta/render for guard outputs;
- RU/EN label presence where practical.

## 12) Recommended Delivery Plan

### Phase 0: Docs + contract alignment

Задачи:

- утвердить spec и contracts;
- договориться о v1 scope.

Результат:

- согласованный дизайн без спорных string hacks.

### Phase 1: Shared contracts + validator

Задачи:

- обновить shared types;
- обновить form mapping types;
- обновить server validators;
- написать unit tests.

Результат:

- профили с guard корректно сохраняются/валидируются.

### Phase 2: Runtime support

Задачи:

- реализовать `guard-operation-executor`;
- добавить condition evaluation;
- обновить runtime result model;
- написать runtime/integration tests.

Результат:

- guard реально влияет на исполнение графа.

### Phase 3: Editor support

Задачи:

- добавить guard form sections;
- добавить `runConditions` editor;
- добавить i18n;
- написать frontend tests.

Результат:

- feature можно настроить без ручного JSON.

### Phase 4: Node-editor support

Задачи:

- multi-output guard node;
- read-only render guard branches;
- затем graph editing for guard branches.

Результат:

- ветвление видно на графе.

### Phase 5: Hardening

Задачи:

- добавить полезные Liquid helpers;
- расширить context полями world-info runtime;
- улучшить diagnostics/debug.

Результат:

- guard применим к реальным продвинутым сценариям.

## 13) Open Questions

Нужно решить до реализации:

1. Нужен ли `runOnError="all_false"` в первом релизе, или оставить только `error`.
2. Нужны ли nested outputs во v1.
3. Нужно ли разрешать несколько `runConditions` как implicit AND only, или сразу проектировать `AND/OR`.
4. Добавлять ли guard-ветки в node-editor сразу как редактируемые, или сначала только как отображаемые.
5. Должен ли `liquid` guard уметь использовать regex helpers из коробки, или это отдельный подэтап.

Рекомендации:

1. `runOnError`: можно оставить оба варианта, но дефолт `error`.
2. nested outputs: нет.
3. `runConditions`: только AND во v1.
4. node-editor editing: отложить на отдельный этап.
5. regex helpers: добавить только если первый реальный сценарий действительно требует их.

## 14) Definition of Done

Feature считается готовой, когда:

- `kind="guard"` есть в shared contracts;
- validator принимает и отвергает корректные/некорректные конфиги по стабильным правилам;
- runtime умеет исполнять guard и пропускать downstream по `runConditions`;
- `guard_not_matched` виден в runtime results;
- editor умеет настраивать guard без raw JSON hacks;
- RU/EN локализация синхронизирована;
- тесты покрывают validator/runtime/UI-критические кейсы;
- обязательные проверки зелёные для фактически затронутых слоёв.

## 15) Minimal First PR Recommendation

Если резать работу на минимальный практичный инкремент, рекомендуемый первый PR:

- shared types for `kind="guard"` and `runConditions`;
- validator support;
- runtime support only for `engine="aux_llm"`;
- form support without node-editor branch editing;
- tests for validator/runtime/form mapping.

Почему именно так:

- `aux_llm` быстрее даёт value для сложных семантических кейсов;
- `liquid` helpers можно спокойно добавить во втором PR;
- node-editor graph editing — самая дорогая часть UX, её лучше не смешивать с core runtime.

Альтернативный первый PR:

- `engine="liquid"` first, если приоритет — дешёвый deterministic guard без внешних вызовов.

Выбор зависит от того, какой кейс для команды важнее:

- быстрый semantic routing;
- или дешёвый local rule engine.
