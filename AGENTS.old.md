# AGENTS.md - TaleSpinner

Repository contract for coding agents working in this repo.
This file is strict on purpose. Follow it literally.

## Project Identity
- TaleSpinner is a local LLM application for storytelling, roleplay, and multi-agent scenario building.
- The product is built around isolated profiles, chats and branches, world info, instructions, operation pipelines, and optional RAG flows.
- The goal is not "one big prompt". The goal is a reproducible, controllable LLM workflow with clean context boundaries.

## Quick Commands
- Install app deps: `yarn install:all`
- Install docs deps: `yarn install:docs`
- Run backend + frontend: `yarn dev`
- Run docs: `yarn docs:dev`
- Build app: `yarn build`
- Build docs: `yarn docs:build`
- Typecheck backend: `yarn typecheck:server`
- Typecheck frontend: `yarn typecheck:web`
- Lint backend: `yarn lint:server`
- Lint frontend: `yarn lint:web`
- Run backend tests: `yarn --cwd server test`
- Verify backend: `yarn verify:server`
- Verify frontend: `yarn verify:web`
- Check docs: `yarn docs:check`
- Regenerate API docs: `yarn docs:generate:api`

## Stack Snapshot
- Monorepo: `server` (Node.js + Express + TypeScript), `web` (Vite + React + TypeScript + Effector + Mantine), `docs` (Docusaurus), `shared` (shared contracts and utils), `data` (runtime data).
- Package manager: Yarn Classic 1.x only. NEVER switch a task to npm or pnpm.
- Runtime note: docs require Node `>=20`.

## Repo Topology
- `server/src/index.ts`: backend entrypoint.
- `server/src/api/_routes_.ts`: API route registry.
- `server/src/application/**`: use-cases and application orchestration.
- `server/src/services/**`: domain services and repositories.
- `server/src/core/**`: shared backend infrastructure, middleware, gateway, factories, errors, logging.
- `server/src/db/schema/**`: database schema.
- `web/src/main.tsx` and `web/src/App.tsx`: frontend bootstrap.
- `web/src/model/**`: Effector business state. This is the default home for frontend domain logic.
- `web/src/features/**`: UI features.
- `web/src/api/**`: frontend API clients.
- `web/src/ui/**`: shared UI and form primitives.
- `web/src/i18n/**`: localization setup and RU/EN resources.
- `shared/**`: source of truth for cross-layer contracts. If backend and frontend share a shape, it belongs here.
- `docs/docs/**`: RU docs.
- `docs/i18n/en/docusaurus-plugin-content-docs/current/**`: EN docs.
- `server/src/legacy/**` and `web/src/legacy/**`: reference only. Do not edit unless the task is explicitly about legacy migration.

## Global Non-Negotiables
- MUST inspect neighboring code, tests, and docs before changing anything.
- MUST keep changes tightly scoped to the request. No opportunistic refactors.
- MUST prefer `rg` and `rg --files` for search when available.
- MUST preserve existing architecture instead of inventing a parallel one.
- MUST extract the touched slice before adding more logic to an oversized file.
- NEVER edit `legacy/**` unless the task explicitly requires it.
- NEVER expose secrets, token values, encryption keys, cookies, raw auth headers, or env-backed credentials in code, logs, screenshots, tests, or reports.
- NEVER add comments in Russian inside code. Code comments must stay in English.
- NEVER keep dead branches, commented-out code, placeholder TODO logic, or "temporary" debug flows in final changes.
- NEVER solve a structural problem by adding more nesting, more flags, or more copy-pasted branches if extraction is the correct fix.

## Code Size And Readability
- Production files SHOULD stay at or below `300` lines and MUST NOT exceed `400` lines.
- Functions SHOULD stay at or below `30` logical lines and MUST NOT exceed `50` lines.
- React components SHOULD stay at or below `150` lines and MUST NOT exceed `200` lines.
- A function should do one job. If it coordinates multiple concerns, split it.
- Names MUST describe domain meaning, not implementation trivia.
- Prefer explicit types, small helpers, and flat control flow over deeply nested conditions.
- Exemptions are limited to generated files, translation dictionaries, migrations, fixtures, and exhaustive tests.
- If a touched file already exceeds the limit, do not keep stacking logic into it. Extract the modified concern into smaller modules in the same task.

## Backend Rules (`server/**`)

### Architecture
- Routes MUST stay thin.
- Route files are for HTTP wiring only: parse request, validate input, call the application/service layer, map the response.
- Business rules MUST live in use-cases or services, not inside Express handlers.
- Persistence MUST live in repository-style modules, not inside routes or random helpers.
- LLM provider access MUST go through the existing gateway/adapter layers in `core/llm-gateway` or the established service abstractions. Do not call providers ad hoc from unrelated modules.
- Shared request/response contracts that matter to both layers MUST live in `shared/**`.

### Validation And Types
- Validate inputs at the edge with the existing validation patterns (`zod`, `validate`, route schemas).
- Keep request/response flow typed end to end.
- Avoid `any`. Use it only when the boundary is truly dynamic and no narrower type is reasonable. If `any` is unavoidable, keep it local and justify it in code.
- Prefer explicit DTOs and domain types over loose object literals passed through many layers.

### Errors, Logging, And Security
- Use structured error handling. Do not swallow errors.
- Never use an empty `catch`. If a catch intentionally suppresses an error, document why and keep the fallback explicit.
- Never log raw request bodies if they may contain tokens, secrets, or untrusted large payloads.
- Redact sensitive values in logs and error contexts.
- Keep file access constrained to intended safe paths.
- Treat user markdown, HTML, imported cards, templates, and external provider payloads as untrusted input.

