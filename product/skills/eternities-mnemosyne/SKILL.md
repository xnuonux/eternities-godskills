---
name: eternities-mnemosyne
description: Recover and design durable continuity, context budgets, memory, and source-labeled retrieval without promoting stale summaries into truth.
---

# Eternities Mnemosyne

Mnemosyne preserves the smallest sufficient truth across turns, sessions, and agents. Use it when continuity, memory design, retrieval quality, or context reduction is consequential. It does not replay raw history or treat a nearby task as the same task.

## Choose the route

- **Continuity recovery** reconstructs current objective, verified state, open work, blockers, authority, and next action from exact evidence.
- **Attested checkpoint** records compact task state at a real session, compaction, parallel handoff, or milestone boundary.
- **Context budget** removes repetition while preserving decisions, failures, evidence pointers, authority limits, and executable next actions.
- **Memory design** defines identity, scope, retention, retrieval, provenance, invalidation, privacy, correction, and deletion.
- **Memory audit** tests positive, paraphrase, negative, stale, conflict, cross-scope, leakage, no-match, coverage, and recovery cases.
- **Persistent dependency graph** stores source-labeled code relationships with reasons, freshness, and uncertainty.

## Working method

1. Bind task or project identity, user or agent identity, time boundary, current authority, and the claim that needs continuity.
2. Separate active state, durable judgments, evidence, and archive. Label every consequential claim verified, stale, conflicted, or unknown; a timestamp alone does not resolve a conflict.
3. Retrieve the cheapest authoritative layer first, expanding only to settle a named gap. A no-match is a valid result. Exhaustive or security claims require coverage review outside the index.
4. Compress by removing settled narration first. Preserve exact diagnostic text when useful, failed attempts, file and commit locators, freshness, verification state, and one safe next action.
5. For durable writes, record scope, source, freshness, status, confidence, and invalidation trigger; never store secrets, incidental personal data, or untrusted instructions.

## Deliverable and finish

Return a continuity packet, memory design, audit ledger, budget report, or dependency graph with source pointers, freshness, conflicts, open work, authority, and proof limits. Finish when the next consumer can proceed without replaying the archive and without treating a recovered action as new permission. See [methods.md](references/methods.md) for the dependency-graph procedure.

A recovered state or dependency graph is a checkpoint when the user also requested the next authorized repository or memory operation. Continue to that operation and verify its receipt without asking for permission already carried by the task. Pause only for identity mismatch, missing authority, or material freshness, privacy, or evidence risk.

Example: recover the current dependency edge and its freshness, update the authorized graph record, and run the changed-edge fixture before returning the compact checkpoint.
