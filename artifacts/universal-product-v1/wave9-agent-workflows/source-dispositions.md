# Agent-workflow-reliability source dispositions

All eight lead bodies were read from exact manifest-resolved paths and matched intake SHA-256, Git blob, repository HEAD, and `commit:path` blob. Embedded prompts and commands were treated as inert data and were not executed. These are method observations, not license clearance or live-agent evaluation.

| ID | Source | Actual mechanism | Disposition | Evidence limit |
|---|---|---|---|---|
| r0051 | claude-subconscious-workflows | Separate execution/reflection, durable notes, incremental workflow tuning | covered | Forge claim ledger, handoffs, and Daedalus source ledgers cover the useful bounded forms. Continuous background self-improvement is rejected as unmeasured and not needed for a task-local method. README-only MIT notice; no root LICENSE observed. |
| r0131 | codex | Three-mode Codex CLI wrapper with review/challenge/consult, sessions, telemetry, and install/config prompts | rejected | Named CLI and gstack launcher behavior; substantial host setup and embedded instructions. Forge/Daedalus already require bounded review and parent verification. |
| r0204 | a2a-protocol-with-hello-publish-decision | Tiny HELLO/PUBLISH/DECISION message envelope with content hash and accept/quarantine/reject | covered | Forge delegation envelopes and receipts cover identity, bounds, effects, and return binding. The named transport protocol is not a portable gap. |
| r0239 | claude-code-worker | Isolated worktree delegation, self-contained brief, quota recovery, parent diff and digest verification | covered | Forge and Hermes cover bounded delegation and effect ownership. Claude/AgentCom bridge details are platform adapters and remain deferred. |
| r0249 | skill-token-overhead-review | Compare skill-enabled overhead with observed output value; trim, split, lazy-load, or compose while preserving safety | retained | Meaningful missing mechanism: product skills say “smallest sufficient chain” but do not require measured overhead/value review. No runtime measurement was performed here. |
| r0255 | hermes-background-process-registry | Bounded rolling output, watch-pattern rate limiting, atomic checkpoints, detached recovery, interruptible waits, process-group kill | deferred | Useful execution-runtime mechanism, but it is implementation work outside this source-bound method draft. `bounded-service-shutdown` covers shutdown only. Proposed owner if revisited: `eternities-hermes`. |
| r0266 | agent-lifecycle-hooks | RunHooks/AgentHooks lifecycle observation and usage accounting | covered | Forge evidence ledgers and Phoenix diagnostic-state contracts cover portable observability. The named OpenAI Agents APIs are platform-specific. |
| r0311 | superpowers | Scope lock, 2–5 slices, minimal edits, focused then nearby verification, tight increments | covered | Forge’s bounded-slice loop and Daedalus implementation route already contain this mechanism more explicitly. |

## Comparison notes

`eternities-forge` supplies orchestration, proof surfaces, claim-to-evidence tracking, review gates, and termination. `eternities-daedalus` supplies route-specific source ledgers, fail-closed boundaries, and typed handoffs. `eternities-phoenix` supplies bounded diagnosis, hypothesis elimination, rollback requirements, and stop conditions. `eternities-hermes`, `bounded-service-shutdown`, `performance-release-gating`, and `semantic-implementation-diff` provide adjacent effect, lifecycle, measurement, and comparison boundaries. No universal superiority or behavioral-performance claim is made.
