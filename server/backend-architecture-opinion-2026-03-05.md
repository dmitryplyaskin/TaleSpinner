# TaleSpinner backend: what you are building and where the architecture now fights you

Date: 2026-03-05

This note is based on the current backend code in `server/src/**`.

## First: what you are trying to build

TaleSpinner is not just an LLM chat backend.

From the current code, you are building an integrated narrative workspace where:

- chats have branches and variants;
- messages are stored as structured entry parts, not only plain text;
- prompt assembly depends on instructions, personas, entity profiles, and multi-scope World Info;
- generation is reproducible through snapshots, debug payloads, phase reports, and generation links;
- generation can be extended by Operations with hooks, dependencies, activation policies, artifacts, and before/after-LLM effects;
- LLM, RAG, Chroma, and media/file flows are part of one runtime.

So the real product is a reproducible storytelling and roleplay runtime with prompt orchestration.

That means the backend should optimize for:

- explicit domain boundaries;
- deterministic generation workflows;
- safe persistence across many intermediate states;
- debuggability;
- a clean path for future pipeline evolution.

## What is already strong

There is real product thinking in the backend.

Strong parts:

- `services/chat-generation-v3/**` models generation as phases, not one opaque provider call.
- `shared/types/operation-profiles.ts` defines a serious contract for hooks, artifacts, activation, and execution modes.
- `core/llm-gateway/**` moves in the right direction: provider abstraction, plugins, normalized request flow.
- World Info and prompt-building logic are treated as backend domain concepts, which is correct for this product.
- There are many useful tests in critical areas.

The problem is not the idea. The problem is that the architecture no longer matches the ambition of the domain.

## Main architectural problems

### 1. There is no stable application-layer boundary

Transport, orchestration, persistence, and domain decisions are mixed too often.

The clearest example is `server/src/api/chat-entries.api.ts`. It is about 2111 lines and contains:

- HTTP routing;
- SSE handling;
- validation;
- chat state lookup;
- prompt preprocessing;
- entry, variant, part, and turn creation;
- generation flow wiring;
- cleanup;
- diagnostics shaping.

This route file is actually an application service, streaming adapter, and persistence coordinator at the same time.

`server/src/services/chat-generation-v3/run-chat-generation-v3.ts` has the same problem in another layer. It is about 904 lines and mixes orchestration, event queueing, persistence updates, debug snapshots, and finalization.

Why this is bad:

- every new generation feature increases coupling with HTTP and SSE;
- the same use case is hard to reuse from workers, CLI, or future transports;
- transaction boundaries become accidental;
- tests become integration-heavy because there is no small seam around the use case itself.

Best fix:

- introduce an explicit application layer per use case;
- keep routes thin;
- make generation use cases callable without Express.

### 2. The codebase mixes several architectural eras at once

`server/src/app.ts` registers both:

- newer `api/*` routers from `server/src/api/_routes_.ts`;
- older manual routers from `server/src/routes/*`.

There is also `core/factories/route-factory.ts`, but in current active code it is barely used outside `samplers.api.ts` and legacy modules.

This creates a false architecture: the repo contains abstractions that are no longer the real backend shape, but a reader still has to understand them.

Why this is bad:

- it is unclear which style is canonical;
- refactoring becomes inconsistent;
- some modules evolve around use cases, others around generic CRUD, others around direct route scripting.

Best fix:

- choose one backend style and finish the migration;
- remove dead architectural scaffolding if it is no longer strategic;
- stop investing in generic route factories for domain-heavy flows.

My opinion: this product should prefer explicit use-case controllers, not generic CRUD abstractions.

### 3. Process-local global state is a hard ceiling

There are several important process-level singletons:

- `server/src/db/client.ts`: module-global `_db` and `_sqlite`;
- `server/src/services/chat-core/generation-runtime.ts`: in-memory `active` map for aborting generations;
- `server/src/services/llm/llm-service.ts`: in-memory `tokenLastTouchedAt` throttle map;
- `server/src/config/load-backend-env.ts`: cached one-time env loading.

Some global state is acceptable. The real issue is that generation control depends on it.

The `generation-runtime.ts` design assumes:

- one backend instance;
- sticky connection and sticky abort semantics;
- no worker separation;
- no horizontal scale for generation execution.

For a product centered on long-running streams and reproducible generation, that is a real architectural limit.

Best fix:

