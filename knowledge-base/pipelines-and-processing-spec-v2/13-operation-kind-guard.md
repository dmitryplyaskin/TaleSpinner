# v2 — Operation / kind=guard (контракт guard-операции)

Этот документ описывает контракт для операций с `OperationDefinition.kind="guard"`.

Цель guard-операции: посмотреть на контекст текущего `Run`, выполнить набор проверок и вернуть
типизированный JSON-результат, по которому другие операции смогут ветвиться.

> Ключевой принцип: `guard` не вводит отдельную магическую модель исполнения.
> Это обычная операция v2, которая пишет один JSON-артефакт и даёт другим операциям
> структурированные условия запуска.

## 0) Что такое Guard

`kind="guard"` — это операция-классификатор.

Она:

- читает `OperationContext`;
- вычисляет набор флагов;
- возвращает JSON-объект вида `Record<string, boolean>`;
- пишет этот объект в один `artifact` с `format="json"`;
- не изменяет prompt/history сама по себе, если это явно не настроено через `artifact.exposures`.

Типичные кейсы:

- проверить последние 5 сообщений на боевую сцену;
- определить, что сейчас ночь;
- определить, что сцена стала NSFW;
- проверить, что активировался нужный world-info/outlet;
- разветвить дальнейший граф на несколько веток.

## 1) Инварианты v1

Для первого рабочего релиза guard должен быть максимально узким и предсказуемым.

Инварианты:

- guard пишет ровно один артефакт;
- guard-результат в v1 — плоский JSON-объект с boolean-полями;
- каждый ключ результата должен быть заранее объявлен в контракте операции;
- downstream-операции ветвятся не по строке вида `opId:isBattle`, а по структурированным `runConditions`;
- `false` в guard-результате не является ошибкой;
- если guard завершился `done`, его артефакт считается валидным и может читаться другими операциями;
- если downstream-операция не прошла `runConditions`, она получает `status="skipped"` и причину
  `guard_not_matched`.

Ограничения v1:

- только плоские boolean outputs;
- без вложенных путей (`combat.isBattle`) и без массивов;
- без multi-value routing;
- без implicit conditions через `dependsOn`.

Это ограничение сделано специально, чтобы:

- упростить UI node-editor;
- упростить валидацию;
- не превращать guard в ещё один mini-language.

## 2) Контракт результата guard

### 2.1 Shape

Guard-операция обязана вернуть JSON, совместимый с заранее объявленным `outputContract`.

Минимальная форма:

```json
{
  "isBattle": true,
  "isNight": false,
  "isNSFW": false
}
```

### 2.2 OutputContract

Предлагаемый контракт v1:

```ts
export type GuardOutputDefinition = {
  key: string;
  title: string;
  description?: string;
};

export type GuardOutputContract = GuardOutputDefinition[];
```

Правила:

- `key` уникален внутри операции;
- `key` должен соответствовать безопасному формату идентификатора, например `^[a-z][a-zA-Z0-9_]*$`;
- каждый `key` обязан присутствовать в runtime-результате;
- значение каждого `key` должно быть boolean;
- лишние поля в результате guard не допускаются в strict-режиме v1.

Пример:

```ts
outputContract: [
  { key: "isBattle", title: "Battle" },
  { key: "isNight", title: "Night time" },
  { key: "isNSFW", title: "NSFW" },
]
```

### 2.3 Почему не `jsonSchema` общего вида

Внутренне можно генерировать `jsonSchema` из `outputContract`, но внешний контракт guard лучше держать отдельным.

Причины:

- node-editor должен заранее знать, какие ветки рисовать;
- UI должен уметь показывать именованные выходы;
- валидация связи должна понимать не просто JSON, а ветку guard output;
- nested JSON сильно усложнит UX и runtime на первом этапе.

Вывод: в v1 guard имеет собственный небольшой контракт outputs, а не произвольную JSON-схему.

## 3) `params` для `kind="guard"`

Предлагаемый минимальный контракт:

```ts
export type GuardEngine = "liquid" | "aux_llm";

export type GuardRunOnError = "error" | "all_false";

export type GuardParams =
  | {
      engine: "liquid";
      outputContract: GuardOutputContract;
      template: string;
      strictVariables?: boolean;
      runOnError?: GuardRunOnError;
      artifact: OperationArtifactConfig;
    }
  | {
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
      artifact: OperationArtifactConfig;
    };
```

### 3.1 `engine="liquid"`

Liquid-guard нужен для дешёвых, быстрых и детерминированных проверок.

Идея v1:

- `template` рендерится через LiquidJS;
- результатом рендера должна быть JSON-строка;
- эта JSON-строка парсится и валидируется по `outputContract`.

Пример:

```liquid
{
  "isBattle": {{ recentMessagesText(5) contains "attack" | json }},
  "isNight": {{ world.timeOfDay == "night" | json }},
  "isNSFW": {{ recentMessagesText(5) contains "kiss" | json }}
}
```

Примечание: для такого сценария потребуется расширить набор внутренних Liquid filters/helpers, потому что текущий
контекст и фильтры покрывают не все нужные проверки.

### 3.2 `engine="aux_llm"`

Aux-LLM guard нужен для нечётких семантических проверок, где regex/contains уже не хватает.

Идея v1:

- `system` и `prompt` рендерятся как Liquid-шаблоны;
- aux LLM вызывается в JSON-режиме;
- schema для ответа автоматически выводится из `outputContract`;
- результат строго валидируется;
- на выходе guard всё равно пишет тот же boolean JSON.

Важный принцип:

- оба engine должны приводиться к одному и тому же runtime-контракту;
- downstream-операции не должны знать, как именно guard вычислялся.

### 3.3 `runOnError`

Предлагаемый рабочий минимум:

- `error` — ошибка вычисления завершает guard как `status="error"`;
- `all_false` — ошибка вычисления приводит к synthetic-результату, где все outputs=`false`, и guard
  завершается `done`.

Рекомендация для v1:

- дефолт = `error`;
- `all_false` использовать только там, где пропуск ветки безопаснее, чем остановка сценария.

## 4) Входы guard-операции

Guard читает стандартный `OperationContext`.

На практике для guard особенно важны:

- `messages`;
- `promptSystem`;
- `art` и `artByOpId`;
- `chat`;
- `char`;
- `user`;
- `rag`;
- world-info, уже разрешённый в template context;
- future runtime meta для world-info activation/debug.

Для реальных guard-кейсов v1 желательно дополнить context удобными полями:

- `worldInfo.activatedCount`;
- `worldInfo.activatedEntries`;
- `worldInfo.warnings`;
- `chatRuntime` или аналогичный объект для derived runtime facts.

## 5) Как downstream-операции ветвятся

### 5.1 Почему недостаточно `dependsOn`

`dependsOn` отвечает только на вопрос “когда можно стартовать”.

Для guard нам нужен отдельный вопрос:

- можно ли запускать эту операцию при текущем значении guard outputs.

Поэтому v1 должен ввести второй механизм: `runConditions`.

### 5.2 Предлагаемый контракт `runConditions`