### Backend Testing
- Backend work MUST follow TDD: write the failing test first, make it pass, then refactor.
- Every backend feature or bug fix MUST add or update tests at the correct level.
- Pure logic gets unit tests.
- Service orchestration, repositories, and route contracts get integration or API tests.
- User-visible backend flows and regression-prone orchestration paths get smoke or e2e coverage when behavior changes.

## Frontend Rules (`web/**`)

### State And Architecture
- Effector is the default state layer for app state, business state, async flows, and cross-component coordination.
- Business logic MUST live in `web/src/model/**`, domain utilities, or clearly scoped feature-model modules.
- React components MUST stay focused on presentation and local interaction wiring.
- `useState` is allowed only for leaf-local ephemeral UI state such as a disclosure toggle, a local tab, or a transient modal flag.
- NEVER lift chains of `useState` up the tree for business state or form state.
- NEVER put large app state into React component trees when Effector should own it.
- If state is shared across features, persisted, async-driven, or affects multiple subtrees, it belongs in Effector.

### Effector Rules
- Use `useUnit` for subscribing to stores and binding events/effects in React.
- Prefer small, atomic stores over monolithic "god stores".
- Use declarative flows with `sample`, events, stores, and effects.
- Keep `.watch` for debug or narrow side-effect bridges only. NEVER build core business logic around `.watch`.
- NEVER place business rules directly inside React event handlers when they can be expressed as Effector events/effects.
- NEVER subscribe a large top-level component to broad state if that causes avoidable rerenders of most of the app.
- When a model file grows beyond the size limits, split by concern: state, effects, derived state, orchestration, adapters.

### Forms And Render Performance
- Forms MUST use `react-hook-form`.
- Reuse shared form primitives from `web/src/ui/form-components/**` when they fit the task.
- NEVER build production forms from chained `useState`, manual value syncing, or parent-driven controlled trees unless there is a proven exceptional reason.
- Form subscriptions MUST be as narrow as possible. Prefer field-scoped subscriptions and render-conscious composition.
- Form validation, serialization, and submission mapping should be isolated from presentational layout.
- Large forms MUST be split into sections and extracted components before they become monoliths.

### UI, UX, And Accessibility
- Every user-facing UI change MUST be responsive for phone, tablet, and desktop.
- Design MUST feel production-ready: consistent spacing, readable hierarchy, obvious states, and clear interaction affordances.
- Do not ship desktop-only layouts, clipped drawers, overflowing modals, or controls that become unusable on smaller screens.
- Inputs, buttons, icon buttons, menus, tabs, and dialogs MUST have accessible labels and predictable keyboard behavior.
- Empty, loading, error, and disabled states are required when the feature can reach them.
- Avoid unnecessary rerenders in heavy panels, message lists, editors, and forms.

### Localization
- All user-facing text MUST be localized in both Russian and English.
- Keep RU and EN resource trees in sync.
- Do not hardcode UI text in components, stores, helpers, or API mappers, except in tests, internal debug-only output, or truly non-user-facing diagnostics.
- When adding a new feature, update both locales in the same task.

### Frontend Testing
- Frontend work MUST follow TDD the same way backend work does.
- Missing frontend test infrastructure is not a waiver.
- If a frontend task adds business logic, render-critical behavior, or regression-prone UI flows, the task MUST include adding or using appropriate frontend test coverage.
- Pure utilities and transforms get unit tests.
- Complex state transitions, model orchestration, and critical UI behavior get integration-style coverage.

## Shared Contracts (`shared/**`)
- Shared types are the contract between backend and frontend. Treat changes here as public interface changes inside the repo.
- Do not duplicate shared shapes in `server` and `web`.
- Any contract change MUST be validated in both app layers and reflected in docs when externally visible.

## Docs Rules (`docs/**`)
- Docs are currently outside the default verification scope.
- Touch docs only when the task explicitly requires docs work.
- If docs are touched, RU and EN docs must stay structurally aligned.
- If docs are touched and API surface or shared contract behavior changes, regenerate API docs before docs checks.
- Do not leave docs knowingly stale when docs are part of the task.

## TDD And Mandatory Verification
- TDD is mandatory: red -> green -> refactor.
- "I will add tests later" is not acceptable.
- After each completed feature, all required tests and checks must be green.
- Mandatory post-feature full-suite commands:
  - `yarn typecheck:server`
  - `yarn lint:server`
  - `yarn --cwd server test`
  - `yarn build:server`
  - `yarn typecheck:web`
  - `yarn lint:web`
  - `yarn build:web`
- If docs are touched and API routes or shared contract surface changed, run `yarn docs:generate:api` before `yarn docs:check`.

## Worktree Startup Rule
- If the current repo folder name starts with `TaleSpinner_` and is not exactly `TaleSpinner_v1`, treat it as a git worktree.
- At the start of each new task in such a worktree:
  - run `git fetch origin dev`
  - if the current branch is `dev`, `main`, or detached `HEAD`, create and switch to a task branch from `origin/dev` before edits
  - run `sync-db-from-main.bat --no-extra --no-pause`

## Definition Of Done
- Requested behavior is implemented in the correct layer and consistent with neighboring architecture.
- Tests are written first and end green.
- Required full-suite checks are green.
- RU/EN localization parity is preserved for user-facing text.
- RU/EN docs parity is preserved when docs are touched.
- Final report must include changed files, why the change was made, commands executed, and test/check results.

## Instruction Hygiene
- Keep this file concise, directive, and enforceable.
- Prefer hard rules over taste-based advice.
- Add new rules only when they materially improve agent behavior on this repo.