- define what is only a local cache and what is shared runtime state;
- move generation run registry toward a shared control-plane model if multi-instance execution is ever needed;
- treat abort as a command against durable run state, not only an in-memory `AbortController`.

### 4. Transaction boundaries are weak and mostly implicit

Most repositories call `initDb()` inside each function and operate independently. Some functions use transactions, but there is no explicit unit-of-work across full application flows.

That is risky for flows like:

- create user entry;
- create assistant placeholder;
- create parts;
- increment turn;
- start generation;
- link variant to generation;
- finalize reports;
- cleanup aborted empty variants.

Today this logic is split across route code, generation services, and repositories. If any step fails mid-flow, partial state is possible by design.

The system is mature enough that this is no longer "just a few inserts". It is a domain transaction.

Best fix:

- introduce an application transaction boundary;
- let repositories accept either `db` or `tx`;
- define which writes are atomic and which are intentionally eventual.

### 5. The domain is richer than the type discipline at the boundaries

A lot of persistence still flows through:

- `unknown`;
- permissive `metaJson`;
- ad hoc records;
- `as any` conversions in repositories and DTO shaping.

This was fine for speed earlier, but now it blocks clarity.

Your backend is trying to support a structured runtime:

- operation artifacts;
- prompt diagnostics;
- entry, variant, and part state;
- world info bindings;
- runtime provider configs.

When these are stored and passed as weakly typed JSON islands, the architecture becomes "schema by convention". That raises the cost of every refactor.

Best fix:

- keep JSON extensibility only at intentional extension points;
- promote high-value `metaJson` payloads into typed domain objects;
- add boundary schemas for persisted debug payloads and derived metadata;
- reduce `unknown` in paths that affect generation behavior.

### 6. Bootstrapping is too eager

`server/src/app.ts` runs on startup:

- `initDb`
- `applyMigrations`
- `ensureInstructionsSchema`
- `ensureOperationBlocksCutover`
- `bootstrapLlm`
- `bootstrapRag`
- `bootstrapChroma`

That couples API availability to migrations and all major integrations.

Why this is bad:

- startup is brittle;
- partial availability is impossible;
- readiness cannot be reported by subsystem;
- future API and worker separation gets harder.

Best fix:

- keep DB migration/bootstrap explicit;
- separate required startup from optional subsystem warmup;
- expose readiness by subsystem;
- consider lazy initialization for optional integrations.

For example, a Chroma warmup failure should not necessarily block the whole app if non-RAG flows can still work.

### 7. Ownership and tenant model are still mostly a default, not a real backend concept

The repeated `ownerId ?? "global"` pattern is everywhere across chats, instructions, operations, world info, RAG, and generation entry flows.

Right now tenanting looks more like a convenience default than a consistently enforced domain boundary.

Why this matters:

- auth integration will be harder later;
- it is unclear which entities are truly global and which are user-owned;
- permission rules stay implicit;
- APIs start trusting caller-supplied ownership semantics.

Best fix:

- introduce an explicit request context with authenticated actor and tenant scope;
- distinguish clearly between global system config and user-owned data;
- stop letting route bodies define ownership rules directly.

### 8. Observability is weaker than the orchestration complexity

There is useful generation debug persistence, but runtime observability is still too light:

- mostly console logging;
- no strong request and run correlation strategy;
- no consistent operational event format outside the SSE stream;
- weak separation between user-facing debug and operator-facing telemetry.

That becomes painful once flows involve hooks, activation state, provider fallback, aborts, and cleanup.

Best fix:

- add structured logs with `requestId`, `generationId`, `chatId`, and `branchId`;
- separate business diagnostics from operator telemetry;
- log phase boundaries and failure classes in one consistent format.

## Non-obvious architecture smells

### `chat-entries.api.ts` is effectively a backend sub-system, not a route file

When one route module owns entry creation, generation streaming, regenerate, diagnostics, world info activation reporting, manual edits, mutable batch patches, and projection building, the real module boundary is wrong.

It should be split by use case and by transport concern.

### `services/*-repository.ts` are often repositories only by filename

Many repository modules also:

- shape domain DTOs;
- enforce business defaults;
- parse free-form JSON;
- decide fallback ownership;
- coordinate multiple tables.

That means repository semantics are inconsistent. Some are data access layers, some are mini-services.

Repositories should be boring. If they are smart, the application layer becomes invisible.

