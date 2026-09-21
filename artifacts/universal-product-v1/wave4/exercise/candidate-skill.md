---
name: structured-output-contracts
description: Build or repair machine-consumed model outputs with explicit schemas, source binding, semantic checks, bounded repair, and truthful failure states.
---

# Structured output contracts

Use when software consumes a model's classifications, extracted records, routing
choices or tool arguments. Plain conversational answers and an already supplied
static JSON edit normally do not need this method. A correctly shaped answer is
not necessarily true, current or authorized.

## Establish the consumer boundary

Start with what the consumer needs, not the provider's response shape. Define
the contract version, allowed outcomes, field types, required versus nullable
fields, unknown-field policy, enums, units, size limits and cross-field rules.
Preserve meaningful zero, false, empty and missing values distinctly. Use an
explicit unavailable or abstained outcome when the task permits no answer; do
not manufacture a value merely to satisfy a required field.

Choose a validator and schema dialect supported by the target runtime. Provider
structured-output features may help generation, but verify their actual subset
and keep consumer validation independent. A typed accessor or successful parse
alone does not demonstrate semantic validation. No provider, account, local
folder or external schema service is required by this method.

## Validate at successive boundaries

1. Separate transport completion from content. Timeouts, refusals, cancellations,
   incomplete streams and tool results need distinct handling. Buffer a streamed
   result until the agreed completion boundary; do not act on a parseable prefix.
2. Parse the declared format within byte/depth limits. For JSON contracts where
   duplicate object keys are ambiguous, use a parser capable of rejecting them
   before they disappear into a map. Reject malformed or trailing content; do
   not silently salvage a different request from explanatory prose.
3. Validate structure without surprising coercion or dropping fields. Test null
   versus missing, number versus numeric string, unknown variants, extras and
   schema-version mismatch. Apply an explicit migration only when supported.
4. Check meaning against the supplied context: record IDs must exist, citations
   must resolve, counts and units must agree, mutually exclusive states must not
   coexist. Bind output to the input revision or request when stale answers are
   possible. A model-provided confidence or approval field cannot establish fact
   or grant execution authority.
5. Only then deliver the result to its intended consumer. Keep execution and
   permission checks separate from data validation. Repeated delivery must not
   repeat an external effect; preserve the operation's idempotency boundary.

## Repair without disguising failure

For repairable content errors, send the minimum safe validation feedback and
original task constraints within a fixed attempt/time/cost budget. Do not relax
the schema or invent missing evidence until an answer passes. Preserve the last
failure category and distinguish a fresh generation from a transport retry;
neither should replay a completed action. Refusal, unavailable context and
exhausted repair are legitimate terminal results.

A mock or degraded result must carry an unmistakable state that downstream
consumers actually enforce. Mock content is for declared fixtures or previews,
not a silent substitute for facts, completed work or required persistence.

## Verify and deliver

Exercise a valid control and malformed, missing, extra, wrong-type, stale,
unknown-ID, contradictory, truncated, duplicate-delivery and exhausted-repair
cases. Include valid false/zero/null values according to the contract so
strictness does not reject legitimate inputs. Test the consuming behavior, not
only a schema library returning true.

Deliver the contract, adapter/validator, focused fixtures and observed results.
Retain safe error categories and source bindings without logging sensitive
payloads unnecessarily. Say separately whether structure, source-grounded
meaning and actual downstream effects were verified. Continue into authorized
implementation when requested; a schema document alone is not that delivery.
