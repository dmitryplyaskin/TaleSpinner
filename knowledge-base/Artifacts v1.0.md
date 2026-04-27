 # Artifacts v1.0 — единая система эффектов (Prompt + UI + Canonicalization)

## 0. Цели и границы

### Цель

Система **Artifacts** — единый механизм, который:

1. хранит данные (значения и историю),
2. детерминированно применяет их к **Prompt** и/или **UI**,
3. умеет **переписывать** текст текущего user/assistant turn (canonicalization) без отдельного типа эффектов,
4. убирает необходимость в двух отдельных контрактах:

* `Prompt-time effects`
* `Turn canonicalization effects`

### Нормы этого документа

* Используются слова **MUST / MUST NOT / SHOULD** в смысле RFC.
* Система должна быть **детерминированной**: при одинаковом входе результат одинаковый.

---

## 1. Термины

### Artifact

**Artifact** — именованная сущность данных, результат работы операций.
Идентификатор: **tag** (уникален в профиле).

### Artifact event (Write / Emit)

**Artifact event** — факт записи значения в артефакт (в рамках запуска/turn).
Операции **не меняют prompt напрямую**, они **эмитят события**.

### View (представление)

**View** — правило, как события артефакта материализуются:

* в **prompt** (инъекции/переписывания/виртуальные сообщения),
* в **UI** (inline-парты в сообщениях),
* в **UI panel** (отдельный интерфейс/панель с лентой).

### Part

**Part** — атомарный фрагмент сообщения (Entry Variant), который:

* отображается в UI (renderer),
* и/или сериализуется в prompt (serializer),
* имеет порядок, видимость, lifespan/TTL и т.д.


### Turn

**Turn** — один шаг диалога (обычно один user entry → один assistant entry).
Система использует `turnIndex` (целое число, монотонно растёт).

---

## 2. Инварианты и гарантии

### 2.1. Уникальность tag

* `Artifact.tag` MUST быть уникален **в рамках OperationProfile**.
* Формат tag MUST быть dot-path:

  * `segment.segment.segment`
  * каждый segment: `^[a-z][a-z0-9_]*$`
  * общая длина ≤ 128
* Зарезервированный префикс: `__sys.` (для внутренних артефактов/служебных данных).

### 2.2. Один контракт эффектов

* Операции MUST эмитить **только** `artifact.emit`.
* Операции MUST NOT эмитить отдельные `prompt_time` или `turn_canonicalization`.

### 2.3. Детерминизм и отсутствие гонок записи

* Все записи MUST применяться **последовательно** в одном детерминированном порядке (см. раздел 6).
* Конкурентное выполнение операций разрешено, но **коммит всегда последовательный**.

---

## 3. Модель данных

Ниже — “логическая” модель. Реальная БД может отличаться, но API и смысл — такие.

### 3.1. ArtifactDefinition (описание артефакта)

Определяется один раз (в профиле) и используется всеми операциями.

```ts
type ArtifactUsage = "prompt_only" | "ui_only" | "prompt+ui" | "internal";
type ArtifactPersistence = "run_only" | "persisted";
type ArtifactSemantics = "state" | "log/feed" | "lore/memory" | "intermediate" | (string & {});

type ArtifactDefinition = {
  tag: string;                 // уникальный id
  title: string;
  description?: string;

  usage: ArtifactUsage;        // строго валидируется против наличия views
  persistence: ArtifactPersistence;
  semantics: ArtifactSemantics;

  valueFormat: "text" | "markdown" | "json";  // “канонический” формат значения
  schemaId?: string;            // для json (опционально)

  history: {
    enabled: boolean;           // если false — история не хранится
    maxItems: number;           // жесткий лимит, напр. 0..1000
  };

  // Главная часть: как это проецируется в prompt/ui
  views: ArtifactView[];
};
```

### 3.2. ArtifactRecord (состояние артефакта)