### The generation engine is architecturally important but still wired like an internal helper

`runChatGenerationV3` is not a helper. It is a core engine.

Treating it as one exported procedural generator makes it easy to call, but hard to evolve. The domain likely wants a more explicit runtime boundary:

- input contract;
- emitted events;
- state transitions;
- persistence ports;
- cancellation contract.

Once that is explicit, you can move it between HTTP, workers, tests, or offline replay more safely.

## Constraints that will block high-quality improvement

### 1. Single-process assumptions

Because active generation control is in memory, the backend is biased toward one node and one runtime.

That blocks:

- horizontal scale;
- worker separation;
- durable abort and resume semantics;
- stronger operational control.

### 2. Missing use-case seams

Because key flows are assembled inside routes, it is hard to add:

- background generation queues;
- alternate transports;
- scheduled jobs;
- replay tools;
- stronger transaction policies.

You would keep reusing HTTP-centric code for non-HTTP problems.

### 3. Weak transaction model

Because the flow spans many repositories without an explicit unit-of-work, every reliability improvement remains partial.

You can add cleanup and retries, but not confidence.

### 4. Soft tenant model

Because ownership is still mostly `"global"` by convention, serious multi-user support will become a rewrite tax later.

### 5. Too much strategic logic in free-form JSON

Because important behavior is stored in weakly typed JSON, deep refactors become archaeology rather than engineering.

## How I would improve it

### Stage 1: define the real backend shape

Before more features:

1. Define bounded contexts:
   - chat/session runtime
   - generation runtime
   - world info
   - operations
   - LLM runtime/config
   - RAG
2. For each context, define:
   - application services
   - repositories
   - external adapters
   - transport adapters
3. Freeze the canonical backend style and stop mixing new code with old patterns.

### Stage 2: extract the generation application layer

Start with the highest-value flow.

Extract from `chat-entries.api.ts`:

- create user turn plus assistant placeholder;
- continue generation;
- regenerate assistant variant;
- prompt diagnostics fetch.

These should become application use cases returning typed results or events. HTTP should only:

- validate request;
- open SSE;
- map use-case events to transport envelopes;
- map errors to HTTP.

### Stage 3: introduce explicit transaction passing

Make repositories accept an optional `tx`.

Then define which operations are atomic:

- message, variant, and part creation before generation starts;
- generation report finalization;
- cleanup of aborted or empty generation artifacts.

This one step will reduce hidden persistence bugs more than many smaller cleanups.

### Stage 4: formalize runtime control state

Separate:

- process-local performance caches;
- durable generation state;
- operator control commands like abort.

That gives you a path to workers later without rewriting the whole generation engine.

### Stage 5: make tenant and auth context explicit

Create a request context and stop using caller-provided `ownerId` as a primary control mechanism.

Even if auth is not ready yet, define the shape now:

- actorId
- tenantId
- permissions
- requestId

Then thread that through application services.

### Stage 6: reduce strategic `unknown`

Target the highest-value payloads first:

- generation debug payloads;
- variant derived metadata;
- part meta relevant to editing and generation;
- operation artifact persistence;
- provider config payloads where behavior depends on them.

## Short verdict

The backend already contains the core of a strong product idea: reproducible narrative generation with explicit orchestration.

But the architecture is still too route-centric and process-centric for the domain it now serves.

If you keep adding features without changing the backend shape, the system will still work, but every meaningful improvement will become slower, riskier, and more local than it should be.

The single most important move is this:

build a real application layer around generation and chat runtime, and make HTTP/SSE only an adapter to it.

That one change unlocks almost every other improvement you want later.

## Phase 1 implementation status (2026-03-05)

This first implementation slice has now been started in the backend.

What was done:

- A new application-layer subtree was added under `server/src/application/chat-runtime/**`.
- The four targeted use cases from this note were extracted:
  - `createEntryAndStartGeneration`
  - `continueGeneration`
  - `regenerateAssistantVariant`
  - `getPromptDiagnostics`
- `server/src/api/chat-entries.api.ts` now uses those use cases for the generation-heavy flows instead of assembling the full orchestration directly in the route handlers.
- The route keeps transport concerns for those flows:
  - request validation
  - SSE setup and disconnect handling
  - mapping internal run events to the existing SSE contract
