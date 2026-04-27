# TaleSpinner Chat Knowledge Store Spec (v1 Blueprint)

Этот документ фиксирует новую сущность knowledge store для чата и ветки чата.

Документ описывает:
- назначение и границы ответственности
- модель данных v1
- поиск и retrieval flow
- механизм доступа к закрытым записям
- разделение baseline/runtime данных
- import/export режимы
- план интеграции с SQLite FTS5 и Chroma

Документ является internal blueprint. Это не user-facing docs и не публичный API-контракт.

## 1. Зачем нужна новая сущность

Текущие близкие механизмы решают другие задачи:

- `world-info` активируется по ключам/регуляркам и может случайно тащить в prompt лишние записи
- `operation artifacts` являются runtime-результатами операций и всегда начинаются пустыми в новом чате
- `chat_runtime_state` хранит pipeline/runtime state, а не knowledge corpus
- Chroma в текущем проекте является vector/RAG слоем, а не source of truth для чатового знания

Новая сущность нужна для сценариев, где:

- данные должны быть доступны не автоматически, а только по explicit retrieval
- записи могут быть импортированы заранее до начала игры
- записи могут создаваться и обновляться по ходу игры
- записи могут быть скрыты до выполнения условий
- retrieval должен работать не только по тегам, но и по именам, алиасам и тексту
- одна операция ищет кандидатов, а другая операция отбирает из них только нужное для prompt

Итоговый тезис:

> Knowledge store это chat-scoped/branch-scoped structured knowledge layer with explicit retrieval, а не auto-injected lorebook.

## 2. Основные принципы

### 2.1. Explicit access only

Knowledge store не должен автоматически попадать в prompt.

Правильный flow:

1. операция формирует retrieval request
2. backend делает search
3. backend возвращает candidate records
4. отдельная операция/LLM отбирает нужное
5. только отобранное попадает в prompt

### 2.2. SQLite is source of truth

Source of truth для knowledge store должен жить в основной SQLite БД.

Причины:

- нужны устойчивые id и целостность
- нужны chat/branch scope
- нужны import/export режимы
- нужны explicit links между записями
- нужны детерминированные unique constraints
- нужны baseline/runtime distinctions

### 2.3. Chroma is not the primary store

Chroma не должен быть основным хранилищем knowledge records.

Chroma должен использоваться как вторичный индекс для vector search поверх тех же `recordId`.

Итог:

- одна доменная сущность
- SQLite как primary store
- FTS5 как text search v1
- Chroma как optional vector index v2

### 2.4. Retrieval must be hybrid

LLM не должна зависеть только от тегов.

Поиск должен поддерживать:

- exact match по `key`
- exact/prefix match по `title`
- aliases
- tags
- full-text search
- optional filters по type/scope/access
- ranking
- `limit`
- score threshold

### 2.5. Closed records need deterministic gating

LLM не решает самостоятельно, можно ли открыть запись.

LLM может:

- предложить найти запись
- предложить раскрыть запись

Но backend должен:

- проверить gate policy
- проверить runtime state
- только потом открыть доступ или раскрыть запись

### 2.6. Baseline and runtime must stay separable

Knowledge store должен различать:

- исходные записи, существовавшие до начала игры
- записи, созданные или измененные во время игры

Это обязательно для export modes и для чистого сценарного состояния.

## 3. Термины

- `Knowledge Collection`
  - Логическая группа записей.
  - Единица импорта/экспорта.
  - Примеры: scenario pack, lore pack, faction pack, mystery pack.

- `Knowledge Record`
  - Одна atomic knowledge entry.
  - Примеры: персонаж, место, событие, правило, предмет, факт, заметка, clue, state node.

- `Knowledge Link`
  - Явная связь между двумя knowledge records.

- `Baseline Record`
  - Запись, созданная до текущей игровой сессии или импортированная как исходный материал.

- `Runtime Record`
  - Запись, созданная в ходе игры пользователем, системой или LLM.

