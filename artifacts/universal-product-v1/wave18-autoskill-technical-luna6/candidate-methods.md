# Candidate owner refinements — AutoSkill technical sources

Status: two independently worded, source-informed review drafts for existing owners. Neither draft changes the 68-skill pack, and neither is approved, implemented, tested at runtime, ledger-promoted, or terminal. There is no standalone new-skill proposal: both mechanisms fit existing owners.

## R1 — Hermes: incremental stream framing and decode contract

**Owner / kind:** `eternities-hermes`, proposed protocol-integration refinement.

**Source evidence:**

- `ECNU-ICALK/AutoSkill@94c47ca488d4ba4117d20272e66d49b9877e68cf:SkillBank/Users/chinese_gpt3.5_8_GLM4.7/uniapp-post流式数据接收与解析/SKILL.md` — source record `catalog801-2026-09-21:sources:8296`, 2,001 bytes, body SHA-256 `c2a9f7c43dde1b2025aa802f72b5121ec8ea3fa3e97eee4c7afff8043ba56ea1`.
- `ECNU-ICALK/AutoSkill@94c47ca488d4ba4117d20272e66d49b9877e68cf:SkillBank/Users/chinese_gpt3.5_8_GLM4.7/fluentd-mysql慢查询日志正则解析配置/SKILL.md` — source record `catalog801-2026-09-21:sources:8201`, 2,647 bytes, body SHA-256 `e64c1361fb84dda5dcf077fa61991399ef9b346a04d1dd53cb05fd1d5ffccc9c`.

**Retain:** the requirement to process useful records before a stream completes; exact wire framing; parse only complete records; preserve useful diagnostics about oversized/malformed records; distinguish final completion from an intermediate chunk.

**Reject:** assuming `uni.request` supports chunks on every target; assuming each callback chunk is valid UTF-8 or a complete JSON value; applying a fresh non-streaming decoder per chunk; unbounded concatenation; copying the Fluentd regexp/plugin restriction into unrelated transports; treating a partial response as success. The source bodies are prompts, not tested adapter implementations.

**Positive triggers:** implement or review an authorized HTTP, file, or protocol client whose payload arrives in arbitrary byte fragments and must be consumed before end-of-stream.

**Exclusions:** complete-body JSON decoding; WebSocket, SSE, audio, or database streaming semantics without their own protocol route; platforms without verified chunk support; source-code execution or tool installation. If chunk delivery is not documented for the selected runtime, return a capability gap or an explicitly approved buffered alternative—not a claimed stream.

**Prerequisites:** target runtime/platform and version; verified streaming API; charset; message-framing rule (length prefix, delimiter, or another declared grammar); maximum record and total-buffer sizes; consumer/backpressure behavior; cancellation, timeout, and retry contract; whether the request is idempotent.

**Steps:**

1. Separate transport chunks from application records; document when a record is complete and what remains in the parser between callbacks.
2. Keep incremental decoder state across byte chunks. Preserve undecoded suffix bytes and incomplete record text; do not parse a partial multibyte character or record.
3. Emit only complete framed records unless the consumer contract explicitly supports partial events. Bound retained bytes and records; define what happens when the producer outpaces the consumer.
4. On end-of-stream, flush the decoder and validate the final remainder against the framing rule. Treat truncated, malformed, or over-limit data as an explicit error with already-emitted record counts.
5. On cancel, timeout, or callback failure, stop intake, release stream/parser resources, retain the terminal cause, and do not retry a non-idempotent request blindly.
6. Verify behavior against the actual platform API and a deterministic fixture before claiming compatibility.

**Output contract:** an adapter or design packet names runtime/API version, request/response schema and framing, maximum buffer, emitted complete-record count, terminal status (`complete`, `cancelled`, `transport-error`, `decode-error`, `frame-error`, `limit-exceeded`), partial-record disposition, and retry/idempotency boundary. A partial result must never be labeled complete.

**Failure recovery:** if streaming is unsupported, stop before dispatch or use buffered mode only with an explicit semantic decision. For malformed/truncated input, preserve an error and bounded partial receipt; discard or quarantine the incomplete record according to the declared contract. Reconcile uncertain POST effects before any retry.

**Realistic example:** a service declares newline-delimited UTF-8 JSON records over an `application/octet-stream` response. One multibyte character is split across callbacks, two JSON records share another callback, and the final record is truncated. The adapter must retain decoder and line-framing state, emit only the two complete records, and end with `frame-error` for the remainder—not parse each callback as independent JSON.

**Test cases to run if adopted:** direct trigger and paraphrase; ordinary complete-response exclusion; unsupported-platform conflict; UTF-8 code point split at every byte boundary; one record split at every boundary; multiple records in one chunk; empty stream; malformed/truncated final record; buffer-limit breach; slow consumer/backpressure; cancellation mid-record; transport failure after some records; non-idempotent retry refusal. These are proposed tests, not executed evidence.

