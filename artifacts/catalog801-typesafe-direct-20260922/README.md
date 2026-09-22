# Direct TypeSafe continuation, 2026-09-22

The owner supplied a direct TypeSafe credential after the OpenRouter route returned HTTP 402. The secret is stored only in the Windows per-user `TYPESAFE_API_KEY` environment setting, not in this repository, these receipts, or the shared OpenRouter credential. Existing processes may need to explicitly load the fresh user setting.

Official contracts used: <https://docs.typesafe.ai/api> and <https://docs.typesafe.ai/models>. Authenticated `GET https://api.typesafe.ai/v1/models` returned HTTP 200 and the advertised aliases. One synthetic software-versus-gardening canary against the pinned `jev-1.13.0` returned HTTP 200, a valid software choice, confidence 1, 321 input tokens, and 32 output tokens in 389 ms. That canary checks connectivity and schema, not classification quality.

## Delivered

The direct adapter submitted all 332 previously undispatched batches: frozen plan index 12 and indices 753 through 1083. It sent only the already-approved selected public metadata. No prior OpenRouter attempt was resent, rebranded, replaced, or silently interpreted as a native result.

- 332 native provider receipts, explicitly listed and SHA-256-bound in the continuation manifest.
- 265 batches passed the strict native response checks; their labels may still abstain or select unknown.
- 67 batches were rejected as malformed provider responses and retained as unavailable, with raw responses available for diagnosis. No automatic retry or probability repair occurred.
- Zero undispatched eligible bodies remain in the combined catalog.

Combined body outcomes: 4,642 provisional, 3,186 abstained, 888 unavailable, 124 explicit unknown, and one excluded metadata body; total 8,841. This exhausts submission coverage, not refinement, quality certification, or installation. `classificationComplete` remains false by design.

## Boundaries

Native receipts retain endpoint `https://api.typesafe.ai/v1/systemone`, requested/returned model `jev-1.13.0`, original source request/snapshot, and an exact native wire hash. No OpenRouter provider/model identity is fabricated. The adapter applies the existing 0.85 probability, 0.75 confidence, and 0.25 margin requirements; sums and argmax must remain valid.

Each request receives an exclusive durable pending marker before network dispatch. A saved receipt replays without another call; an unresolved marker stops resubmission. Transport and HTTP failures are not retried; no redirect or alternate endpoint is allowed. Provider credentials are never serialized in receipts. Local request counts, finite spend quotas, and artificial pacing are not imposed. Execution is sequential for this continuation, without changing any other task's scheduler or shared plugin.

The normal catalog loader and query command now consume hash-bound `directReceipts`, refusing changed evidence, duplicate inputs, or overwrite of previous attempts. Product activation remains `none`, source review remains incomplete, and no installed Godskills method was changed.

Verification includes native receipt validation, altered binding/model/probability/argmax rejection, weak-confidence abstention, existing-attempt overwrite rejection, filesystem-backed replay and pending-attempt tests, exact-hash catalog loading and tamper rejection, and the existing real CLI summary tests. Tests were developed inline, not independently reviewed. No runtime worker remains active after `status.json` reports 332 attempts with `stop: null`.

Final worktree suite: 1,071 tests, 1,069 passed, zero failed, two conditional skips. An earlier run exposed a copied CLI fixture missing the new module; that fixture was corrected. A subsequent run hit two transient ten-second pinned-source Git read timeouts on D:. Exact pinned reads and their focused tests passed afterward, followed by a complete successful suite without changing source hashes, timeouts, or acceptance criteria.
