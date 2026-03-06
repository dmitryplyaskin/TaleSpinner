# TaleSpinner backend: что именно ты строишь и где архитектура уже начинает мешать

Дата: 2026-03-05

Эта заметка основана на текущем backend-коде в `server/src/**`.

## Сначала: что ты на самом деле пытаешься сделать

TaleSpinner сейчас это не просто backend для чата с LLM.

По текущему коду видно, что ты строишь интегрированную narrative/workspace-систему, где:

- у чатов есть ветки и варианты;
- сообщения хранятся как структурированные `entry parts`, а не только как плоский текст;
- сборка промпта зависит от instructions, personas, entity profiles и multi-scope World Info;
- генерация должна быть воспроизводимой через snapshots, debug payloads, phase reports и generation links;
- генерация расширяется через Operations с hooks, dependencies, activation policies, artifacts и before/after-LLM effects;
- LLM, RAG, Chroma и media/file-флоу являются частью одного runtime.

То есть реальный продукт здесь это воспроизводимый storytelling/roleplay runtime с управляемой prompt-orchestration.

А значит backend должен быть оптимизирован под:

- явные доменные границы;
- детерминированные generation workflows;
- безопасную persistence при множестве промежуточных состояний;
- хорошую отладку;
- чистую эволюцию pipeline в будущем.

## Что уже сильное

В backend есть реальная продуктовая мысль.

Сильные стороны:

- `services/chat-generation-v3/**` уже моделирует генерацию как набор фаз, а не как один непрозрачный вызов провайдера.
- `shared/types/operation-profiles.ts` задаёт серьёзный контракт для hooks, artifacts, activation и execution modes.
- `core/llm-gateway/**` движется в правильную сторону: provider abstraction, plugins, normalized request flow.
- World Info и prompt-building логика воспринимаются как backend-domain concepts, и для такого продукта это правильно.
- В важных местах уже есть полезные тесты.

Проблема не в идее. Проблема в том, что архитектура уже не соответствует масштабу домена.

## Главные архитектурные проблемы

### 1. Нет стабильной application-layer границы

Transport, orchestration, persistence и domain decisions слишком часто смешаны в одном месте.

Самый явный пример это `server/src/api/chat-entries.api.ts`. Файл примерно на 2111 строк и в нём одновременно находятся:

- HTTP routing;
- SSE handling;
- validation;
- lookup текущего состояния чата;
- prompt preprocessing;
- создание entries, variants, parts и turns;
- wiring generation flow;
- cleanup;
- diagnostics shaping.

Этот route-файл уже фактически является application service, streaming adapter и persistence coordinator одновременно.

`server/src/services/chat-generation-v3/run-chat-generation-v3.ts` страдает от той же проблемы на другом уровне. Он примерно на 904 строки и смешивает orchestration, event queueing, persistence updates, debug snapshots и finalization.

Почему это плохо:

- любая новая generation-фича ещё сильнее сцепляется с HTTP и SSE;
- тот же самый use case трудно переиспользовать из workers, CLI или будущих transport-слоёв;
- транзакционные границы становятся случайными;
- тесты неизбежно становятся слишком integration-heavy, потому что нет маленького seam вокруг самого use case.

Как лучше чинить:

- ввести явный application layer по use cases;
- сделать routes тонкими;
- сделать generation use cases вызываемыми без Express.

### 2. В кодовой базе одновременно живут несколько архитектурных эпох

`server/src/app.ts` регистрирует одновременно:

- более новые `api/*` routers из `server/src/api/_routes_.ts`;
- старые manual routers из `server/src/routes/*`.

Параллельно существует `core/factories/route-factory.ts`, но в актуальном коде он почти не используется вне `samplers.api.ts` и legacy-модулей.

Из-за этого возникает ложная архитектура: в репозитории есть абстракции, которые уже не описывают реальную форму backend, но их всё равно приходится держать в голове.

Почему это плохо:

- непонятно, какой стиль является каноническим;
- рефакторинг идёт неравномерно;
- часть модулей живёт вокруг use cases, часть вокруг generic CRUD, часть вокруг прямого route scripting.

Как лучше чинить:

- выбрать один backend-стиль и довести миграцию до конца;
- убрать мёртвый архитектурный scaffolding, если он больше не стратегический;
- не инвестировать дальше в generic route factories для domain-heavy flows.

Моё мнение: этому продукту нужны explicit use-case controllers, а не generic CRUD abstractions.

### 3. Process-local global state уже стал архитектурным потолком

Есть несколько важных process-level singleton-ов:

- `server/src/db/client.ts`: module-global `_db` и `_sqlite`;
- `server/src/services/chat-core/generation-runtime.ts`: in-memory `active` map для abort generation;
- `server/src/services/llm/llm-service.ts`: in-memory `tokenLastTouchedAt` throttle map;
- `server/src/config/load-backend-env.ts`: cached one-time env loading.

Некоторый global state допустим. Но настоящая проблема в том, что generation control опирается на него напрямую.