**Adaptation/license limit:** preserve only the general byte/framing insight in fresh language. Do not copy source text, examples, platform code, or plugin configuration. Confirm the target platform’s official API and license/provenance before implementation.

## R2 — Daedalus: partial-commit and compensation gate

**Owner / kind:** `eternities-daedalus`, proposed transaction/workflow-failure refinement; coordinate with Atlas when schema, persistence, or data migration is involved.

**Source evidence:**

- `ECNU-ICALK/AutoSkill@94c47ca488d4ba4117d20272e66d49b9877e68cf:SkillBank/Users/chinese_gpt3.5_8_GLM4.7/sqlsugar_partial_rollback_and_sequence_execution/SKILL.md` — source record `catalog801-2026-09-21:sources:8287`, 3,563 bytes, body SHA-256 `2d0d8d5f0931ed2f03046f676edbed52e66c77ec705b22d00fdf9391c8c4a97a`.

**Retain:** make operation order and each failure point explicit; distinguish rollback from a durable checkpoint or compensation; test failures at each step; name database/ORM semantics rather than assuming syntax.

**Reject:** treating an independent transaction as a general way to “roll back A but keep B”; presenting logically deleted data as equivalent to an atomic rollback; recommending a savepoint command across engines without checking exact dialect, driver, and version. The inspected body names SQL Server and MySQL around SQL Server-style `SAVE TRANSACTION`; this is an unverified portability claim and must not be copied.

**Positive triggers:** user requirements intentionally preserve one effect while undoing another; ordered operations span database transactions and external effects; a retry or crash may occur between commit and acknowledgement.

**Exclusions:** ordinary all-or-nothing work contained in one verified transaction; read-only queries; a database/ORM whose active transaction semantics cannot be identified. Do not invent a saga, outbox, compensation, or separate commit without a stated need and authority.

**Prerequisites:** exact operation order and success/failure behavior; database engine, version, driver and ORM; isolation/autocommit mode; what “rollback” means to the user; commit points; external effects; idempotency keys; permitted compensation; crash/retry behavior; recovery owner.

**Steps:**

1. Draw each operation and observable effect in order. For each failure point, state which changes are still uncommitted, durable, externally visible, or uncertain.
2. Choose and name the intended invariant: all-or-nothing, intentional durable checkpoint, or committed effect plus explicit compensation. Resolve contradictory requirements before writing code.
3. Verify engine-specific transaction/savepoint behavior against the actual engine/driver/ORM and version. Keep syntax provider-bound; never infer cross-engine compatibility from a source prompt.
4. Define operation identity and idempotent replay where possible. If an effect may have committed before timeout, reconcile state before retry. Record compensation authority and its own failure path.
5. Exercise a failure before and after every commit/effect, crash between commit and acknowledgement, duplicate retry, concurrent request, and compensation failure. Compare the final state to an independently written state table.
6. Return exact state and recovery choices. If state cannot be observed or safely compensated, stop in an unresolved state rather than claiming rollback.

**Output contract:** operation/effect timeline; transaction boundaries; database and API versions; per-failure final-state matrix; idempotency/reconciliation strategy; compensation and authority; tests/evidence; unresolved state. Use distinct labels for `rolled-back`, `committed`, `compensated`, `pending-reconciliation`, and `unknown`.

**Failure recovery:** do not blindly rerun after a timeout or partial commit. Read the authoritative state using the declared operation identity; reconcile before retry. Compensate only when the action and target were explicitly authorized. Preserve the prior state and uncertainty when the database or external service cannot confirm an outcome.

**Realistic example:** step A creates an order draft, step B commits a durable payment record, and step C provisions the order. If C fails, the system must not say the whole operation rolled back: B is durable and the order is pending. The handoff must specify whether to retry C idempotently, reconcile, or issue an authorized compensation; it must also show what happens if the process dies after B but before recording that acknowledgement.

**Test cases to run if adopted:** direct and paraphrased partial-commit requests; conflict between “atomic” and “keep B”; all-or-nothing exclusion; dialect/version mismatch (including the source’s `SAVE TRANSACTION` portability assertion); failure before/after every step; crash after commit/before acknowledgement; duplicate retry; concurrent duplicate; compensation failure; unavailable authoritative state. These are proposed tests, not executed evidence.

**Adaptation/license limit:** retain the problem structure, not SqlSugar code or source phrasing. Do not treat the source’s transaction recommendations as correct or portable. Confirm provider documentation, project constraints, and legal/provenance status before implementation.

## Candidate review gate

For both drafts, run direct, paraphrased, exclusion, conflict, and boundary routing cases against the owner entrypoint; have a reviewer who did not select these bodies check source identity, owner gap, candidate scope, and tests. If existing owner text already handles the specific omitted boundary, reject the refinement instead of duplicating it. No runtime, live database, or transport tests were run in this source-review task.
