# Wave14 Muse integration — independent product review

## Verdict

**NOT_READY for product acceptance.** The operational pool invariant needs one explicit rule before this method can safely guide a reusable view. This is an independent product review only; it does not authorize release or integration.

## Review basis

Compared the live tracked product diff with `6a548d9`, read the completion-authority document and the Wave14 source packet and prior review, and inspected the integrated Muse method, metadata, generated catalog, and release manifest. The tracked diff contains the six stated product files; `tests/universal-wave14-discovery.test.mjs` is present as a new untracked test. The shared worktree also contains unrelated untracked work, which I left untouched.

The source packet’s four adapter decisions and rejection of the provider-specific image workflow are coherent with the new method. The method is distinct from Atlas’s ownership of data definitions and measurement, Hermes’s ownership of retry semantics, and Muse’s ownership of visual explanation and accessibility. Its instructions avoid provider or machine dependencies, prohibit implied live access or telemetry changes, bind marks to target fields and time, and preserve unknown, stale, mismatched, and failed evidence.

## Findings

### Blocking: pool reconciliation leaves the capacity relation ambiguous

The method calls for “capacity cells” and says mutually exclusive pool states should “reconcil[e] to capacity” (`product/skills/eternities-muse/references/methods.md:20,22`). It does not say whether capacity means the configured upper bound or currently allocated connections, nor name an unallocated state or its derivation.

That distinction changes the result for an ordinary lazily opened pool. With a configured maximum of 8 and a same-sample snapshot of idle 2, leased 3, connecting 1, and closing 0, the observed allocated total is 6. This is consistent with the maximum; the remaining two slots are unallocated. Treating `2 + 3 + 1 + 0` as required to equal 8 would report a healthy underfilled pool as an invariant failure. Conversely, deriving two free slots is unsafe when state telemetry is incomplete.

Clarify the invariant in the method: define the target’s exhaustive allocated states; require their same-sample sum to be no greater than the configured maximum; derive `unallocated = maximum - allocated` only when the state set is known complete; otherwise render unallocated capacity as unknown. Keep waiters outside both totals. Until that rule is explicit, different agents can produce conflicting or false capacity findings from the same valid data.

### Non-blocking: catalog relationships omit the named owner handoffs

The method says Atlas owns field and measurement contracts and Hermes owns retry semantics (`references/methods.md:17`), but Muse’s `related` metadata in `skill.json` and `catalog.json` omits both. The operational triggers make Muse discoverable, and the method prose still names the handoffs, so this does not block the route; adding Atlas and Hermes as related skills would expose those owners in catalog results.

## Bounded instruction-use exercise

Synthetic fixture only; no browser, provider, or live-system behavior was exercised.

- Audience and question: service operator; explain pool occupancy and waiting work at `2026-09-23T14:03:00Z`.
- Synthetic configured maximum: 8 connections. Pool-state snapshot at `14:00:00Z`: idle 2, leased 3, connecting 1, closing 0. Waiter sample: 4 at `14:02:45Z`. Assumed refresh target: 60 seconds. Acquisition-latency p95 was not supplied.
- Field-to-mark map: `max_connections` → capacity denominator (8); each reported pool-state field → labeled segment and exact count; their sum (6) → allocated total; `max_connections - allocated` → two unallocated slots only under the explicit completeness assumption; `waiters` → separate queue count, not a pool state; snapshot and sample times → absolute timestamp and freshness text; missing p95 → “unknown,” with no zero-valued mark.
- Invariants under that stated synthetic contract: each allocated connection belongs to exactly one state; `allocated = 2 + 3 + 1 + 0 = 6`; `0 ≤ allocated ≤ 8`; when those states are exhaustive, `unallocated = 2`; waiters are not added to allocated or capacity. The exercise required supplying the upper-bound/completeness interpretation that the product wording currently leaves unstated.
- Staleness and comparison: at the view time, the pool snapshot is three minutes old and stale against the assumed 60-second target; the waiter sample is 15 seconds old. Since the samples are not synchronized, show each separately and make no current saturation, trend, or causal claim. The missing p95 remains unknown.
- Accessible fallback: a static, keyboard-readable table with headers for metric, exact value, unit, source, as-of time, and status; spell out state names and “stale”/“unknown”; do not rely on color or hover. Any graphic has the same labeled table/list equivalent and visible focus, with a reduced-motion/static presentation.

The method produces a useful field-to-mark map, explicit evidence labels, an accessible fallback, and a disciplined limit on conclusions. The capacity ambiguity above is the defect revealed by applying it.

## Verification and limits

- `node --test tests/universal-wave14-discovery.test.mjs`: passed, 2 tests. The fixtures route five operational visualization queries to Muse with `authority: none` and `activation: none`; they keep `configure HTTP retries and idempotency for an API client` and `generate an agricultural marketing image` off the Muse route.
- `node bin/godskills.mjs validate` from `product/`: passed, `verified-content`, release ID `2f04739090e237d9d6a3482dbef41ddda73a48adb8f7c561674e38cfb687eb8d`, 68 skills.
- `git diff --check 6a548d9` for the six product files: passed with no whitespace findings.
- No live telemetry, browser rendering, provider workflow, or upstream execution was used. Passing catalog fixtures establish these route cases only; package validation checks declared content and hashes, not operational semantics or rendered behavior.