Текущий `generation-runtime.ts` по сути предполагает:

- один backend instance;
- sticky connection и sticky abort semantics;
- отсутствие worker separation;
- отсутствие horizontal scale для generation execution.

Для продукта, который завязан на long-running streams и reproducible generation, это уже реальное архитектурное ограничение.

Как лучше чинить:

- явно разделить, что является только local cache, а что является shared runtime state;
- двигать generation run registry в сторону shared control-plane модели, если когда-нибудь понадобится multi-instance execution;
- воспринимать abort как команду против durable run state, а не только как in-memory `AbortController`.

### 4. Транзакционные границы слабые и в основном неявные

Большинство repositories вызывают `initDb()` внутри каждой функции и работают независимо. В некоторых местах есть transactions, но нет явного unit-of-work на уровне полного application flow.

Это опасно для цепочек вроде:

- создать user entry;
- создать assistant placeholder;
- создать parts;
- увеличить turn;
- стартовать generation;
- связать variant с generation;
- завершить reports;
- почистить aborted empty variants.

Сейчас эта логика размазана между route-кодом, generation services и repositories. Если любой шаг падает посередине, частично записанное состояние получается архитектурно нормальным сценарием.

Система уже достаточно зрелая, чтобы это больше не считалось "просто несколько insert/update". Это уже доменная транзакция.

Как лучше чинить:

- ввести application transaction boundary;
- позволить repositories принимать `db` или `tx`;
- явно определить, какие записи атомарны, а какие намеренно eventual.

### 5. Домен богаче, чем типовая дисциплина на границах

Сейчас много persistence всё ещё проходит через:

- `unknown`;
- слишком свободный `metaJson`;
- ad hoc records;
- `as any` при DTO shaping и в repositories.

На раннем этапе это нормально. Сейчас это уже ограничивает ясность.

Backend пытается поддерживать структурированный runtime:

- operation artifacts;
- prompt diagnostics;
- состояние entry, variant и part;
- world info bindings;
- runtime provider configs.

Когда всё это хранится и прокидывается как слаботипизированные JSON-островки, архитектура превращается в "schema by convention". Это резко повышает цену любого рефакторинга.

Как лучше чинить:

- оставить JSON extensibility только в осознанных extension points;
- поднять самые важные `metaJson` payloads в typed domain objects;
- добавить boundary schemas для persisted debug payloads и derived metadata;
- уменьшить долю `unknown` в путях, которые влияют на generation behavior.

### 6. Bootstrapping слишком eager

`server/src/app.ts` на старте выполняет:

- `initDb`
- `applyMigrations`
- `ensureInstructionsSchema`
- `ensureOperationBlocksCutover`
- `bootstrapLlm`
- `bootstrapRag`
- `bootstrapChroma`

То есть доступность API жёстко сцеплена с migrations и всеми крупными integrations.

Почему это плохо:

- старт хрупкий;
- частичная доступность невозможна;
- readiness по subsystem-ам не видна;
- дальнейшее разделение API и workers усложняется.

Как лучше чинить:

- сделать DB migration/bootstrap явным;
- разделить required startup и optional subsystem warmup;
- показывать readiness по subsystem-ам;
- для optional integrations рассмотреть lazy initialization.

Например, падение при Chroma warmup не обязательно должно блокировать весь backend, если non-RAG flows могут продолжать работать.

### 7. Ownership и tenant model пока существуют скорее как default, а не как backend-концепт

Паттерн `ownerId ?? "global"` повторяется по всему backend: chats, instructions, operations, world info, RAG, generation entry flows.

Сейчас tenanting выглядит скорее как удобный default, а не как жёстко проведённая domain boundary.

Почему это важно:

- потом будет тяжелее интегрировать auth;
- неочевидно, какие сущности действительно global, а какие user-owned;
- permission rules остаются неявными;
- API начинает доверять ownership semantics, пришедшим от клиента.

Как лучше чинить:

- ввести явный request context с authenticated actor и tenant scope;
- чётко различить global system config и user-owned data;
- перестать позволять route body определять ownership rules напрямую.

### 8. Observability слабее, чем сложность orchestration

Полезные generation debug payloads в persistence уже есть, но runtime observability всё ещё слабая:

- в основном `console` logging;
- нет сильной стратегии request/run correlation;
- нет единого operational event format вне SSE stream;
- плохо разделены user-facing debug и operator-facing telemetry.

Это начнёт сильно мешать, когда flow включает hooks, activation state, provider fallback, aborts и cleanup.

Как лучше чинить:

- ввести structured logs с `requestId`, `generationId`, `chatId`, `branchId`;
- разделить business diagnostics и operator telemetry;
- логировать phase boundaries и failure classes в одном консистентном формате.

## Неочевидные архитектурные запахи

### `chat-entries.api.ts` уже фактически backend subsystem, а не route file

Когда один route-модуль держит на себе entry creation, generation streaming, regenerate, diagnostics, world info activation reporting, manual edits, mutable batch patches и projection building, это означает, что реальная модульная граница выбрана неправильно.

