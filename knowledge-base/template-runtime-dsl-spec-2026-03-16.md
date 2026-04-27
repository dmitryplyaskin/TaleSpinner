# Spec: Native Template Runtime DSL

_Date: 2026-03-16_

## 1. Goal

This document defines the target design for a new native template/runtime DSL in TaleSpinner.

The goal is to replace LiquidJS as the primary template engine with a controlled runtime that:

- separates text templating from deterministic data evaluation;
- supports a minimal Handlebars-like template model;
- preserves required TaleSpinner custom behavior;
- preserves required SillyTavern compatibility syntax through aliases;
- supports variables, scoped state, and reusable user-defined macros;
- remains deterministic, inspectable, and safe to execute.

This is a product/runtime spec, not an implementation task list.

## 2. Motivation

Current LiquidJS usage solves text interpolation but is a poor fit for structured deterministic evaluation.

Example of the current pain:

```txt
{
  "uwu": bool,
  "ara": bool
}

uwu = true if the text below contains uwu in any form
ara = true if the text below contains ara in any form

text: {{lastUserMessage}}
```

This currently pushes a deterministic parsing task into an LLM or into text-assembly tricks.

Target behavior:

- deterministic checks like `contains(lastUserMessage, "uwu", "i")` must be evaluated directly by the runtime;
- structured values like objects and arrays must be produced as typed runtime values first and serialized second;
- text templates must remain useful for prompt assembly and UI-oriented rendering.

## 3. Core Decision

The new system MUST have two language surfaces over one shared runtime:

1. `template` language
   - used for prompt text, world info text, greeting templates, and similar string output;
   - returns `string`.

2. `expr` language
   - used for deterministic computation, guard outputs, structured objects, booleans, arrays, and JSON-ready values;
   - returns typed runtime values.

Both languages MUST use:

- the same base context;
- the same helper registry;
- the same variable/state model;
- the same macro registry;
- the same runtime limits and safety rules.

## 4. Non-Goals

The first version MUST NOT try to do the following:

- full LiquidJS syntax compatibility;
- full Handlebars syntax compatibility;
- arbitrary JavaScript execution;
- user-defined parser rules;
- unrestricted recursive macro expansion;
- unrestricted persistent mutable state;
- implicit side effects from ordinary expressions.

## 5. Runtime Model

### 5.1 Context

Base runtime context MUST be built from the existing `InstructionRenderContext`.

At minimum it includes:

- `char`
- `user`
- `chat`
- `messages`
- `rag`
- `worldInfo`
- `art`
- `artByOpId`
- `now`
- `anchorBefore`
- `anchorAfter`
- `description`
- `scenario`
- `personality`
- `system`
- `promptSystem`
- `persona`
- `wiBefore`
- `wiAfter`
- `loreBefore`
- `loreAfter`
- `outlet`
- `outletEntries`
- `anTop`
- `anBottom`
- `emTop`
- `emBottom`
- `mesExamples`
- `mesExamplesRaw`
- `lastUserMessage`
- `lastAssistantMessage`

These names SHOULD remain stable across template and expr runtimes.

### 5.2 State

Runtime state MUST be separated from base context.

Context is input data. State is mutable execution state.

Target model:

```ts
type RuntimeState = {
  scopes: {
    local: Record<string, unknown>;
    render: Record<string, unknown>;
    turn: Record<string, unknown>;
    session?: Record<string, unknown>;
  };
  trim?: {
    pending: boolean;
  };
  rng: () => number;
};
```

### 5.3 Scopes

The runtime MUST support the following scopes:

- `local`
  - visible only inside the current block or current macro expansion.
- `render`
  - visible during the full current render/evaluation call.
- `turn`
  - visible during the current generation cycle.
- `session`
  - optional for v1 runtime contract, but reserved for future chat- or branch-level state.

Rules:

- reads MUST search from nearest scope to widest scope;
- writes MUST require an explicit target scope if they are not `local`;
- v1 default write scope SHOULD be `render`;
- writes to `session` MUST be explicitly enabled by the caller and MUST NOT be implicit.

