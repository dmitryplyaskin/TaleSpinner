# AGENTS.md - TaleSpinner

Repository contract for coding agents working in this repo.
Keep this file outcome-first: preserve the project architecture, make the requested change safely, validate what changed, and stop when the user's goal is handled.

## Project Identity
- TaleSpinner is a local LLM application for storytelling, roleplay, and multi-agent scenario building.
- The product is built around isolated profiles, chats and branches, world info, instructions, operation pipelines, and optional RAG flows.
- The goal is not "one big prompt". The goal is a reproducible, controllable LLM workflow with clean context boundaries.

## Stack And Commands
- Monorepo: `server` (Node.js + Express + TypeScript), `web` (Vite + React + TypeScript + Effector + Mantine), `docs` (Docusaurus), `shared` (shared contracts and utils), `data` (runtime data).
- Package manager: Yarn Classic 1.x only. Never switch a task to npm or pnpm.
- Docs require Node `>=20`.
- Install app deps: `yarn install:all`
- Install docs deps: `yarn install:docs`
- Run app: `yarn dev`
- Run docs: `yarn docs:dev`
- Build app: `yarn build`
- Build docs: `yarn docs:build`
- Backend checks: `yarn typecheck:server`, `yarn lint:server`, `yarn --cwd server test`, `yarn build:server`
- Frontend checks: `yarn typecheck:web`, `yarn lint:web`, `yarn build:web`
- Higher-level checks: `yarn verify:server`, `yarn verify:web`, `yarn docs:check`, `yarn docs:generate:api`

## Repo Map
- `server/src/index.ts`: backend entrypoint.
- `server/src/api/_routes_.ts`: API route registry.
- `server/src/application/**`: use-cases and application orchestration.
- `server/src/services/**`: domain services and repositories.
- `server/src/core/**`: shared backend infrastructure, middleware, gateway, factories, errors, logging.
- `server/src/core/llm-gateway/**`: LLM provider gateway and adapter layer.
- `server/src/db/schema/**`: database schema.
- `web/src/main.tsx` and `web/src/App.tsx`: frontend bootstrap.
- `web/src/model/**`: default home for frontend business state.
- `web/src/features/**`: UI features.
- `web/src/api/**`: frontend API clients.
- `web/src/ui/**`: shared UI and form primitives.
- `web/src/i18n/**`: localization setup and RU/EN resources.
- `shared/**`: source of truth for cross-layer contracts.
- `docs/docs/**`: RU docs.
- `docs/i18n/en/docusaurus-plugin-content-docs/current/**`: EN docs.
- `server/src/legacy/**` and `web/src/legacy/**`: reference only. Do not edit unless the task explicitly requires legacy migration.

## Working Rules
- Before edits, inspect the smallest relevant slice of neighboring implementation, tests, contracts, and docs needed to avoid breaking local patterns.
- Keep changes scoped to the user's request. Avoid opportunistic refactors and unrelated formatting churn.
- Prefer `rg` and `rg --files` for search when available.
- Preserve existing architecture. Add abstractions only when they remove real complexity or match established local patterns.
- If a touched production file is already oversized, extract the concern you are modifying instead of adding more logic to it.
- Use explicit domain names, narrow types, small helpers, and flat control flow.
- Do not leave dead branches, commented-out code, placeholder TODO logic, or temporary debug flows in final changes.
- Code comments must be in English.

## Size Guidelines
- Production files should stay near or below 300 lines and must not exceed 400 lines without a strong local reason.
- Functions should stay near or below 30 logical lines and must not exceed 50 lines.
- React components should stay near or below 150 lines and must not exceed 200 lines.
- Generated files, translation dictionaries, migrations, fixtures, and exhaustive tests are exempt.

## Backend
- Routes are HTTP wiring: parse, validate, call the application/service layer, and map the response.
- Business rules belong in use-cases or services, not Express handlers.
- Persistence belongs in repository-style modules.
- LLM provider access goes through `server/src/core/llm-gateway/**` or established service abstractions.
- Validate inputs at the edge with existing validation patterns such as `zod`, `validate`, and route schemas.
- Keep request/response flow typed end to end. Avoid `any`; if a dynamic boundary requires it, keep it local and justified.
- Use structured error handling. Do not swallow errors.
- Never expose secrets, token values, encryption keys, cookies, raw auth headers, or env-backed credentials in code, logs, screenshots, tests, or reports.
- Never log raw request bodies that may contain secrets, tokens, or untrusted large payloads.
- Treat user markdown, HTML, imported cards, templates, and external provider payloads as untrusted input.