```ts
type ArtifactValueEnvelope = {
  format: "text" | "markdown" | "json";
  value: string | object | number | boolean | null;

  schemaId?: string;
};

type ArtifactHistoryItem = {
  eventId: string;
  turnIndex: number;
  hook: "before_main_llm" | "after_main_llm";
  opId: string;
  createdAt: number; // epoch ms

  value: ArtifactValueEnvelope;
};

type ArtifactRecord = {
  tag: string;
  persistence: "run_only" | "persisted";
  semantics: string;

  current: ArtifactValueEnvelope | null;
  history: ArtifactHistoryItem[];  // ограничена history.maxItems
};
```

---

## 4. Views: Prompt / Inline UI / Panel UI

### 4.1. Типы Views

```ts
type ArtifactView =
  | PromptPartView
  | TurnRewriteView
  | VirtualEntryView
  | InlineMessagePartView
  | PanelView;
```

---

## 5. Render: dumb vs smart

Это универсальная схема, используемая в prompt и UI.

### 5.1. RenderSpec

```ts
type HistoryWindow =
  | { kind: "none" }
  | { kind: "last_n"; n: number };

type RenderInput =
  | { kind: "event_value" }          // значение текущего artifact event
  | { kind: "artifact_current" }     // текущее значение артефакта (после применения event)
  | { kind: "artifact_feed" };       // feed = [current + historyWindow]

type RenderSpec =
  | {
      kind: "dumb";
      input: RenderInput;
      historyWindow?: HistoryWindow;   // для artifact_feed
      outputFormat: "text" | "markdown" | "json";
    }
  | {
      kind: "liquid";
      input: RenderInput;
      historyWindow?: HistoryWindow;
      template: string;                 // liquid-шаблон
      outputFormat: "text" | "markdown" | "json";
      strictVariables?: boolean;
    }
  | {
      kind: "smart";
      input: RenderInput;
      historyWindow?: HistoryWindow;
      rendererId: string;               // UI-only: renderer
      props?: Record<string, unknown>;
    };
```

### 5.2. Контекст Liquid

Если `RenderSpec.kind="liquid"`, движок MUST предоставить:

* `this.tag` — tag текущего артефакта
* `this.event` — `{eventId, turnIndex, hook, opId, value}`
* `this.value` — выбранный input (event_value/current)
* `this.feed` — массив history items (если input=artifact_feed)
* `art` — объект всех артефактов (текущие состояния), доступ по dot-path:

  * `art.world.state.current.value`
* `now` — ISO timestamp

Для **rewrite**-view дополнительно:

* `target.text` — текущий текст цели (до применения текущего rewrite шага)

---

## 6. Детерминированный механизм “записи по очереди”

### 6.1. Порядок операций: Commit Order

Для каждого hook (`before_main_llm`, `after_main_llm`) вычисляется **единственный детерминированный список операций**:

1. Строим граф зависимостей `dependsOn`.
2. Делаем topological sort.
3. Внутри одной “прослойки” topo-sort сортируем по:

   1. `config.order` по возрастанию
   2. `opId` лексикографически (как стабильный tie-break)

**Commit Order MUST быть одинаковым** при одинаковой конфигурации.

### 6.2. Конкурентное выполнение vs последовательный коммит

* Операции MAY выполняться конкурентно (LLM вызовы параллельно).
* Но результаты MUST быть **применены (committed)** строго по **Commit Order**.
* Никакие “кто раньше завершился” не влияют на финальное состояние.

### 6.3. Порядок событий внутри операции

Если операция эмитит несколько событий (см. 7.2), то:

* они MUST применяться в порядке массива `outputs[]`.

---

## 7. Выход операции: только artifact.emit

### 7.1. Operation output

```ts
type ArtifactWriteMode = "set" | "append";

type ArtifactEmit = {
  type: "artifact.emit";
  tag: string;

  writeMode?: ArtifactWriteMode; // default определяется semantics:
                                // state => set, log/feed => append, остальное => set

  value: ArtifactValueEnvelope;  // text/markdown/json
};
```

### 7.2. Множественный output

Операция MAY эмитить несколько артефактов:

```ts
type OperationOutput = {
  type: "artifact.emit_many";
  outputs: ArtifactEmit[];
};
```

---

## 8. Материализация Views: как артефакты попадают в Prompt и UI

Ключевое правило:

> Каждый `artifact.emit` после применения к store **триггерит materialization** всех `views` этого артефакта (в commit-порядке событий).

### 8.1. Write → обновление store

При применении event:

* `set`: `current = value`, историю обновляем по правилам `history.enabled/maxItems`
* `append`:

  * `current = value`
  * и в историю добавляем item как отдельное событие (даже если current перезаписался)

История MUST соблюдать `maxItems` (обрезаем с начала, оставляем последние).

---

# 9. Prompt Views

## 9.1. PromptPartView (вставка Part в prompt)

Используется для “Prompt Only” и части “Prompt+UI”.

```ts
type PromptTarget =
  | { kind: "system" }
  | { kind: "current_user_entry" }          // entry пользователя текущего turn
  | { kind: "assistant_output_entry" }      // entry ассистента текущего run
  | { kind: "prompt_entry_at_depth"; role: "user"|"assistant"; depthFromEnd: number };

type UpsertMode = "upsert" | "append";

type PromptPartView = {
  kind: "prompt_part";
  id: string;                // уникально внутри артефакта

  target: PromptTarget;
  materialize: UpsertMode;

  part: {
    channel: "main" | "aux" | "trace";
    order: number;

    visibility: { ui: "never" | "debug" | "always"; prompt: true };

    // lifespan влияет ТОЛЬКО на prompt-включение (UI не режем lifespan’ом)
    promptLifespan: "infinite" | { turns: number };

    // как получить payload
    render: RenderSpec;

    // как сериализовать в prompt (если payload json/markdown)
    promptSerializer: { serializerId: string; props?: Record<string, unknown> };

    // ui-рендер для inline НЕ используется здесь (это prompt view)
    ui?: never;
  };
};
```

### Правила

* `PromptPartView.part.visibility.prompt` MUST быть `true`.
* `PromptPartView` MUST NOT отображаться в UI (ui visibility = never или debug допускается только если usage не prompt_only, см. 12).

### Upsert semantics

* `materialize="upsert"`: в target создаётся/обновляется **один** Part-слот с тегами:

  * `artifact:<tag>`
  * `view:<id>`
* `materialize="append"`: каждый event создаёт новый Part (с доп. тегом `event:<eventId>`).

---

## 9.2. TurnRewriteView (каноникализация / override без отдельного эффекта)

Это **прямой заменитель** Turn canonicalization effects.

```ts
type RewriteTarget =
  | { kind: "current_user_main" }       // только в before_main_llm
  | { kind: "assistant_output_main" };  // только в after_main_llm

type TextCompose = "replace" | "prepend" | "append";

type TurnRewriteView = {
  kind: "turn_rewrite";
  id: string;

  target: RewriteTarget;
  compose: TextCompose;

  // откуда берём текст (как event_value/current/etc)
  render: RenderSpec;

  // сохранять ли результат как part в entry_parts (да, всегда для user/assistant)
  persist: true;
};
```

### Правила

* `target.kind="current_user_main"` разрешён **только** в `before_main_llm`.
* `target.kind="assistant_output_main"` разрешён **только** в `after_main_llm`.
* Применение rewrite MUST быть последовательным: если несколько rewrite-view срабатывают, они применяются **в commit order**, и каждый следующий rewrite работает с `target.text`, уже изменённым предыдущими rewrite’ами.

### Реализация через Parts (строгое поведение)

Когда применяется rewrite:

1. движок берёт **текущий эффективный main text** цели,
2. вычисляет `newText` по `compose`,
3. создаёт новый Part, который:

   * копирует channel/order/visibility/prompt/ui базового main-part’а цели,
   * ставит `replacesPartId` равным текущему main-partId,
   * добавляет теги: `artifact:<tag>`, `view:<id>`, `rewrite`, `event:<eventId>`,
4. обновляет “effective main part pointer” на этот новый part.

---

## 9.3. VirtualEntryView (создать новое виртуальное сообщение только для prompt)

Это **заменитель** Prompt-time insertion эффектов.