Его нужно дробить по use cases и по transport concerns.

### `services/*-repository.ts` часто repositories только по имени

Многие repository-модули ещё и:

- shape-ят domain DTOs;
- задают business defaults;
- парсят free-form JSON;
- решают fallback ownership;
- координируют несколько таблиц.

Из-за этого semantics repositories непоследовательны. Где-то это data access layer, где-то уже mini-service.

Repositories должны быть скучными. Если они становятся слишком умными, application layer исчезает как слой.

### Generation engine архитектурно важен, но всё ещё подключён как внутренний helper

`runChatGenerationV3` это не helper. Это core engine.

Пока он существует как один exported procedural generator, его легко вызвать, но трудно эволюционировать. Скорее всего домену нужна более явная runtime boundary:

- input contract;
- emitted events;
- state transitions;
- persistence ports;
- cancellation contract.

Когда это будет выражено явно, движок можно будет безопаснее переносить между HTTP, workers, tests и offline replay.

## Ограничения, которые будут мешать качественно улучшать приложение

### 1. Single-process assumptions

Пока active generation control живёт в памяти процесса, backend по архитектуре тяготеет к одному node и одному runtime.

Это блокирует:

- horizontal scale;
- worker separation;
- durable abort/resume semantics;
- более сильный operational control.

### 2. Нет use-case seams

Пока ключевые flows собираются прямо внутри routes, становится трудно нормально добавлять:

- background generation queues;
- alternate transports;
- scheduled jobs;
- replay tools;
- более строгие transaction policies.

Ты неизбежно продолжаешь использовать HTTP-centric код для не-HTTP задач.

### 3. Слабая transaction model

Пока flow проходит через много repositories без явного unit-of-work, любое повышение надёжности остаётся частичным.

Можно добавлять cleanup и retries, но нельзя получить реальную уверенность.

### 4. Мягкая tenant model

Пока ownership в основном живёт как `"global"` по соглашению, серьёзный multi-user потом превратится в rewrite tax.

### 5. Слишком много стратегической логики в free-form JSON

Пока важное поведение хранится в слаботипизированных JSON-структурах, глубокий рефакторинг превращается в археологию вместо инженерии.

## Как бы я это улучшал

### Этап 1: зафиксировать реальную форму backend

До добавления новых фич:

1. Выделить bounded contexts:
   - chat/session runtime
   - generation runtime
   - world info
   - operations
   - LLM runtime/config
   - RAG
2. Для каждого контекста определить:
   - application services
   - repositories
   - external adapters
   - transport adapters
3. Заморозить канонический backend-стиль и перестать смешивать новый код со старыми паттернами.

### Этап 2: вынести generation application layer

Начинать стоит с самого ценного flow.

Из `chat-entries.api.ts` нужно вытаскивать в use cases:

- создание user turn плюс assistant placeholder;
- continue generation;
- regenerate assistant variant;
- prompt diagnostics fetch.

Эти сценарии должны стать application use cases, которые возвращают typed results/events. HTTP-слой должен только:

- валидировать запрос;
- открывать SSE;
- маппить use-case events в transport envelopes;
- маппить ошибки в HTTP.

### Этап 3: ввести явную передачу транзакции

Пусть repositories принимают optional `tx`.

После этого нужно явно определить, какие операции атомарны:

- создание message, variant и part до старта generation;
- finalization generation reports;
- cleanup aborted/empty generation artifacts.

Именно этот шаг даст больше пользы по надёжности, чем множество мелких локальных чисток.

### Этап 4: формализовать runtime control state

Нужно явно разделить:

- process-local performance caches;
- durable generation state;
- operator control commands вроде abort.

Это даст путь к workers later без переписывания всего generation engine.

### Этап 5: сделать tenant/auth context явным

Нужно создать request context и перестать использовать caller-provided `ownerId` как основной механизм контроля.

Даже если auth ещё не готов, форму лучше зафиксировать уже сейчас:

- actorId
- tenantId
- permissions
- requestId

И затем протащить это через application services.

### Этап 6: уменьшать долю стратегического `unknown`

Сначала стоит бить по самым ценным payloads:

- generation debug payloads;
- variant derived metadata;
- part meta, влияющее на editing/generation;
- operation artifact persistence;
- provider config payloads, от которых зависит поведение.

## Короткий вердикт

В backend уже есть ядро сильной продуктовой идеи: воспроизводимая narrative generation с явной orchestration.

Но архитектура всё ещё слишком route-centric и process-centric для домена, который она уже обслуживает.

Если продолжать добавлять фичи без смены формы backend, система будет работать, но каждое важное улучшение будет становиться медленнее, рискованнее и локальнее, чем должно быть.

Самый важный следующий шаг такой:

построить реальный application layer вокруг generation и chat runtime, а HTTP/SSE оставить только адаптером к нему.

Именно этот шаг откроет почти все остальные улучшения, которые тебе потом понадобятся.