- A shared generation-session wrapper was introduced so post-stream finalization is owned by the application layer, not by Express.
- A shared DB executor type and transaction helper were added in `server/src/db/client.ts`.
- The repositories touched by these flows now accept an optional executor/transaction handle where needed.
- The pre-generation write scaffolding is now atomic for the extracted flows:
  - create entry + user part + assistant placeholder flow
  - continue flow
  - regenerate flow
- Prompt diagnostics helper logic was moved into the new application-layer helper module so tests no longer depend on the route module owning that non-HTTP logic.
- New focused tests were added for the new application-layer use cases, including rollback and regenerate cleanup behavior.

What was intentionally not changed in this slice:

- No HTTP paths were changed.
- No request/response payload shape was changed.
- No SSE event names or envelope format were changed.
- No DB schema migration was added.
- `runChatGenerationV3` is still the core engine; it was wrapped, not redesigned.
- The in-memory generation abort/runtime model was not replaced yet.
- Startup/bootstrap separation was not changed yet.
- Tenant/auth/request-context work was not started yet.
- The `ownerId ?? "global"` default model remains in place.
- `chat-entries.api.ts` still contains non-targeted endpoints and some route-local logic outside the extracted generation slice. This was a deliberate scope cut for the first increment.

What this means architecturally:

- The backend now has a real application seam around the highest-value generation flows.
- HTTP/SSE is thinner for those flows than before, but the whole backend is not yet fully migrated to the new shape.
- Transaction boundaries are stronger where generation scaffolding starts, but they are not yet generalized across the entire backend.

Validation that was run for this slice:

- `yarn typecheck:server`
- `yarn --cwd server test -- chat-entries`
- `yarn --cwd server test -- chat-generation-use-cases`
- `yarn --cwd server test -- run-chat-generation-v3`
- `yarn --cwd server test:e2e:smoke`

Current practical status:

- The first move described in this note is no longer only a recommendation; it is now partially implemented.
- The next logical follow-up is to continue the same migration style for the remaining `chat-entries.api.ts` domain-heavy flows and then widen explicit transaction passing beyond this first slice.

## Phase 1.2 implementation status (2026-03-06)

This second implementation slice has now been completed in the backend.

What was done:

- The remaining mutation-heavy `chat-entries` flows from this migration scope were extracted into application use cases under `server/src/application/chat-runtime/use-cases/**`:
  - `manualEditEntry`
  - `batchUpdateEntryParts`
  - `selectEntryVariant`
  - `deleteEntryVariant`
  - `setEntryPromptVisibility`
  - `undoPartCanonicalization`
- `server/src/api/chat-entries.api.ts` now calls those use cases instead of assembling their business logic inline in Express handlers.
- The application helper module became the canonical home for the mutation-side helper logic added in this slice:
  - manual edit target selection
  - batch update planning
  - prompt visibility meta shaping
  - canonicalization undo cascade resolution
- Transaction/executor passing was widened in the repositories needed by this slice:
  - `updateEntryMeta`
  - `applyManualEditToPart`
  - `softDeletePart`
  - `deleteVariant`
- The following writes are now atomic where they were not reliably grouped before:
  - manual edit part update + entry meta update
  - variant deletion + active variant fallback switch
  - canonicalization undo cascade soft-delete
- A new focused application-layer test file was added for these mutation use cases, including rollback coverage.

Validation that was run for this slice:

- `yarn typecheck:server`
- `yarn --cwd server test -- chat-entry-mutation-use-cases`
- `yarn --cwd server test -- chat-entries.meta`

What was intentionally not changed in this slice:

- No HTTP paths were changed.
- No request/response payload shape was changed.
- No SSE event names or envelope format were changed.
- No DB schema migration was added.
- The simple CRUD-style soft-delete endpoints were not moved into application use cases in this increment.
- The read-side handlers in `chat-entries.api.ts` were not extracted yet:
  - entries listing
  - operation runtime state
  - latest world info activations
  - variants listing
- `runChatGenerationV3` is still the same engine-level procedural core.
- The in-memory generation runtime/abort model is still in place.
- Startup/bootstrap separation in `server/src/app.ts` was not changed.
- Tenant/auth/request-context work was not started yet.

What this means architecturally:

- The highest-value write paths inside `chat-entries.api.ts` now have a real application-layer seam.
- HTTP is thinner on both generation and non-generation mutation flows than before.
- Transaction boundaries are better defined for entry/variant/part mutation paths, but they are still not a backend-wide convention.
- The migration is now clearly real, but not finished: `chat-entries.api.ts` is still large and still owns important read-side/domain-adjacent logic.

