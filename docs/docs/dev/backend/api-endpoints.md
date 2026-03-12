---
title: API Endpoints
sidebar_position: 2
description: Автогенерируемый инвентарь backend endpoint-ов из server/src/api.
---

# API Endpoints

Этот файл генерируется скриптом `docs/scripts/generate-api-reference.mjs`.

Источники:

- `server/src/api/_routes_.ts`
- `server/src/api/**/*.ts`

## Endpoint inventory

| Method | Path | Source file | Handler section |
| --- | --- | --- | --- |
| USE | /api/app-settings | `server/src/api/app-settings.api.ts` | L7 |
| DELETE | /api/chats/:id | `server/src/api/chats.core.api.ts` | L91 |
| GET | /api/chats/:id | `server/src/api/chats.core.api.ts` | L29 |
| PUT | /api/chats/:id | `server/src/api/chats.core.api.ts` | L76 |
| GET | /api/chats/:id/branches | `server/src/api/chats.core.api.ts` | L103 |
| POST | /api/chats/:id/branches | `server/src/api/chats.core.api.ts` | L115 |
| DELETE | /api/chats/:id/branches/:branchId | `server/src/api/chats.core.api.ts` | L178 |
| PUT | /api/chats/:id/branches/:branchId | `server/src/api/chats.core.api.ts` | L159 |
| POST | /api/chats/:id/branches/:branchId/activate | `server/src/api/chats.core.api.ts` | L135 |
| GET | /api/chats/:id/entries | `server/src/api/chat-entries.api.ts` | L206 |
| POST | /api/chats/:id/entries | `server/src/api/chat-entries.api.ts` | L230 |
| POST | /api/chats/:id/entries/continue | `server/src/api/chat-entries.api.ts` | L258 |
| PUT | /api/chats/:id/instruction | `server/src/api/chats.core.api.ts` | L44 |
| GET | /api/chats/:id/operation-runtime-state | `server/src/api/chat-entries.api.ts` | L335 |
| GET | /api/chats/:id/world-info/latest-activations | `server/src/api/chat-entries.api.ts` | L350 |
| ALL | /api/config/openrouter | `server/src/api/llm.api.ts` | L260 |
| GET | /api/entity-profiles | `server/src/api/entity-profiles.core.api.ts` | L142 |
| POST | /api/entity-profiles | `server/src/api/entity-profiles.core.api.ts` | L150 |
| DELETE | /api/entity-profiles/:id | `server/src/api/entity-profiles.core.api.ts` | L258 |
| GET | /api/entity-profiles/:id | `server/src/api/entity-profiles.core.api.ts` | L167 |
| PUT | /api/entity-profiles/:id | `server/src/api/entity-profiles.core.api.ts` | L180 |
| GET | /api/entity-profiles/:id/chats | `server/src/api/entity-profiles.core.api.ts` | L278 |
| POST | /api/entity-profiles/:id/chats | `server/src/api/entity-profiles.core.api.ts` | L291 |
| GET | /api/entity-profiles/:id/export | `server/src/api/entity-profiles.core.api.ts` | L223 |
| POST | /api/entity-profiles/import | `server/src/api/entity-profiles.import.api.ts` | L62 |
| POST | /api/entries/:id/manual-edit | `server/src/api/chat-entries.api.ts` | L421 |
| POST | /api/entries/:id/parts/batch-update | `server/src/api/chat-entries.api.ts` | L436 |
| GET | /api/entries/:id/prompt-diagnostics | `server/src/api/chat-entries.api.ts` | L313 |
| POST | /api/entries/:id/prompt-visibility | `server/src/api/chat-entries.api.ts` | L507 |
| POST | /api/entries/:id/regenerate | `server/src/api/chat-entries.api.ts` | L287 |
| POST | /api/entries/:id/soft-delete | `server/src/api/chat-entries.api.ts` | L493 |
| GET | /api/entries/:id/variants | `server/src/api/chat-entries.api.ts` | L365 |
| POST | /api/entries/:id/variants/:variantId/select | `server/src/api/chat-entries.api.ts` | L383 |
| POST | /api/entries/:id/variants/:variantId/soft-delete | `server/src/api/chat-entries.api.ts` | L453 |
| POST | /api/entries/soft-delete-bulk | `server/src/api/chat-entries.api.ts` | L480 |
| GET | /api/files/metadata/:filename | `server/src/api/files/routes.ts` | L71 |
| POST | /api/files/upload | `server/src/api/files/routes.ts` | L53 |
| POST | /api/files/upload-card | `server/src/api/files/routes.ts` | L59 |
| POST | /api/files/upload-image | `server/src/api/files/routes.ts` | L65 |
| POST | /api/generations/:id/abort | `server/src/api/generations.core.api.ts` | L16 |
| GET | /api/instructions | `server/src/api/instructions.core.api.ts` | L44 |
| POST | /api/instructions | `server/src/api/instructions.core.api.ts` | L105 |
| DELETE | /api/instructions/:id | `server/src/api/instructions.core.api.ts` | L188 |
| PUT | /api/instructions/:id | `server/src/api/instructions.core.api.ts` | L146 |
| GET | /api/instructions/default-st-preset | `server/src/api/instructions.core.api.ts` | L56 |
| POST | /api/instructions/prerender | `server/src/api/instructions.core.api.ts` | L64 |
| GET | /api/llm-preset-settings | `server/src/api/llm-presets.api.ts` | L185 |
| PUT | /api/llm-preset-settings | `server/src/api/llm-presets.api.ts` | L201 |
| GET | /api/llm-presets | `server/src/api/llm-presets.api.ts` | L77 |
| POST | /api/llm-presets | `server/src/api/llm-presets.api.ts` | L93 |
| DELETE | /api/llm-presets/:id | `server/src/api/llm-presets.api.ts` | L132 |
| PUT | /api/llm-presets/:id | `server/src/api/llm-presets.api.ts` | L108 |
| POST | /api/llm-presets/:id/apply | `server/src/api/llm-presets.api.ts` | L150 |
| GET | /api/llm/models | `server/src/api/llm.api.ts` | L219 |
| GET | /api/llm/providers | `server/src/api/llm.api.ts` | L56 |
| POST | /api/llm/providers/:providerId/check | `server/src/api/llm.api.ts` | L135 |
| GET | /api/llm/providers/:providerId/config | `server/src/api/llm.api.ts` | L106 |
| PATCH | /api/llm/providers/:providerId/config | `server/src/api/llm.api.ts` | L116 |
| GET | /api/llm/runtime | `server/src/api/llm.api.ts` | L71 |
| PATCH | /api/llm/runtime | `server/src/api/llm.api.ts` | L89 |
| GET | /api/llm/tokens | `server/src/api/llm.api.ts` | L157 |
| POST | /api/llm/tokens | `server/src/api/llm.api.ts` | L175 |
| DELETE | /api/llm/tokens/:id | `server/src/api/llm.api.ts` | L210 |
| PATCH | /api/llm/tokens/:id | `server/src/api/llm.api.ts` | L196 |
| GET | /api/operation-blocks | `server/src/api/operation-blocks.core.api.ts` | L37 |
| POST | /api/operation-blocks | `server/src/api/operation-blocks.core.api.ts` | L45 |
| DELETE | /api/operation-blocks/:id | `server/src/api/operation-blocks.core.api.ts` | L83 |
| GET | /api/operation-blocks/:id | `server/src/api/operation-blocks.core.api.ts` | L57 |
| PUT | /api/operation-blocks/:id | `server/src/api/operation-blocks.core.api.ts` | L68 |
| GET | /api/operation-blocks/:id/export | `server/src/api/operation-blocks.core.api.ts` | L97 |
| POST | /api/operation-blocks/import | `server/src/api/operation-blocks.core.api.ts` | L122 |
| GET | /api/operation-profiles | `server/src/api/operation-profiles.core.api.ts` | L56 |
| POST | /api/operation-profiles | `server/src/api/operation-profiles.core.api.ts` | L64 |
| DELETE | /api/operation-profiles/:id | `server/src/api/operation-profiles.core.api.ts` | L127 |
| GET | /api/operation-profiles/:id | `server/src/api/operation-profiles.core.api.ts` | L101 |
| PUT | /api/operation-profiles/:id | `server/src/api/operation-profiles.core.api.ts` | L112 |
| GET | /api/operation-profiles/:id/export | `server/src/api/operation-profiles.core.api.ts` | L141 |
| GET | /api/operation-profiles/active | `server/src/api/operation-profiles.core.api.ts` | L78 |
| PUT | /api/operation-profiles/active | `server/src/api/operation-profiles.core.api.ts` | L90 |
| POST | /api/operation-profiles/import | `server/src/api/operation-profiles.core.api.ts` | L155 |
| POST | /api/parts/:id/canonicalization-undo | `server/src/api/chat-entries.api.ts` | L530 |
| POST | /api/parts/:id/soft-delete | `server/src/api/chat-entries.api.ts` | L545 |
| GET | /api/rag/chroma/collections | `server/src/api/rag-chroma.api.ts` | L77 |
| POST | /api/rag/chroma/collections | `server/src/api/rag-chroma.api.ts` | L84 |
| DELETE | /api/rag/chroma/collections/:name | `server/src/api/rag-chroma.api.ts` | L96 |
| GET | /api/rag/chroma/collections/:name/peek | `server/src/api/rag-chroma.api.ts` | L104 |
| POST | /api/rag/chroma/documents/delete | `server/src/api/rag-chroma.api.ts` | L133 |
| POST | /api/rag/chroma/documents/upsert | `server/src/api/rag-chroma.api.ts` | L121 |
| GET | /api/rag/chroma/health | `server/src/api/rag-chroma.api.ts` | L70 |
| POST | /api/rag/chroma/query | `server/src/api/rag-chroma.api.ts` | L145 |
| POST | /api/rag/chroma/world-info/reindex | `server/src/api/rag-chroma.api.ts` | L161 |
| POST | /api/rag/embeddings | `server/src/api/rag.api.ts` | L168 |
| GET | /api/rag/models | `server/src/api/rag.api.ts` | L74 |
| GET | /api/rag/presets | `server/src/api/rag.api.ts` | L93 |
| POST | /api/rag/presets | `server/src/api/rag.api.ts` | L98 |
| DELETE | /api/rag/presets/:id | `server/src/api/rag.api.ts` | L116 |
| PUT | /api/rag/presets/:id | `server/src/api/rag.api.ts` | L102 |
| POST | /api/rag/presets/:id/apply | `server/src/api/rag.api.ts` | L145 |
| GET | /api/rag/providers | `server/src/api/rag.api.ts` | L46 |
| GET | /api/rag/providers/:providerId/config | `server/src/api/rag.api.ts` | L58 |
| PATCH | /api/rag/providers/:providerId/config | `server/src/api/rag.api.ts` | L63 |
| GET | /api/rag/runtime | `server/src/api/rag.api.ts` | L50 |
| PATCH | /api/rag/runtime | `server/src/api/rag.api.ts` | L54 |
| GET | /api/rag/tokens | `server/src/api/rag.api.ts` | L68 |
| USE | /api/settings | `server/src/api/settings.api.ts` | L7 |
| GET | /api/settings/rag-presets | `server/src/api/rag.api.ts` | L124 |
| POST | /api/settings/rag-presets | `server/src/api/rag.api.ts` | L129 |
| GET | /api/settings/user-persons | `server/src/api/user-persons.core.api.ts` | L105 |
| POST | /api/settings/user-persons | `server/src/api/user-persons.core.api.ts` | L117 |
| GET | /api/ui-theme-presets | `server/src/api/ui-theme.core.api.ts` | L39 |
| POST | /api/ui-theme-presets | `server/src/api/ui-theme.core.api.ts` | L49 |
| DELETE | /api/ui-theme-presets/:id | `server/src/api/ui-theme.core.api.ts` | L88 |
| PUT | /api/ui-theme-presets/:id | `server/src/api/ui-theme.core.api.ts` | L64 |
| GET | /api/ui-theme-presets/:id/export | `server/src/api/ui-theme.core.api.ts` | L99 |
| POST | /api/ui-theme-presets/import | `server/src/api/ui-theme.core.api.ts` | L117 |
| GET | /api/ui-theme-settings | `server/src/api/ui-theme.core.api.ts` | L131 |
| PUT | /api/ui-theme-settings | `server/src/api/ui-theme.core.api.ts` | L141 |
| GET | /api/user-persons | `server/src/api/user-persons.core.api.ts` | L27 |
| POST | /api/user-persons | `server/src/api/user-persons.core.api.ts` | L50 |
| DELETE | /api/user-persons/:id | `server/src/api/user-persons.core.api.ts` | L93 |
| GET | /api/user-persons/:id | `server/src/api/user-persons.core.api.ts` | L39 |
| PUT | /api/user-persons/:id | `server/src/api/user-persons.core.api.ts` | L72 |
| GET | /api/world-info/bindings | `server/src/api/world-info.core.api.ts` | L346 |
| PUT | /api/world-info/bindings | `server/src/api/world-info.core.api.ts` | L360 |
| GET | /api/world-info/books | `server/src/api/world-info.core.api.ts` | L170 |
| POST | /api/world-info/books | `server/src/api/world-info.core.api.ts` | L180 |
| DELETE | /api/world-info/books/:id | `server/src/api/world-info.core.api.ts` | L229 |
| GET | /api/world-info/books/:id | `server/src/api/world-info.core.api.ts` | L191 |
| PUT | /api/world-info/books/:id | `server/src/api/world-info.core.api.ts` | L202 |
| POST | /api/world-info/books/:id/duplicate | `server/src/api/world-info.core.api.ts` | L240 |
| GET | /api/world-info/books/:id/export | `server/src/api/world-info.core.api.ts` | L306 |
| POST | /api/world-info/books/import | `server/src/api/world-info.core.api.ts` | L257 |
| POST | /api/world-info/resolve | `server/src/api/world-info.core.api.ts` | L377 |
| GET | /api/world-info/settings | `server/src/api/world-info.core.api.ts` | L325 |
| PUT | /api/world-info/settings | `server/src/api/world-info.core.api.ts` | L335 |
| USE | /media | `server/src/api/static.api.ts` | L21 |

## Notes

- Для роутов из `_routes_.ts` путь нормализуется с префиксом `/api`.
- Для router chaining (`router.route(...).get(...).delete(...)`) каждый метод включается отдельно.
