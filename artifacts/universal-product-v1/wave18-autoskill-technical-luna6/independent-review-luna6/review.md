# Wave18 AutoSkill technical candidate — independent review

## Decision

| Candidate | Result | Scope of this result |
|---|---|---|
| R1 — Hermes: incremental stream framing and decode contract | **READY** | Ready as a source-bound, nonterminal owner-refinement proposal for review. |
| R2 — Daedalus: partial-commit and compensation gate | **READY** | Ready as a source-bound, nonterminal owner-refinement proposal for review. |

These findings assess the two candidate designs only. They do not approve owner changes, implementation, installation, ledger promotion, or any terminal source disposition. There are no blockers to the bounded candidate review. The downstream gates below remain open.

## Source and artifact verification

I independently resolved all 22 selected paths against the complete pinned Git tree at `ECNU-ICALK/AutoSkill@94c47ca488d4ba4117d20272e66d49b9877e68cf`, read each corresponding raw Git blob in full, and recomputed its byte count, Git blob identity, and SHA-256. Each result matched the original catalog row in `data/quarry-intake-2026-09-21-catalog801/sources.jsonl` for source identity, repository, destination, origin, commit, path, blob, body digest, and bytes. The checked repository `HEAD` is the pin; the repository origin matches the recorded GitHub origin. All 22 body hashes are distinct, totaling 60,333 bytes. The two SCP entries sharing a title are different paths, blobs, and full-body hashes; I did not merge their identities.

The candidate’s own digests for `source-review.md` and `candidate-methods.md` match independently recomputed values. The candidate receipt’s stated output digests also match those two files. Exact candidate artifact digests and the complete 22-row source identity/hash manifest are in `receipt.json`.

The pinned AutoSkill root tree contains no license/notice file; its README has an MIT badge, and all 22 source catalog rows have null license hints. The source review correctly leaves rights unresolved and states that it copied no source prose, code, or examples. This does not prevent assessment of the independently worded high-level proposals, but license/provenance clearance remains a gate before reuse or redistribution.

## R1 — Hermes: READY

The omitted capability is narrow and real. Hermes already covers protocol/API boundaries, schemas and versions, authentication, retries, timeouts, idempotency, partial failure, and receipts. Its protocol card requires malformed-input and partial-response cases, but it does not define how arbitrary byte chunks become complete application records, how incremental character decoding state is retained, or how limits, backpressure, and EOF truncation are handled. `structured-output-contracts` separately requires buffering streamed structured results until their agreed completion boundary; that protects consumers from acting on a parseable prefix, rather than specifying an adapter’s byte-to-record framing.

The exact UniApp source (`sources:8296`) asks for chunk processing before request completion but does not establish platform support, UTF-8 boundary behavior, framing, limits, or cancellation. The Fluentd source (`sources:8201`) is tied to one plugin and log grammar. The proposal retains the general boundary and rejects those platform/plugin assumptions. Its prerequisites require verified runtime support and a declared framing grammar; its exclusions prevent it from swallowing ordinary complete-body JSON, WebSocket/SSE, audio, database streams, or unsupported platforms. Those constraints make the refinement portable as a contract, not as unverified code.

The NDJSON example is a credible contract case: retain decoder state when a multibyte character crosses callbacks, allow multiple records in one callback, emit only complete records, and report an incomplete final record as an error rather than success. The proposed tests also cover truncation, malformed bytes, limits, slow consumers, cancellation, and failure after partial emission. They are appropriately labeled proposed, not executed.

**Readiness boundary:** before any implementation, verify the exact target platform/API and version, then exercise the decoder/framer and its failure contract against deterministic fixtures. No target runtime was selected or tested here.

## R2 — Daedalus: READY

Daedalus already calls for bounded changes with tests, failure handling, rollback, and recovery evidence. Atlas owns data/schema/migration concerns. Nearby `release-script-safety` tracks partially applied release effects and interruption reconciliation, while `api-rate-limit-recovery` owns provider retry behavior. Those are meaningful overlaps, but none of the inspected Daedalus entrypoint/method cards requires a per-operation commit/effect timeline and final-state matrix for an explicit requirement to preserve one committed effect while undoing or withholding another.

The source (`sources:8287`) is relevant evidence, not trustworthy engine guidance: it recommends separate transactions or logical deletion and presents SQL Server-style savepoint syntax as portable to multiple engines. The candidate explicitly rejects treating these as universal solutions. Its portable core is the decision procedure—enumerate ordered effects, name the required invariant, bind exact database/driver/ORM/version semantics, reconcile uncertain commits before replay, constrain compensation authority, and test failures around every durable effect. It correctly excludes ordinary all-or-nothing transactions, read-only work, and unidentified transaction semantics.

Keep the trigger tight: an explicit partial-commit/preservation requirement or a durable effect that can precede downstream failure. General release interruption should remain with release-script-safety; provider rate-limit retries with api-rate-limit-recovery; schema or data migration with Atlas. With that routing boundary, the method adds a useful contract to Daedalus rather than replacing those owners.

The order-draft/payment-record/provisioning example is realistic and tests the key semantic distinction: after provisioning fails, the durable payment record cannot truthfully be described as rolled back. The proposed crash-after-commit/before-acknowledgement, duplicate retry, concurrent duplicate, compensation-failure, and unknown-state cases are appropriate. The candidate does not select a database recipe or claim that compensation restores the original state.

**Readiness boundary:** before implementation, bind the exact engine, driver, ORM, version, isolation/autocommit settings, and observed effect identity; verify the transaction behavior with provider-specific fixtures. None was selected or executed here.

## Boundaries and remaining gates

- No candidate code, source instructions, commands, or upstream procedures were executed. No runtime, database, integration, or candidate contract tests were run; proposed test lists are not evidence of behavior.
- No web or provider calls were made. No source, product, ledger, or Git changes were made. Only this independent-review directory is authorized for writes.
- The source rights state is unresolved. No source-specific implementation or redistribution is cleared by this review.
- Any adoption still needs the appropriate owner-maintainer review and direct tests at the target protocol/runtime or database/provider boundary. Candidate status remains nonterminal and not installed.