Current practical status:

- `chat-entries.api.ts` is smaller than before, but it is still about 1681 lines, which means the route module is improved, not yet healthy.
- The `chat-runtime` application layer now contains the first real cluster of backend use cases instead of only generation scaffolding.
- The next work should no longer start with more features in this area; it should finish stabilizing the backend shape first.

## What still needs to be done

### 1. Finish the `chat-entries` migration on the read side

This is the nearest and highest-leverage follow-up.

Still inside `server/src/api/chat-entries.api.ts` there are handlers that mix transport and domain/read-model logic:

- `GET /chats/:id/entries`
- `GET /chats/:id/operation-runtime-state`
- `GET /chats/:id/world-info/latest-activations`
- `GET /entries/:id/variants`

Why this still matters:

- prompt-window computation, projection shaping, and world-info/runtime-state assembly are still route-owned;
- the route still contains canonical helper code that should belong to the application layer only;
- tests for these read-side behaviors are still coupled more tightly to the route module than they should be.

Recommended next step:

- extract read-side application queries/use cases for those handlers;
- move any remaining helper logic they need out of the route module;
- leave HTTP as validation + response mapping only.

### 2. Generalize transaction boundaries beyond this slice

The repository executor pattern now exists in the right places, but it is still selective.

What remains:

- define which chat/runtime flows are atomic by design, not by accident;
- continue optional `executor` support where write coordination still spans multiple repositories;
- audit post-generation finalization/reporting/cleanup flows for partial-write risk.

This is the next reliability improvement after the route extraction work.

### 3. Put a real engine boundary around `runChatGenerationV3`

The route and use-case extraction improved the application layer, but the generation core is still a very large mixed module at about 973 lines.

What remains:

- separate orchestration from persistence side effects;
- make engine input, emitted events, and persistence/control ports more explicit;
- reduce the amount of strategic behavior hidden inside one procedural runtime function.

Until this is done, generation evolution will remain slower than the rest of the migration.

### 4. Remove single-process assumptions from generation control

`server/src/services/chat-core/generation-runtime.ts` is still a small in-memory active-run registry.

That means:

- abort is still process-local;
- multi-instance execution is still not a first-class design target;
- workers or remote execution would still require architectural change, not just wiring.

Recommended direction:

- introduce a durable/shared run-control model;
- treat abort as a command against run state, not only an in-memory `AbortController`.

### 5. Separate required startup from optional subsystem warmup

`server/src/app.ts` still eagerly runs:

- migrations
- schema cutover helpers
- LLM bootstrap
- RAG bootstrap
- Chroma bootstrap

It also still mixes newer API registration with older manual route modules.

What remains:

- split hard startup requirements from optional integrations;
- add clearer readiness boundaries by subsystem;
- continue removing mixed architectural eras from app wiring.

### 6. Make request context, tenanting, and ownership explicit

The `ownerId ?? "global"` default is still the dominant ownership model.

What remains:

- define an explicit request context shape;
- distinguish actor/tenant/system scope cleanly;
- stop letting route payloads define ownership semantics directly.

This should happen before deeper auth work, not after it.

### 7. Reduce strategic `unknown` and weak JSON contracts

This migration improved flow shape, but not yet the type strictness of many persisted domain payloads.

High-value candidates still include:

- generation debug payloads
- variant derived metadata
- edit/generation-relevant part metadata
- operation artifacts
- provider/runtime config payloads

This is still necessary to make future refactors cheaper and safer.

### 8. Improve operational observability

The backend still needs:

- structured request/run correlation
- consistent operator-facing lifecycle logs
- clearer distinction between user diagnostics and operational telemetry

This becomes more important as the application layer gets cleaner, because orchestration boundaries become easier to observe consistently.

## Recommended implementation order after Phase 1.2

1. Finish read-side extraction from `chat-entries.api.ts`.
2. Widen transaction conventions to remaining multi-repository write flows.
3. Refactor `runChatGenerationV3` behind a more explicit runtime boundary.
4. Separate startup/bootstrap concerns in `app.ts` and continue removing mixed route eras.
5. Design request context + tenant model.
6. Tighten typed JSON/domain contracts.
7. Improve observability and then revisit shared/durable generation control.