## 6. Language Surfaces

## 6.1 `expr` Language

The `expr` language is the canonical language for deterministic evaluation.

It MUST support:

- literals
  - `null`, `true`, `false`, numbers, strings
- path lookup
  - `char.name`
  - `art.note.value`
- arrays
  - `["a", "b"]`
- objects
  - `{ uwu: true, ara: false }`
- function calls
  - `contains(lastUserMessage, "uwu", "i")`
- unary operators
  - `not x`
- binary operators
  - `and`
  - `or`
  - `==`
  - `!=`

Example:

```txt
{
  uwu: contains(lastUserMessage, "uwu", "i"),
  ara: contains(lastUserMessage, "ara", "i")
}
```

This MUST evaluate to a typed object, not to text.

## 6.2 `template` Language

The `template` language is a text-producing language with Handlebars-like block semantics.

The v1 native syntax MUST support:

- output nodes
  - `{{ char.name }}`
  - `{{ contains(lastUserMessage, "uwu", "i") }}`
- conditional blocks
  - `{{#if contains(lastUserMessage, "uwu", "i")}}...{{else}}...{{/if}}`
- iteration blocks
  - `{{#each messages as msg}}...{{/each}}`
- statement calls
  - `{{ set("mood", "angry") }}`
- macro calls
  - `{{ use("sceneHeader", { char: char, user: user }) }}`

The `template` language MUST render a string.

## 6.3 Relationship Between `template` and `expr`

`template` expressions MUST embed the same expression model as `expr`.

This means:

- one helper registry;
- one lookup model;
- one truthiness model;
- one set of core value types.

The runtime MUST NOT maintain different meanings for the same expression between `template` and `expr`.

## 7. AST Model

The runtime SHOULD normalize both languages into a small shared internal AST.

Illustrative model:

```ts
type ExprNode =
  | { kind: "literal"; value: null | boolean | number | string }
  | { kind: "path"; segments: string[] }
  | { kind: "call"; name: string; args: ExprNode[] }
  | { kind: "array"; items: ExprNode[] }
  | { kind: "object"; entries: Array<{ key: string; value: ExprNode }> }
  | { kind: "unary"; op: "not"; value: ExprNode }
  | {
      kind: "binary";
      op: "and" | "or" | "eq" | "neq";
      left: ExprNode;
      right: ExprNode;
    };

type TemplateNode =
  | { kind: "text"; value: string }
  | { kind: "output"; expr: ExprNode }
  | { kind: "if"; condition: ExprNode; then: TemplateNode[]; else: TemplateNode[] }
  | { kind: "each"; source: ExprNode; itemName: string; body: TemplateNode[] }
  | { kind: "statement"; statement: StatementNode };

type StatementNode =
  | { kind: "trim" }
  | { kind: "set"; scope: "local" | "render" | "turn" | "session"; name: string; value: ExprNode }
  | { kind: "useMacro"; name: string; args: Record<string, ExprNode> };
```

Exact AST shapes may change, but the architecture SHOULD preserve this separation:

- expressions are values;
- statements are side effects;
- blocks control rendering;
- aliases lower into canonical nodes.

## 8. Built-in Helpers

The runtime MUST expose built-in helpers through a registry.

Initial built-ins SHOULD include:

- `contains(text, needle, flags?) -> boolean`
- `match(text, pattern, flags?) -> boolean`
- `lower(text) -> string`
- `upper(text) -> string`
- `trimText(text) -> string`
- `size(value) -> number`
- `empty(value) -> boolean`
- `coalesce(a, b, ...) -> unknown`
- `json(value) -> string`
- `outlet(key) -> string`
- `pickRandom(...values) -> unknown`
- `recentMessages(count) -> Array<Message>`
- `recentMessagesText(count) -> string`
- `recentMessagesByContextTokens(limit) -> Array<Message>`
- `recentMessagesByContextTokensText(limit) -> string`