- `Discoverability`
  - Можно ли найти запись как candidate.

- `Readability`
  - Можно ли прочитать содержимое записи.

- `Promptability`
  - Можно ли использовать запись в prompt materialization.

- `Reveal`
  - Явная смена runtime state записи, после которой запись считается раскрытой в текущем чате/ветке.

## 4. Scope model

Knowledge store поддерживает два уровня scope:

- `chat`
  - запись общая для всего чата

- `branch`
  - запись или runtime state локальны для конкретной ветки

Рекомендуемое правило v1:

- `branchId = null` означает chat-scoped record/state
- `branchId != null` означает branch-scoped record/state

На чтении активная ветка должна видеть:

1. chat-scoped records
2. branch-scoped records текущей ветки

Глубокую inheritance chain между ветками в v1 лучше не вводить.

## 5. Что должно храниться в knowledge store

Knowledge store должен уметь хранить:

- сущности
- факты
- места
- фракции
- предметы
- правила мира
- события
- квестовые узлы
- скрытые данные
- runtime-заметки
- runtime-derived records
- связи между сущностями

Knowledge store не должен быть заточен только под детективные сценарии.

## 6. Предлагаемая логическая модель данных

### 6.1. `knowledge_collections`

Единица импорта/экспорта и группировки.

Рекомендуемые поля:

- `id`
- `ownerId`
- `chatId`
- `branchId | null`
- `scope` = `chat | branch`
- `name`
- `kind`
- `description`
- `status` = `active | archived | deleted`
- `origin` = `import | author | system_seed | user | llm`
- `layer` = `baseline | runtime`
- `metaJson`
- `createdAt`
- `updatedAt`

Назначение:

- объединяет записи в пакет
- дает контролируемую единицу export/import
- позволяет держать baseline pack отдельно от runtime pack

### 6.2. `knowledge_records`

Каноническая запись knowledge store.

Рекомендуемые поля:

- `id`
- `ownerId`
- `chatId`
- `branchId | null`
- `collectionId`
- `recordType`
- `key`
- `title`
- `aliasesJson`
- `tagsJson`
- `summary`
- `contentJson`
- `searchText`
- `accessMode`
- `origin`
- `layer`
- `derivedFromRecordId | null`
- `sourceMessageId | null`
- `sourceOperationId | null`
- `status` = `active | archived | deleted`
- `metaJson`
- `createdAt`
- `updatedAt`

Рекомендуемые инварианты:

- `key` должен быть stable identifier внутри `chatId + branchId + collectionId`
- `(chatId, branchId, collectionId, key)` должен быть unique
- `searchText` является нормализованным материалом для FTS

Пояснения по полям:

- `recordType`
  - Примеры: `entity`, `location`, `event`, `rule`, `item`, `fact`, `note`, `state`.

- `contentJson`
  - Structured payload записи.
  - Это не произвольный blob без смысла.
  - Для разных `recordType` допускаются разные shape contracts.

- `searchText`
  - Flattened search material.
  - Должен включать только разрешенный для индексации текст.
  - Для закрытых записей сюда не должен безусловно попадать весь hidden payload.

### 6.3. `knowledge_record_links`

Явные связи между записями.

Рекомендуемые поля:

- `id`
- `ownerId`
- `chatId`
- `branchId | null`
- `fromRecordId`
- `relationType`
- `toRecordId`
- `metaJson`
- `createdAt`
- `updatedAt`

Примеры `relationType`:

- `located_in`
- `belongs_to`
- `knows_about`
- `depends_on`
- `reveals`
- `contradicts`
- `same_as`

### 6.4. `knowledge_record_access_state`

Runtime state доступа и раскрытия записи.

Эту таблицу лучше держать отдельно от `knowledge_records`, чтобы:

- не мутировать baseline content при обычном reveal
- хранить reveal state как runtime overlay
- управлять chat/branch-specific состоянием

