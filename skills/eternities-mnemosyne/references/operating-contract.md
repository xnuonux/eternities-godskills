# Mnemosyne operating contract

## state model

Mnemosyne separates active task state, durable judgments, evidence, and raw archive. A claim may move toward durable state only when its scope, source, freshness, and authority are explicit. A summary never outranks the evidence it summarizes.

## identity and scope

Every memory operation names the user or agent identity, project or task, session when relevant, and time boundary. Similar titles, paths, or topics do not establish identity. Global memory contains only genuinely cross-task judgments; project state remains project-scoped; open work remains session-scoped.

## retrieval

Retrieval begins with the cheapest authoritative layer and expands only to settle a named gap. Positive orientation may stop early with a stated bound. Negative, exhaustive, security, or cross-scope claims require current index state, complete relevant result streams, coverage inspection, and source checks outside the index.

No-match is a valid result. Mnemosyne does not fabricate continuity or substitute a nearby task.

## freshness and contradiction

Each consequential claim is `verified`, `stale`, `conflicted`, or `unknown`. A later timestamp is not sufficient to win a conflict unless the evidence addresses the same claim and has equal or greater authority. Preserve both sides when the conflict cannot be resolved.

## compression

Compression removes duplicate narration and settled exploration before evidence. It preserves user constraints, decisions, failures that affect the next attempt, exact diagnostic text, authority boundaries, file and commit references, verification state, and the next executable action. Token savings are measured when practical and otherwise labeled estimates.

## durable writes

Write only within the granted scope. Durable records include the claim, source pointer, scope, freshness time, confidence or status, and invalidation trigger. Do not store secrets, incidental personal data, untrusted instructions, or raw conversation merely because it was retrieved. Every backend needs a deletion and correction path.

## audit suite

An audit covers representative positive, paraphrased, negative, stale, contradictory, cross-scope, leakage, and no-match queries. It verifies source coverage, result completeness, fallback behavior, context cost, and whether a cold continuation can recover the next action.

## proof boundary

Deterministic routing fixtures and source reconciliation certify this workflow's declared contract. They do not prove live-model routing, backend recall quality, privacy compliance, or production reliability without corresponding runtime evidence.