```ts
type VirtualInsert =
  | { kind: "after_last_user" }
  | { kind: "at_depth_from_end"; depthFromEnd: number }; // как prompt.insert_at_depth

type VirtualEntryView = {
  kind: "virtual_entry";
  id: string;

  role: "system" | "user" | "assistant";
  insert: VirtualInsert;

  render: RenderSpec; // генерит содержимое виртуального сообщения
};
```

### Правила

* VirtualEntryView **не пишет в БД** и **не виден** другим view как target.
* Виртуальное сообщение живёт только в рамках **текущего prompt build**.

---

# 10. UI Views

## 10.1. InlineMessagePartView (Part внутри сообщения)

Используется для `ui_only` и `prompt+ui` (inline отображение).

```ts
type UiTarget =
  | { kind: "current_user_entry" }
  | { kind: "assistant_output_entry" }
  | { kind: "entry_at_depth"; role: "user"|"assistant"; depthFromEnd: number };

type InlineMessagePartView = {
  kind: "inline_part";
  id: string;

  target: UiTarget;
  materialize: "upsert" | "append";

  part: {
    channel: "aux" | "trace";  // inline части НЕ являются main
    order: number;

    visibility: { ui: "always" | "debug"; prompt: boolean };

    // promptLifespan влияет только на prompt (UI сохраняется)
    promptLifespan: "infinite" | { turns: number };

    render: RenderSpec;

    uiRenderer: { rendererId: string; props?: Record<string, unknown> };
    promptSerializer?: { serializerId: string; props?: Record<string, unknown> };
  };
};
```

### Правила

* Inline part MUST быть `channel != main`.
* Если `visibility.prompt=true`, тогда part участвует в prompt наравне с остальными частями entry (см. 11).

---

## 10.2. PanelView (отдельный интерфейс/панель артефакта)

Это второй UI-режим (вне сообщений), с лентой.

```ts
type PanelFeed =
  | { kind: "current_only" }
  | { kind: "current_plus_last_n"; n: number }
  | { kind: "history_only_last_n"; n: number };

type PanelView = {
  kind: "panel";
  id: string;

  panelId: string;       // например: "right_sidebar" | "tab:artifacts" | "custom:<id>"
  feed: PanelFeed;

  // Dumb: показываем как есть (текст/markdown/json)
  // Smart: rendererId (пользовательская верстка/шаблон/компонент)
  render: RenderSpec;
};
```

### Правила

* PanelView MUST получать данные только из ArtifactRecord (current+history).
* PanelView MUST поддерживать “ленту”: текущий элемент + N предыдущих (feed).

---

# 11. Сборка Prompt из Parts

## 11.1. Системное сообщение

Prompt builder MUST формировать **ровно одно** system message.

System content строится так:

1. Собираем все system parts (base + materialized prompt_part/virtual_entry(role=system)).
2. Фильтруем те, у кого `promptLifespan` активен.
3. Сортируем по `order`.
4. Конкатенируем через разделитель `\n\n`.

## 11.2. User/Assistant сообщения

Для каждого entry:

1. берём active variant,
2. берём parts:

   * `softDeleted != true`
   * `visibility.prompt == true`
   * `promptLifespan` активен
3. сортируем по `order`,
4. сериализуем каждый part `promptSerializer`,
5. склеиваем (по правилам сериализатора/канала; default: `\n\n`).

---

# 12. Валидация (жесткие ошибки)

## 12.1. usage ↔ views

`ArtifactDefinition.usage` MUST соответствовать наличию views:

* `prompt_only`:

  * MUST иметь ≥ 1 view типа `prompt_part`/`turn_rewrite`/`virtual_entry`
  * MUST NOT иметь `inline_part` и `panel`

* `ui_only`:

  * MUST иметь ≥ 1 view типа `inline_part` и/или `panel`
  * MUST NOT иметь prompt-only views

* `prompt+ui`:

  * MUST иметь ≥ 1 prompt-view
  * MUST иметь ≥ 1 ui-view

* `internal`:

  * MUST NOT иметь views вообще

## 12.2. Запрещенные комбинации