Рекомендуемые поля:

- `id`
- `ownerId`
- `chatId`
- `branchId | null`
- `recordId`
- `discoverState` = `hidden | discoverable | visible`
- `readState` = `blocked | partial | full`
- `promptState` = `blocked | allowed`
- `revealState` = `hidden | revealed`
- `revealedAt | null`
- `revealedBy` = `system | user | llm | import | null`
- `revealReason | null`
- `flagsJson`
- `updatedAt`

Рекомендуемый unique constraint:

- `(chatId, branchId, recordId)`

### 6.5. Search index

Для v1 нужен SQLite FTS5 индекс поверх `knowledge_records`.

Технически это должна быть отдельная FTS virtual table, но логически она является search projection, а не новой доменной сущностью.

FTS index должен строиться по:

- `title`
- `aliases`
- `tags`
- `summary`
- `searchText`

Но только из разрешенного searchable material.

## 7. Access model for closed records

### 7.1. Почему нужен отдельный access model

Нужно различать:

- можно ли найти запись
- можно ли читать запись
- можно ли отправить запись в prompt

Это не один флаг.

### 7.2. `accessMode`

Рекомендуемые режимы записи:

- `public`
  - можно искать, читать и использовать

- `discoverable`
  - можно найти как candidate, но полное содержимое доступно только после выполнения условий

- `hidden`
  - запись не участвует в обычном поиске и не показывается модели до unlock/reveal

- `internal`
  - служебная запись для system/runtime use

### 7.3. Safe searchable surface

Для закрытых записей нужно разделять:

- `searchable metadata`
- `safe preview`
- `full content`

Пример:

- `title` доступен
- `summary` доступен в redacted-safe виде
- полный `contentJson` закрыт

Это дает возможность:

- найти релевантную запись
- не слить спойлер в prompt раньше времени

### 7.4. Gate policy

У записи должен быть `gatePolicyJson` в `metaJson` или отдельном поле.

Рекомендуемая логика v1:

- `all`
- `any`
- `not`

И предикаты:

- `flag_equals`
- `record_revealed`
- `record_state`
- `counter_gte`
- `manual_unlock`
- `branch_only`

Пример:

```json
{
  "discover": { "mode": "always" },
  "read": {
    "all": [
      { "type": "flag_equals", "key": "quest.met_historian", "value": true },
      { "type": "record_revealed", "recordKey": "clue:tablet" }
    ]
  },
  "prompt": {
    "all": [
      { "type": "record_revealed", "recordKey": "clue:tablet" }
    ]
  }
}
```

### 7.5. Reveal is a separate action

Запись не должна открываться автоматически от самого факта поиска.

Поиск и раскрытие должны быть разными действиями:

1. search находит candidate
2. backend проверяет access
3. отдельный reveal action может открыть запись

Правильный механизм:

- `knowledge.search` не меняет state
- `knowledge.reveal` меняет state

### 7.6. Allowed reveal triggers

Рекомендуемые trigger modes v1:

- `manual`
  - явное действие user/system

- `policy_only`
  - backend сам может раскрыть запись после deterministic policy check

- `llm_proposed`
  - LLM предлагает reveal, backend валидирует

- `record_revealed`
  - reveal по раскрытию другой записи

- `flag`
  - reveal по runtime progress flag

- `counter`
  - reveal по накопленному счетчику

### 7.7. Runtime truth

Правда о том, раскрыта запись или нет, должна храниться в `knowledge_record_access_state`, а не вычисляться только на лету.

Это нужно для:

- реплея ветки
- branch-specific state
- export modes
- понятного UI/debug

## 8. Provenance and baseline/runtime separation

### 8.1. Почему origin недостаточно

Одного поля `createdDuringGame` недостаточно.

Нужно различать:

- откуда запись появилась
- к какому слою относится
- является ли она производной

### 8.2. Recommended provenance fields

