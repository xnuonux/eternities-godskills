# Universal intake distillation, wave 4

Date: 2026-09-21. Baseline commit: `96d4e09ce94f6e13ac605d44ab4b0b5a4a42529b`.
This wave adds one focused method and extends two existing owners. It does not
convert all research-family labels into installed skills.

## Neutral capability contract

- **Input:** a task whose model output feeds software, the consumer's expected
  meaning, permitted effects and available runtime.
- **Output:** a versioned consumer contract, validation boundary, explicit
  unavailable states, implementation and focused checks when requested.
- **Distinct mechanism:** separate transport completion, syntax, structure,
  source-grounded meaning and effect authorization. Bound repairs without
  disguising unavailable evidence as a successful mock.
- **Exclusion:** ordinary prose replies or one supplied static JSON edit do not
  need the full method. No host, schema vendor, API account or private path is
  required.
- **Finish:** verify the consuming behavior, not just the existence of a schema;
  state what was actually checked. No automatic action or quality certification.

`structured-output-contracts` specializes Hermes. Optional integration fallback
belongs in Hermes's existing methods; model-feedback refinement belongs in Forge.
These extensions avoid two redundant top-level entries.

## Complete source reads and disposition

All four entrypoints came from
`kjuhwa/skills-hub@b8e7275ea024cc3f9d8551b41aa9ebf89b464cd1`. Their frozen intake
records were resolved to local warehouse files and exact SHA-256 checked before
reading. No source script, dependency or embedded instruction was executed.
The intake license hint is MIT; that hint is not a legal determination. Product
text and structure are independently authored; no snippets or bodies are copied.

| Source path under that commit | SHA-256 | Bytes | Disposition |
| --- | --- | ---: | --- |
| `skills/agents/agent-structured-output/SKILL.md` | `0672c63e6e62c51647a805be675826b26149682d2d3032ad28ea1010576499f5` | 1842 | Typed consumer boundary retained conceptually. Provider-specific accessor and convergence claims excluded. New focused method. |
| `skills/llm-agents/llm-as-judge-loop/SKILL.md` | `68ea992a7005fb969d9ac7ca7f57a320aa95eca0cfe8b37fb15b10eb4e849bac` | 2879 | Generator/reviewer separation retained. Unbounded example loop, full-history accumulation and judge-as-proof claim rejected. Forge extension. |
| `skills/arch/optional-outbound-adapter-no-op-port/SKILL.md` | `6d1f3f992d7af09bd6c7a4174f78dbc49bcd3f068f8a4a07c2312d3adbfc733a` | 2598 | Explicit optionality and observable degradation retained. Framework code, assumed optional auditing and fixed no-op-count rule rejected. Hermes extension. |
| `skills/ai/ai-call-with-mock-fallback/SKILL.md` | `7638c7fab916071dfb4c134a5d12698d4e06d9d3efc2cf408358b1a586061e66` | 515 | Metadata-only stub; no method body to refine. Not product provenance. |

Official [JSON Schema object documentation](https://json-schema.org/understanding-json-schema/reference/object)
was checked for required and additional-field behavior. The
[JSON interoperability specification](https://www.rfc-editor.org/rfc/rfc8259)
was checked for duplicate-name ambiguity. The skill does not assume that parse
success, a typed accessor or closed shape proves factual correctness.

## Verification boundary

Two direct/paraphrased discovery cases failed before the new method existed and
passed afterward; all previous discovery cases were retained. Package validation
checks portability, metadata links and exact bytes. None of those alone measures
agent quality.

The forward exercise in `artifacts/universal-product-v1/wave4/exercise/` gives a
fresh Luna max worker only the new method and an inert consumer implementation
task. A separate parent-authored scorer is not supplied to the worker. This is
a single-assisted contract exercise, not a comparison, not a raw-agent test and
not evidence of incremental superiority. Host-native instructions remain present.
The task intentionally excludes duplicate JSON keys, so this exercise cannot
qualify that capability or live provider behavior.

The archived first implementation passed 37 of 38 independent cases and all 12
of its own focused tests. The retained mismatch is `blank abstention`: the task
said a nonempty reason, the worker used positive string length, and the scorer
required nonblank text after trimming. This is a contract/scorer ambiguity,
not evidence that the worker violated an explicit normalization rule. Neither
the original candidate nor the scorer was patched to turn it into a perfect run.
The product method was subsequently clarified to require explicit empty-versus-
blank semantics. That final wording has not been through a second worker run;
the exact exercised skill is preserved as `candidate-skill.md`.

Final review, exercise and installation coordinates are recorded in the wave's
[release verification artifact](../artifacts/universal-product-v1/wave4/release-verification.json).

The independent review found no confirmed product-skill, family-accounting,
portability or authority-boundary defect. It independently passed 34 focused
checks and agreed with the exercise ambiguity disposition. The parent full run
passed 969 of 970 repository tests, with zero failures and one pre-existing
Windows file-symlink skip; the real Windows junction and C:/D: volume checks ran.
A copy of the standalone product in a fresh temporary directory validated and
returned the new method for a paraphrased query without dependency installation.

## Published and installed

Implementation and evidence were fast-forwarded to main, retested there and
pushed at `2763e72059c7d52ebb6c80e8e4d5f6e161d52187`.
Release identity:
`7307b57da4c92f845d96ffd92b2b2b751c291ba225d7ad4e006f64639b23eab2`.

The existing 59-method installation was checked before replacement. All 60 new
native skill directories and the standalone pack were verified against the new
manifest. All 56 unrelated files matched both the immediate pre-upgrade snapshot
and the original migration snapshot. Prior files remain recoverable through
`universal-v1-20260921-r5/install-receipt.json`; no unrelated skill or old backup
was deleted.

A fresh non-forked Luna worker, `01a0c3dc-7d6b-7572-9dd1-208b3f3886c4`, reported
the new skill name and `r1/structured-output-contracts/SKILL.md` from its initial
host catalog without tools or file reads. The visible description was truncated
by that catalog view; this establishes name/path discovery, not complete UI
rendering or refresh of all already-open tasks.

The portable ZIP was built from the committed product tree and validated after
fresh extraction. `eternities-godskills-7307b57d.zip` is 248,322 bytes, SHA-256
`1a52330aeb4b38ab3ec73fa3bf835c4972a4865f8b80230be8e66dc25731ac66`.
All six historical compatibility paths remained unchanged.

This wave is finished, but complete body-level refinement of the source corpus
is not. The now-complete metadata family workplan provides the next bounded
source-review batches; it does not retroactively certify any of those sources.