* `TurnRewriteView.target=current_user_main` в `after_main_llm` → ERROR
* `TurnRewriteView.target=assistant_output_main` в `before_main_llm` → ERROR
* `InlineMessagePartView.part.channel="main"` → ERROR
* `tag` не соответствует формату → ERROR

---

# 13. Примеры (минимально необходимые)

## 13.1. “World State” как system instruction (Prompt Only)

* артефакт хранит markdown
* в prompt вставляется как system part с order=10
* UI нет

```json
{
  "tag": "world.state",
  "title": "World State",
  "usage": "prompt_only",
  "persistence": "persisted",
  "semantics": "state",
  "valueFormat": "markdown",
  "history": { "enabled": true, "maxItems": 50 },
  "views": [
    {
      "kind": "prompt_part",
      "id": "sys_instruction",
      "target": { "kind": "system" },
      "materialize": "upsert",
      "part": {
        "channel": "aux",
        "order": 10,
        "visibility": { "ui": "never", "prompt": true },
        "promptLifespan": "infinite",
        "render": { "kind": "dumb", "input": { "kind": "artifact_current" }, "outputFormat": "markdown" },
        "promptSerializer": { "serializerId": "core.markdown_to_text" }
      }
    }
  ]
}
```

## 13.2. Каноникализация user turn (Turn rewrite)

```json
{
  "tag": "turn.user.canonical",
  "title": "Canonical User Turn",
  "usage": "prompt+ui",
  "persistence": "persisted",
  "semantics": "intermediate",
  "valueFormat": "text",
  "history": { "enabled": true, "maxItems": 20 },
  "views": [
    {
      "kind": "turn_rewrite",
      "id": "rewrite_user",
      "target": { "kind": "current_user_main" },
      "compose": "replace",
      "render": { "kind": "dumb", "input": { "kind": "event_value" }, "outputFormat": "text" },
      "persist": true
    }
  ]
}
```

## 13.3. “Погода” — в prompt только текущая, в UI панель лента

* prompt: только текущий turn (TTL=1)
* panel: last 20

```json
{
  "tag": "world.weather",
  "title": "Weather",
  "usage": "prompt+ui",
  "persistence": "persisted",
  "semantics": "log/feed",
  "valueFormat": "json",
  "schemaId": "weather.v1",
  "history": { "enabled": true, "maxItems": 200 },
  "views": [
    {
      "kind": "prompt_part",
      "id": "weather_prompt",
      "target": { "kind": "system" },
      "materialize": "upsert",
      "part": {
        "channel": "aux",
        "order": 30,
        "visibility": { "ui": "never", "prompt": true },
        "promptLifespan": { "turns": 1 },
        "render": {
          "kind": "liquid",
          "input": { "kind": "artifact_current" },
          "template": "Weather now: {{ this.value.value.temperature }}C, {{ this.value.value.summary }}",
          "outputFormat": "text"
        },
        "promptSerializer": { "serializerId": "core.text" }
      }
    },
    {
      "kind": "panel",
      "id": "weather_panel",
      "panelId": "right_sidebar",
      "feed": { "kind": "current_plus_last_n", "n": 20 },
      "render": {
        "kind": "smart",
        "input": { "kind": "artifact_feed" },
        "historyWindow": { "kind": "last_n", "n": 20 },
        "rendererId": "core.weather_timeline",
        "props": { "showIcons": true }
      }
    }
  ]
}
```

---

# 14. Что именно нужно поменять в текущем проекте (строго по контракту)

Это НЕ “варианты”, а прямой список обязательных изменений для соответствия спеки:

1. `OperationOutput`:

   * удалить `prompt_time` и `turn_canonicalization`
   * оставить только `artifact.emit` / `artifact.emit_many`

2. Runtime commit:

   * собирать результаты операций как сейчас можно,
   * но **применять строго по Commit Order** (граф dependsOn → order → opId),
   * каждый emit → update store → materialize views.

3. Prompt builder:

   * гарантировать **один system message**
   * собирать system из parts

4. Canonicalization:

   * реализовать через `TurnRewriteView` (создание part с replacesPartId по “текущему эффективному main”)

5. UI:

   * inline — через parts
   * panel — через artifact records + panel view (feed).