Для `knowledge_records`:

- `origin`
  - `import | author | system_seed | user | llm`

- `layer`
  - `baseline | runtime`

- `derivedFromRecordId | null`
  - если runtime record появился на основе существующей записи

- `sourceMessageId | null`
  - из какого сообщения появилась запись

- `sourceOperationId | null`
  - какая операция ее создала

### 8.3. Recommended rules

- baseline records не должны бездумно перезаписываться runtime логикой
- reveal state baseline records не должен мутировать сам baseline content
- runtime-created records должны быть явно отличимы от imported/seed records

### 8.4. Mutations

Для v1 рекомендуется:

- baseline content хранить как канонический слой
- reveal/progress state держать отдельно
- runtime-добавления хранить как runtime records

Полную copy-on-write overlay систему можно отложить.

## 9. Import/export model

### 9.1. Export unit

Основная единица export/import должна быть `knowledge_collection`.

### 9.2. Required export modes

Knowledge store должен поддерживать минимум такие режимы:

- `baseline_only`
  - только исходные baseline records и links

- `runtime_only`
  - только runtime-created records и runtime access state

- `baseline_plus_runtime`
  - полный snapshot

- `baseline_with_reveals`
  - baseline records + runtime reveal/access state, но без runtime-created records

### 9.3. Why this matters

Это позволяет:

- экспортировать чистый сценарный пакет без игрового мусора
- экспортировать только прогресс игры
- восстанавливать hidden/revealed state отдельно от контента

## 10. Search model

### 10.1. Search types

Search должен быть гибридным:

- exact by `key`
- exact/prefix by `title`
- aliases match
- tags overlap
- FTS5 full-text match
- optional relations-aware narrowing

### 10.2. Search request

Операции не должны слать произвольный SQL-подобный DSL.

Рекомендуемый безопасный API:

```json
{
  "textQuery": "лес древняя магия проклятие",
  "keys": ["dark_forest"],
  "titles": ["Темный лес"],
  "aliases": ["черный лес"],
  "tags": ["forest", "curse"],
  "recordTypes": ["location", "fact"],
  "collectionIds": ["mystery-pack"],
  "scope": "active_branch_visible",
  "includeHiddenCandidates": false,
  "limit": 10,
  "minScore": 0.25,
  "minimumShouldMatch": 2
}
```

### 10.3. Search response

Search должен возвращать:

- `recordId`
- `score`
- `matchReasons`
- `visibility`
- `preview`
- `record` only when allowed

Примерно так:

```json
{
  "hits": [
    {
      "recordId": "loc_dark_forest",
      "score": 0.91,
      "matchReasons": ["title_exact", "fts"],
      "visibility": "full",
      "preview": {
        "title": "Темный лес",
        "summary": "Древний лес на северной границе"
      },
      "record": {
        "recordType": "location",
        "tags": ["forest", "north", "curse"]
      }
    }
  ]
}
```

### 10.4. Ranking

V1 ranking может быть эвристическим:

- exact key > exact title > alias > tags > FTS
- FTS relevance учитывает BM25-like score
- `minimumShouldMatch` и `minScore` режут слабые совпадения

Точное математическое ранжирование не является ключевой целью v1.

### 10.5. Hidden content indexing rule

Полный hidden content не должен безусловно индексироваться в обычный searchable surface.

Рекомендуемое правило:

- `public` записи индексируются полностью
- `discoverable` записи индексируются по title/aliases/tags/safe preview
- `hidden` записи не участвуют в обычном search index

## 11. Retrieval flow inside operations

Правильный пайплайн:

1. `planner` operation/LLM читает текущий turn и возвращает retrieval request
2. backend выполняет search
3. backend фильтрует результаты по access policy
4. `curator` operation/LLM получает candidate set
5. curator выбирает только реально нужные записи
6. выбранный knowledge material попадает в prompt

Допустимы дополнительные операции:

- `knowledge.reveal`
- `knowledge.upsert`
- `knowledge.link`

Но они не должны смешиваться с `knowledge.search`.

## 12. How Chroma fits later

### 12.1. V1

В v1 Chroma не нужен для основной логики knowledge store.

V1 должен работать на:

- SQLite tables
- SQLite FTS5

### 12.2. V2

После появления vector retrieval:

- те же `knowledge_records` остаются source of truth
- в Chroma индексируются documents по тем же `recordId`
- metadata в Chroma содержит минимум:
  - `recordId`
  - `chatId`
  - `branchId`
  - `collectionId`
  - `recordType`
  - `accessMode`
  - `layer`

### 12.3. Hybrid retrieval in v2

Будущий hybrid retrieval:

1. exact/tag/FTS hits из SQLite
2. vector hits из Chroma
3. merge by `recordId`
4. rerank
5. pass to curator

Итог:

- не создается новая доменная сущность
- добавляется только еще один индексный слой

## 13. Recommended backend API surface

### 13.1. Repository-level operations

Нужны repository/service методы:

- `createKnowledgeCollection`
- `listKnowledgeCollections`
- `exportKnowledgeCollection`
- `importKnowledgeCollection`
- `upsertKnowledgeRecord`
- `listKnowledgeRecords`
- `searchKnowledgeRecords`
- `createKnowledgeLink`
- `listKnowledgeLinks`
- `revealKnowledgeRecord`
- `setKnowledgeAccessState`

### 13.2. Operation-facing actions

Для operation pipeline рекомендуется explicit actions:

- `knowledge.search`
- `knowledge.reveal`
- `knowledge.upsert`
- `knowledge.link`

`knowledge.search` должен быть read-only.

`knowledge.reveal` должен быть guarded.

## 14. V1 implementation blueprint

### Phase 1. Storage foundation

Сделать новые schema modules:

- `server/src/db/schema/chat-knowledge.ts`

Добавить таблицы:

- `knowledge_collections`
- `knowledge_records`
- `knowledge_record_links`
- `knowledge_record_access_state`

Добавить FTS migration для `knowledge_records`.

### Phase 2. Repository layer

Добавить `server/src/services/chat-knowledge/**`:

- collections repository
- records repository
- links repository
- access-state repository
- search service

### Phase 3. Search

Сделать search service с:

- exact lookup
- alias/tag lookup
- FTS lookup
- merge + ranking
- score thresholding

### Phase 4. Operation integration

Добавить operation-facing use cases:

- planner -> retrieval request
- search -> candidate set
- curator -> prompt-ready reduction
- reveal action

### Phase 5. Import/export

Добавить collection import/export contracts.

Минимальные режимы:

- baseline only
- runtime only
- full snapshot

### Phase 6. Chroma sync

После стабилизации SQLite knowledge model:

- добавить optional Chroma sync/indexing
- не менять доменные ids и storage truth

## 15. Non-goals for v1

В v1 не нужно:

- делать universal query DSL
- делать глубокую branch inheritance chain
- делать сложную graph query language
- делать full semantic retrieval mandatory
- давать LLM прямой доступ к raw hidden payload
- завязывать truth целиком на Chroma

## 16. Final decisions captured by this spec

1. Knowledge store это отдельная доменная сущность, не `world-info`, не artifacts и не runtime state.
2. Записи должны быть chat-scoped и branch-scoped.
3. Source of truth должен быть в SQLite.
4. Обычный поиск v1 должен быть гибридным и включать FTS5.
5. Chroma должен использоваться позже как вторичный vector index поверх тех же записей.
6. Search не должен автоматически раскрывать записи.
7. Для закрытых записей нужен отдельный access/reveal model.
8. Baseline и runtime данные должны быть явно разделены.
9. Import/export должен работать на уровне collections и поддерживать разные режимы snapshot.
10. В prompt попадает только результат explicit retrieval + curation, а не вся knowledge база.