## Frontend
- Effector is the default state layer for app state, business state, async flows, and cross-component coordination.
- Business logic belongs in `web/src/model/**`, domain utilities, or clearly scoped feature-model modules.
- React components should stay focused on presentation and local interaction wiring.
- `useState` is for leaf-local ephemeral UI state such as disclosures, local tabs, and transient modals.
- Use `useUnit` for subscribing to Effector stores and binding events/effects in React.
- Prefer declarative Effector flows with `sample`, events, stores, and effects. Keep `.watch` for debug or narrow side-effect bridges.
- Forms should use `react-hook-form` and shared primitives from `web/src/ui/form-components/**` when they fit.
- Keep form subscriptions narrow. Isolate validation, serialization, and submission mapping from presentation.
- User-facing UI changes must be responsive for phone, tablet, and desktop.
- Inputs, buttons, icon buttons, menus, tabs, and dialogs need accessible labels and predictable keyboard behavior.
- Include empty, loading, error, and disabled states when the feature can reach them.
- Avoid unnecessary rerenders in heavy panels, message lists, editors, and forms.

## Localization
- All user-facing text belongs in localization resources, not hardcoded in components, stores, helpers, or API mappers.
- Update Russian and English resources together.
- Tests, internal debug-only output, and truly non-user-facing diagnostics may use inline text.

## Shared Contracts
- Shared request/response shapes that matter to both backend and frontend belong in `shared/**`.
- Do not duplicate shared shapes in `server` and `web`.
- Treat shared contract changes as public interface changes inside the repo.
- Validate contract changes in both app layers and update docs when the behavior is externally visible.

## Docs
- Touch docs only when the task explicitly requires docs work or the code change would otherwise leave affected docs knowingly stale.
- Keep RU and EN docs structurally aligned.
- If docs are touched and API routes or shared contract surface changed, run `yarn docs:generate:api` before `yarn docs:check`.

## Testing And Verification
- For backend/frontend behavior changes, write or update the most relevant failing test first, make it pass, then refactor.
- Pure logic gets unit tests.
- Service orchestration, repositories, route contracts, complex state transitions, and regression-prone UI flows get integration-style coverage.
- For docs-only, config-only, formatting-only, or mechanical changes where tests add no signal, state why targeted tests were not needed.
- After changes, run the narrowest validation that proves the touched behavior:
  - targeted tests for changed behavior
  - type checks or lint checks for affected packages
  - build checks when packaging, shared contracts, or bundling may be affected
  - a smoke test when full validation is too expensive
- Run the full relevant suite before claiming broad readiness, after cross-layer changes, or when the blast radius is unclear.
- If validation cannot be run, explain why and name the next best check.

## Worktree Startup
- If the current repo folder name starts with `TaleSpinner_` and is not exactly `TaleSpinner_v1`, treat it as a git worktree.
- At the start of a new task in such a worktree:
  - run `git fetch origin dev`
  - if the current branch is `dev`, `main`, or detached `HEAD`, create and switch to a task branch from `origin/dev`
  - run `sync-db-from-main.bat --no-extra --no-pause`

## Definition Of Done
- The requested behavior is implemented in the correct layer and follows neighboring architecture.
- Relevant tests and checks pass, or any skipped validation is explicitly justified.
- Security, file-access, and logging boundaries are preserved.
- RU/EN localization parity is preserved for user-facing text.
- RU/EN docs parity is preserved when docs are touched.
- The final report includes changed files, why the change was made, commands executed, and test/check results.

## Stop Rules
- Ask a narrow clarification only when missing information would materially change the implementation or create meaningful risk.
- Stop searching once the core request can be answered or implemented with enough local evidence.
- Stop editing once the requested behavior and Definition of Done are satisfied.
- If a required change would violate these rules, report the conflict before proceeding.
