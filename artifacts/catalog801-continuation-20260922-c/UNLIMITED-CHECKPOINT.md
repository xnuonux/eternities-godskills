# Uncapped classification checkpoint, 2026-09-22

This is advisory intake evidence, not completed skill synthesis or a new installed product release.

The uncapped worker settled 571 original requests at frozen plan indices 181 through 751. Its 684 provider receipts (originals and retries) are now explicitly hash-bound in the continuation manifest. Of those originals, 535 obtained valid responses, 35 exhausted the single malformed-response retry, and index 751 stopped on an `argmax` validation error. Valid responses may contain abstentions.

The index-751 answer selected an option inconsistent with its own probability maximum. Recovery now treats that settled malformed answer like a distribution-sum failure: permit one separately recorded, source-bound retry, never repair probabilities or accept the rejected label. A second malformed answer remains quarantined.

The first restart replayed the 684 saved receipts without redispatch and encountered a local `paced` refusal before sending the index-751 retry. That refusal made no inference and is preserved byte-for-byte under `admission-refusals/`, excluded from classifications. The original terminal checkpoint is `unlimited-stop-argmax.json`; `unlimited-status.json` is the latest runner checkpoint, not evidence of ongoing execution.

The runner now reads the shared ledger scheduling state before dispatch and waits once for a known future start slot. It does not mutate the ledger, reserve a slot itself, retry an admission refusal, clear pending calls, or bypass the service's atomic admission checks. A race with another task can still refuse admission and stops the worker honestly. Coordination with the active research task is required to avoid continued contention.

Verified integrated body state at this checkpoint, from 8,841 unique bodies:

| Outcome | Bodies |
|---|---:|
| Provisional Jev category | 3,358 |
| Abstained | 2,344 |
| Unavailable | 349 |
| Explicit unknown | 123 |
| Excluded metadata | 1 |
| Not dispatched | 2,666 |

The continuation manifest includes 742 original receipts and 134 retry receipts, in addition to the frozen original intake evidence. After the diagnostic below, the next never-attempted tail index is 753. An audit matching undispatched input hashes against the frozen request items also found earlier gap index 12: 332 original requests remain never dispatched, covering 2,666 bodies.

After scheduling admission succeeded, index 751's one authorized retry returned a bound `transport` failure at 09:16:26 UTC. It was recorded and integrated, not resent. The previous local pacing refusal remains independently preserved. No worker is running after that terminal checkpoint. Read-only OpenRouter checks reported `is_free_tier=true`, `total_credits=0`, and `total_usage=0.201360474` USD. The shared ledger's latest three dispatches failed transport after earlier successful calls. Those observations do not establish the exact HTTP error: the existing transport suppresses its details. No key was rotated, no credit purchased, and no uncertain attempt duplicated. The active research task was informed for coordination.

A single diagnostic attempt on the previously unsent index 752 then captured **HTTP 402** from the fixed Decisions endpoint. It retained the existing content-bound request identity, ledger accounting, timeout, and no-redirect protections. Only the HTTP status was recorded, not headers, credentials, or response body. Its eight inputs remain unavailable; no retry was made. This confirms a provider-side billing rejection, distinct from removed local quota caps. The main runner status predates this diagnostic; use the explicit receipt manifest and this checkpoint for the final coverage count. The diagnostic cannot overwrite an existing attempt. Further inference is stopped pending restored billing access or an expressly chosen alternative provider/key. The research task received this confirmed result.

Verification: 11 task-local Python recovery tests pass; full repository suite 1,065 tests, 1,063 passed, zero failed, two conditional skips. The new argmax and scheduling changes were verified inline, not independently reviewed. Protected activation artifacts and the installed 63-method product are unchanged. Global quota overrides remain unlimited; pacing, accounting, idempotency, and uncertainty protections remain enabled.