```ts
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

Расширение `OperationConfig`:

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

### 5.3 Обязательное правило согласованности

Если операция ссылается на guard через `runConditions`, этот `sourceOpId` должен также присутствовать в `dependsOn`.

Причины:

- явный порядок исполнения;
- понятный граф зависимостей;
- предсказуемый preview state;
- простая валидация.

Правило:

- `runCondition.sourceOpId` обязательно входит в `dependsOn`;
- `sourceOpId` обязан ссылаться именно на `kind="guard"`;
- `outputKey` обязан существовать в `sourceOpId.config.params.outputContract`.

### 5.4 Почему не `opId:isBattle`

Строковый формат вида `combat_guard:isBattle` не рекомендуется и не должен становиться канонической моделью.

Причины:

- невозможно нормально типизировать;
- сложно валидировать на save-time;
- сложно мигрировать;
- плохо отображается в UI;
- смешивает граф выполнения и граф ветвления в одну непрозрачную строку.

## 6) Runtime-семантика

### 6.1 Guard сам по себе

Если guard отработал успешно:

- `status="done"`;
- в `effects` есть один `artifact.upsert` с JSON-объектом `Record<string, boolean>`;
- downstream-операции могут читать этот артефакт через `art` и `artByOpId`.

Если guard вернул валидный JSON, где часть флагов `false`:

- это нормальный результат;
- guard не считается `skipped`;
- guard не считается `error`.

### 6.2 Downstream-операция с guard-условием

Алгоритм:

1. Операция ждёт завершения всех `dependsOn` со статусом `done`.
2. Перед стартом runtime проверяет все `runConditions`.
3. Если все условия совпали, операция стартует как обычно.
4. Если хотя бы одно условие не совпало, операция не стартует и получает:
   - `status="skipped"`
   - `skipReason="guard_not_matched"`
   - `skipDetails` с объяснением, какое условие не совпало.

Предлагаемый `skipDetails`:

```ts
skipDetails: {
  guard?: {
    sourceOpId: string;
    outputKey: string;
    operator: "is_true" | "is_false";
    actual: boolean | null;
  };
}
```

## 7) Node-editor модель

Guard должен отображаться как узел с несколькими именованными выходами.

v1 UI-контракт:

- у guard-узла есть стандартный target handle для `dependsOn`;
- у guard-узла есть несколько source handles, по одному на каждый `outputContract.key`;
- edge guard-ветки хранит не строку, а структурированную ссылку:
  - `sourceOpId`
  - `outputKey`
  - `operator`
  - `targetOpId`

Рекомендуемая визуальная модель:

- обычные `dependsOn` edges: нейтральные;
- guard-edges: отдельный стиль, label=`isBattle=true` или `isBattle=false`.

Важно:

- граф зависимостей и граф условий логически разные;
- в UI их можно рисовать как два типа рёбер, но в модели данных они не должны смешиваться.

## 8) Артефакт guard

Guard остаётся совместим с существующей artifact-моделью.

Рекомендации для `artifact`:

- `format="json"`
- `writeMode="replace"`
- `persistence="run_only"` по умолчанию
- `semantics="intermediate"` или `semantics="state"`
- `history.enabled=true` допустимо, но не обязательно

По умолчанию у guard не должно быть prompt/UI exposures.

Причина:

- guard прежде всего решает ветвление, а не инжектит текст.

## 9) Валидация save-time

Guard требует новых правил в валидаторе блока/профиля.

Минимум:

- `kind="guard"` распознаётся схемой;
- `artifact.format` для guard должен быть `json`;
- `outputContract` не пустой;
- `outputContract.key` уникальны;
- `runConditions[].sourceOpId` существует;
- `runConditions[].sourceOpId` ссылается на `kind="guard"`;
- `runConditions[].outputKey` существует в guard-контракте;
- `runConditions[].sourceOpId` входит в `dependsOn`;
- hooks downstream-операции должны быть совместимы с hooks guard-операции.

Для `engine="aux_llm"`:

- runtime JSON schema автоматически выводится из `outputContract`;
- `strictSchemaValidation=true` включается принудительно;
- `outputMode="json"` фиксируется принудительно.

Для `engine="liquid"`:

- `template` должен компилироваться как Liquid;
- runtime JSON парсинг и contract validation обязательны.

## 10) Ошибки

Рекомендуемые коды ошибок:

- `GUARD_TEMPLATE_RENDER_ERROR`
- `GUARD_OUTPUT_PARSE_ERROR`
- `GUARD_OUTPUT_VALIDATION_ERROR`
- `GUARD_PROVIDER_ERROR`
- `GUARD_TIMEOUT`
- `GUARD_INVALID_PARAMS`

Семантика:

- ошибка вычисления guard = ошибка самой guard-операции;
- `false` в выходе guard = не ошибка;
- пропуск downstream по guard = `skipped`, не ошибка guard-а.

## 11) Пример профиля

Пример guard:

```json
{
  "opId": "combat_guard",
  "name": "Combat guard",
  "kind": "guard",
  "config": {
    "enabled": true,
    "required": false,
    "hooks": ["before_main_llm"],
    "order": 100,
    "params": {
      "engine": "aux_llm",
      "outputContract": [
        { "key": "isBattle", "title": "Battle" },
        { "key": "isNSFW", "title": "NSFW" }
      ],
      "system": "Classify the scene.",
      "prompt": "Look at the last 5 messages and return JSON only.",
      "providerId": "openrouter",
      "credentialRef": "cred-1",
      "model": "openai/gpt-5-mini",
      "artifact": {
        "artifactId": "artifact:combat_guard",
        "tag": "combat_guard_state",
        "title": "Combat guard state",
        "format": "json",
        "persistence": "run_only",
        "writeMode": "replace",
        "history": { "enabled": true, "maxItems": 20 },
        "exposures": []
      }
    }
  }
}
```

Пример downstream:

```json
{
  "opId": "combat_dice",
  "name": "Combat dice",
  "kind": "llm",
  "config": {
    "enabled": true,
    "required": false,
    "hooks": ["before_main_llm"],
    "order": 200,
    "dependsOn": ["combat_guard"],
    "runConditions": [
      {
        "type": "guard_output",
        "sourceOpId": "combat_guard",
        "outputKey": "isBattle",
        "operator": "is_true"
      }
    ],
    "params": {}
  }
}
```

## 12) Рекомендация по реализации

Guard лучше реализовывать как новый `kind`, но не делать core-orchestrator guard-aware.

Рекомендованный слой реализации:

- `shared/**`: типы `kind="guard"` и `runConditions`;
- `server/src/services/operations/**`: save-time validation;
- `server/src/services/chat-generation-v3/operations/**`: runtime execute + condition evaluation;
- `web/**`: editor + node-editor + i18n.

Сам `@core/operation-orchestrator` должен остаться универсальным DAG-исполнителем, знающим только о задачах и
зависимостях.

## 13) Итог

Guard в v1 — это:

- новый `OperationKind`;
- два движка: `liquid` и `aux_llm`;
- один JSON-артефакт;
- плоский boolean output contract;
- отдельные `runConditions` для ветвления;
- multi-output узел в node-editor;
- никакой строковой магии в `dependsOn`.
