# ST-like Chat Completion Presets — implementation notes

## Decisions
- Canonical ST preset storage uses existing `instructions` records with `tsInstruction.mode = st_advanced`.
- Active preset remains per-chat through `instructionId`.
- Existing provider-side `llm-presets` stay separate and are relabeled as connection presets.
- Global bind toggle is persisted in app settings as `bindChatCompletionPresetToConnection`.

## Best-effort bind mapping
- `chat_completion_source = openrouter` -> `activeProviderId = openrouter`
- any other explicit `chat_completion_source` -> `activeProviderId = openai_compatible`
- `openai_model` -> `activeModel`
- sensitive/raw-only connection fields are preserved for round-trip export but are not auto-applied

## Round-trip rules
- `rawPreset` remains the source for unknown ST keys
- edited prompt blocks, prompt order, and response config overwrite only supported fields during export
- unsupported connection fields stay raw-only and surface warnings instead of failing import/apply

## Intentional gaps
- No new dedicated backend entity/API for ST presets
- No automatic migration from provider-side `llm-presets`
- No direct auto-apply for sensitive fields like `custom_url`, `reverse_proxy`, or token secrets