Rules:

- helpers MUST be deterministic unless explicitly documented otherwise;
- `pickRandom` MUST use runtime RNG, not ambient `Math.random`;
- helper failures MUST surface as typed runtime errors;
- helpers MUST NOT mutate state directly.

## 9. Built-in Statements

Statements are side-effectful runtime actions and MUST be modeled separately from helpers.

Initial built-ins SHOULD include:

- `trim`
  - whitespace/layout control node
- `set`
  - set a variable in a target scope
- `unset`
  - remove a variable from a target scope
- `capture`
  - optional future node that renders nested template content into a variable

Rules:

- statements MUST be explicit;
- statements MUST NOT masquerade as pure expressions;
- statement effects MUST be visible in debug output.

## 10. SillyTavern Compatibility Layer

ST compatibility is required.

The runtime MUST support ST aliases as a compatibility input layer without making them the canonical internal syntax.

### 10.1 Design Rule

ST syntax MUST parse into compatibility nodes or be lowered directly into canonical AST.

Internal execution MUST operate on canonical runtime operations, not on raw ST syntax.

### 10.2 Required Alias Categories

The runtime MUST support three categories of ST aliases:

1. value aliases
2. state aliases
3. formatting aliases

### 10.3 Initial Required Aliases

The following aliases are required in the first compatibility layer:

- `{{outlet::default}}`
- `{{random::A::B}}`
- `{{trim}}`
- `{{setvar::name::value}}`

Canonical lowering examples:

- `{{outlet::default}}`
  - lower to `outlet("default")`
- `{{random::A::B}}`
  - lower to `pickRandom("A", "B")`
- `{{trim}}`
  - lower to `trim` statement node
- `{{setvar::mood::angry}}`
  - lower to `set(scope="render", name="mood", value="angry")`

### 10.4 Future Alias Support

Additional ST aliases MAY be added later through a whitelist-based compatibility registry.

Unknown ST alias syntax MUST fail with a clear validation error.

The runtime MUST NOT silently accept unknown alias forms.

## 11. Macro System

## 11.1 Goal

Users MUST be able to define reusable macros in a dedicated UI and reuse them across templates.

Macros are a first-class runtime feature, not a text-replace hack.

## 11.2 Macro Kinds

The system SHOULD support these macro kinds:

- `value`
  - returns a typed value from expressions
- `template`
  - returns rendered template output

The first release SHOULD NOT expose user-defined stateful statement macros.

Built-in statement macros MAY exist internally, but user-defined macros SHOULD stay constrained.

## 11.3 Macro Storage

Macros SHOULD be stored as separate entities, not inline inside arbitrary templates.

Illustrative shape:

```ts
type MacroDefinition = {
  id: string;
  ownerId: string;
  name: string;
  kind: "value" | "template";
  description?: string;
  engine: "native_v1";
  params: Array<{
    name: string;
    required: boolean;
    defaultExpr?: string;
  }>;
  body: string;
  createdAt: string;
  updatedAt: string;
};
```

## 11.4 Macro Invocation

Illustrative canonical forms:

```txt
use("sceneHeader", { char: char, user: user })
call("detectTone", { text: lastUserMessage })
```

Template usage example:

```txt
{{ use("sceneHeader", { char: char, user: user }) }}
```

Expression usage example:

```txt
call("detectFlags", { text: lastUserMessage })
```

## 11.5 Macro Semantics

Rules:

- macro invocation MUST create a fresh local scope;
- macro arguments MUST be bound by name;
- macro expansion MUST be debuggable;
- recursive macro calls MUST be limited;
- recursive cycles MUST be detected;
- macros MUST lower into AST or execute through the same runtime, not through raw string substitution.

## 12. Validation and Error Model

The runtime MUST provide explicit validation entry points:

- `validateTemplate(source)`
- `validateExpr(source)`
- `validateMacro(definition)`

The error model SHOULD distinguish:

- parse errors
- unknown helper errors
- unknown alias errors
- unknown macro errors
- invalid path errors in strict mode
- runtime helper failures
- macro cycle errors
- scope access errors
- output limit errors

The system MUST expose user-facing error messages and machine-readable error codes.

## 13. Strictness

The runtime MUST support strict and non-strict variable access.

Suggested behavior:

- strict mode
  - missing path or missing variable is an error
- non-strict mode
  - missing path resolves to `null` or empty string depending on output context

The exact null/empty-string coercion rules MUST be consistent across the system and documented once in runtime docs.

## 14. Whitespace and Layout

Whitespace control MUST be explicit.

`trim` is special because it affects surrounding rendered text, not just a returned value.

Therefore:

- `trim` MUST remain a statement/layout node;
- whitespace control MUST NOT be modeled only as a normal string helper;
- macro expansion and block rendering MUST preserve deterministic trim behavior.

## 15. Determinism and Safety

The runtime MUST be deterministic for the same input.

The runtime MUST NOT allow:

- arbitrary filesystem access;
- arbitrary network access;
- ambient mutable globals;
- arbitrary JS execution;
- unbounded recursion;
- unbounded AST growth;
- unbounded output growth.

Required limits:

- max macro expansion depth
- max AST node count after lowering
- max execution steps
- max output chars
- max object/array nesting

## 16. Debuggability

The runtime SHOULD expose debug artifacts for development and diagnostics:

- parsed AST
- lowered AST after alias normalization
- expanded macro tree
- runtime variable scopes
- helper calls
- stop reason on limits or failures

This is important because the system is more than a template engine. It is a small controlled interpreter.

## 17. Integration Targets

The new runtime is intended to replace LiquidJS as the primary engine in these areas:

- instruction text rendering
- operation template rendering
- LLM prompt and system rendering
- deterministic guard evaluation
- world info text rendering
- greeting template rendering
- manual chat edit rendering

Important architectural note:

- deterministic guards SHOULD prefer `expr` over text templates whenever possible;
- building JSON by hand in text templates SHOULD NOT be the primary path for deterministic outputs.

## 18. Rollout Strategy

Recommended rollout:

1. Implement shared runtime core
   - context
   - state
   - helper registry
   - expr parser and evaluator

2. Implement minimal template runtime
   - text
   - output
   - `if`
   - `each`
   - `trim`
   - `set`

3. Add ST compatibility aliases
   - whitelist only

4. Add macro registry
   - storage
   - validation
   - invocation
   - recursion guards

5. Migrate product surfaces to native runtime
   - start from deterministic guard/compute cases
   - then prompt/instruction rendering

## 19. Agreed Principles

The implementation MUST follow these principles:

- native syntax is canonical;
- ST syntax is compatibility-only;
- no LiquidJS compatibility target;
- text templating and deterministic evaluation are separate concerns;
- aliases normalize into canonical operations;
- user macros are data, not parser extensions;
- expressions are pure;
- statements are explicit;
- state scopes are controlled and bounded;
- debugability is a hard requirement, not optional polish.

## 20. Open Decisions Requiring Agreement

These items still need explicit agreement before implementation:

1. Should `session` scope be in v1 runtime or reserved for v2 only?
2. Should `setvar::` default to `render` scope or `turn` scope?
3. Should user-defined macros be limited to `value` and `template` in v1, with no user-defined statement macros?
4. Should template invocation use only canonical `use("name", {...})` syntax in v1, with no extra shorthand?
5. What exact ST alias whitelist is required in the first compatibility pass beyond:
   - `trim`
   - `outlet::`
   - `random::`
   - `setvar::`

## 21. Recommended Default Answers

Unless product requirements change, this spec recommends:

1. `session` scope is reserved but not enabled by default in v1.
2. `setvar::` defaults to `render` scope in v1.
3. User-defined macros are limited to `value` and `template` in v1.
4. Canonical macro invocation in v1 is only `use("name", {...})` and `call("name", {...})`.
5. ST alias support in v1 is whitelist-based and intentionally narrow.

