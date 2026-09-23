# Wave 17–18 bounded method exercise

## Outcome and boundary

Four text-only instruction exercises were run against the owner methods pinned in candidate release `0e8abfdfe55c0342b280975ede01e7b4321648acf87cd4109ca397fb330dbff7`. The four cases are Hermes incremental byte-to-record intake, Daedalus partial-commit recovery, Logos evidence-bound slide handoff, and Agora cross-artifact business fact consistency. Each method and the relevant `SKILL.md` were read in full; the referenced method text was also read in full. Daedalus's `test-design-and-evidence.md` was included because it governs fixture/oracle choice.

All exercised owner files hash-match `product/release.json`. The exact hashes and pinned-match results are in `receipt.json`.

This is a single-current-task instruction-following exercise. The exact prompts below define the synthetic cases; the observed packets are the response produced in this task by applying the named skill and reference. There was no second model, worker, provider call, source acquisition, network, database connection, upstream code execution, slide adapter, artifact build, or rendering. Expected rubrics are contract-derived and hand-calculated independently of the observed packets. This is not a comparative evaluation, superiority claim, implementation test, deployment check, or certification.

No method-level gap was reproduced within the stated boundaries. All four cases are `READY` for the bounded packet requested by their prompt. That does not qualify unexercised limits or broader live behavior; the case-specific boundaries are explicit below.

## Case 1 — Hermes: incremental UTF-8 / NDJSON framing

### Exact prompt

```text
Instruction exercise only. Do not run code or contact a service. Use only this synthetic trace. Return a bounded intake receipt, emitted records, partial-record disposition, terminal state, and retry/reconciliation note.

Synthetic runtime/API: ByteIterator v1, declared to expose the supplied response as byte chunks. Strict UTF-8; LF-delimited NDJSON; each complete JSON object has a string `event` and may have a string `note`. Maximum pending buffer is 128 raw bytes, including incomplete character bytes. Maximum record payload is 64 raw bytes excluding LF. The consumer accepts records immediately. These limits are fixture inputs, not verified platform properties.

The response is to non-idempotent POST operation `op-41`. No request replay or remote reconciliation is authorized in this exercise. Do not infer that the operation settled merely because a response record says `accepted`.

Chunks, in callback order, as exact hexadecimal bytes:
1: 7B 22 65 76 65 6E 74 22 3A 22 73 74 61 72 74 65 64 22 7D 0A 7B 22 6E 6F 74 65 22 3A 22 63 61 66
2: C3
3: A9 22 2C 22 65 76 65 6E 74 22 3A 22 61 63 63 65 70 74 65 64 22 7D 0A 7B 22 65 76 65 6E 74 22 3A 22 73 65 74 74 6C 65 64 22

The source ends after chunk 3. The last line has no LF and its JSON object is incomplete. Produce only the bounded analysis packet; no real runtime compatibility claim.
```

### Expected independent rubric

1. Treat chunks as arbitrary bytes and preserve one strict incremental UTF-8 decoder and framing state across callbacks; the split `C3 A9` must decode as `é`.
2. Emit exactly the two complete newline-terminated objects and never emit the incomplete third line.
3. Report the third line as an 18-byte truncated partial record; at EOF classify the terminal state as `frame-error`, with exactly two complete records emitted.
4. Identify the declared runtime/API, charset, framing, limits, and partial disposition; do not claim the synthetic runtime proves a real platform.
5. Because the request is non-idempotent and its final outcome is not established by this body, prohibit automatic replay and require authoritative reconciliation by `op-41` before any retry.
6. State that cancellation/cleanup and slow-consumer/limit behavior were not exercised, rather than implying those paths passed.

### Observed reasoning and output

- The first chunk contains one complete record and the start of the next. The `C3` in chunk 2 is retained as an incomplete UTF-8 sequence; chunk 3's leading `A9` completes it. Decoding each chunk separately would fail this fixture.
- Emitted records, in order: `{"event":"started"}` and `{"note":"café","event":"accepted"}`.
- The remaining 18 bytes are `{"event":"settled"`; they are not emitted as a record. EOF leaves an incomplete JSON frame, so the terminal state is `frame-error`, complete-record count is `2`, and partial disposition is `withheld/truncated`.
- Receipt boundary: `ByteIterator v1` (synthetic only), strict UTF-8, NDJSON/LF, pending-buffer ceiling 128 raw bytes, record-payload ceiling 64 raw bytes excluding LF. The valid record payload sizes are 19 and 35 bytes; both fit. No cancellation, backpressure, or cap breach occurred.
- No retry is proposed. `accepted` is not treated as `settled`; reconcile the authoritative state for `op-41` before considering replay.

**Verdict: READY within this split-code-point / partial-final-frame boundary.** No unsafe omission was observed in the packet. The broader card cases—malformed UTF-8, a limit breach, slow-consumer backpressure, cancellation, and failure after partial emission—were not all exercised by this one task; their coverage is not inferred from this pass. The task also stayed below both declared caps and therefore does not settle any platform-specific cap accounting.

## Case 2 — Daedalus: partial commit and failed compensation

### Exact prompt

```text
Text-only method exercise. Do not connect to a database or provider, run commands, mutate data, or retry anything. Treat every event below as a supplied synthetic trace. Return an operation/effect timeline, final-state matrix, contradiction handling, read-only reconciliation plan, compensation authority, and bounded evidence receipt.

Declared stack for the fixture: PostgreSQL 16.4, node-postgres 8.13.1, no ORM, READ COMMITTED, explicit BEGIN/COMMIT (autocommit off). Operation identity is `order-O711`; provider creation key is `provision-O711`. No provider idempotency guarantee is supplied. Required invariant: preserve any payment row proven committed; never call the whole workflow rolled back while a durable effect remains; avoid duplicate provisioning. No further write, retry, or compensation is authorized.

Synthetic trace:
- 09:00:00 — transaction T-9 begins; inserts payment/order row `{order_id: O-711, op_id: order-O711, status: authorized}`.
- 09:00:02 — database returns COMMIT success for T-9; the application crashes before recording its receipt.
- 09:00:03 — coordinator log says: “rolled back entire workflow.”
- 09:01:00 — authoritative primary lookup by `order-O711` returns the authorized row at commit LSN `0/45A100`.
- 09:02:00 — external provision request for resource R-88 using `provision-O711` times out after 10 seconds. No response body is captured.
- 09:03:00 — provider status lookup by `provision-O711` returns 503/unavailable; no authoritative resource state is obtained.
- 09:04:00 — a prior worker attempted compensating DELETE for R-88 using `compensate-O711`; it received 503 before a response body. No authoritative post-compensation status is available.

The prior worker events are fixture observations, not permission to repeat them. Derive the expected state independently from the trace; keep unknown external effects separate from confirmed database state.
```

### Expected independent rubric

1. Preserve the engine, driver, ORM, isolation, and transaction-mode context; do not import another engine's behavior.
2. Treat the primary lookup by operation identity as evidence that the payment row is committed, and reject the coordinator's global-rollback statement as contradicted.
3. Keep provisioning creation and its compensation as separate effects. A timeout/503 without authoritative state leaves each effect unknown or pending reconciliation; it does not prove that either happened or did not happen.
4. Do not infer idempotency from the existence of an operation key. No retry or compensation is allowed until the relevant authoritative state and authority are resolved.
5. Return a per-effect final-state matrix and an overall partial/uncertain state, not one binary transaction result.
6. Use the trace as a deterministic synthetic fixture and a hand-derived oracle; claim no live database/provider behavior. State that pre-commit, concurrency, confirmed compensation, and other injection points remain untested.

### Observed reasoning and output

| Effect | Evidence | State | Safe next step within the prompt |
|---|---|---|---|
| Payment/order row `order-O711` | COMMIT success plus authoritative primary row at LSN `0/45A100` | `committed` | Preserve it; no rollback claim |
| Provision R-88, key `provision-O711` | Client timeout; provider status unavailable | `unknown` / reconciliation pending | Do not reissue; request authoritative provider status by operation identity when separately authorized |
| Compensation DELETE, key `compensate-O711` | Prior attempt returned 503; no post-action state | `unknown` / reconciliation pending, separately from creation | Do not repeat or claim compensation succeeded/failed; establish current state and authority first |

The coordinator's “rolled back entire workflow” line is contradicted by the authoritative primary row. The overall packet is `partial; external effects unresolved`, not “rolled back.” The operation keys identify records to reconcile but do not establish provider-side deduplication. No effect was performed in this exercise; no compensating action is authorized by the prompt.

The oracle is the literal trace-to-state mapping above, derived independently of any candidate implementation. The fixture covers a committed database effect, lost application acknowledgement, a provisioning timeout, unavailable provider status, and an unconfirmed compensation attempt. It does not inject a pre-commit failure, concurrent replay, authoritative provider recovery, or confirmed compensation outcome.

**Verdict: READY within this post-commit / uncertain external effects boundary.** No unsafe omission was observed. This is not evidence that PostgreSQL or the provider behaved this way in a live system; every stack fact and response is synthetic.

## Case 3 — Logos: sourced, text-only slide handoff

### Exact prompt

```text
Instruction exercise only. Prepare an internal, text-only slide handoff for a steering committee deciding whether to expand an onboarding pilot by 2026-10-01. Use only the synthetic source snapshots below. Do not create a slide file, use an adapter, render, publish, or make a causal/financial conclusion. There is no supplied acceptance threshold; preserve that gap. Return a claim register, slide map, rights list, and a receipt that separates content support, package/structure, render, and accessibility states.

Pilot brief r2 | date 2026-09-18 | p1
July pilot activation: 48 of 120 eligible teams activated (40%). Eligibility = teams invited by 2026-07-01; follow-up through 2026-07-31. Source: event export EV-22; owner Analytics.
No randomized control; no revenue attribution.

Board deck r7 | date 2026-09-20 | slide 4
Activation 44%: 132 of 300 accounts; sample window 2026-09-01 through 2026-09-15; includes trial accounts; source event export EV-31; formula not documented.
Conclusion: new onboarding drove USD 400,000 ARR growth. No source or causal analysis shown.

Support analysis r1 | date 2026-09-21 | table 2
Sample of 10 accounts: monthly support hours 150 baseline -> 123 after onboarding update, with data from prior 30 days and following 14 days; no matched control or randomization.
Reported arithmetic: 18% reduction versus baseline.

Rights note r1 | date 2026-09-21
Internal only; no customer logos, screenshots, or identifiable company names. Synthetic aggregate figures may appear in an internal review draft. No external distribution authorization.

Source identities/locators are the revision and page/slide/table labels above. This is the complete text fixture; do not fill gaps from memory or outside sources.
```

### Expected independent rubric

1. Bind audience, decision, dates, supplied acceptance rule (none), source period, rights, and effect boundary.
2. Preserve exact metric values, units, denominators, cohort definitions, dates, locators, claim class, caveats, and calculation owner/source.
3. Keep 40% (July invited teams) and 44% (September accounts including trials) separate and not comparable; do not choose by recency or display them as a trend.
4. Recompute only explicit arithmetic: `(150 - 123) / 150 = 18%`; label it descriptive for this ten-account sample and preserve the 30-day versus 14-day windows, lack of matched control, and absence of causal evidence.
5. Mark the USD 400,000 ARR attribution unsupported and do not promote it into the deck's conclusion. The slide map must identify support and contrary/caveat evidence IDs, proposed audience action, and visual/accessibility intent.
6. Respect internal-only use and prohibit customer marks, screenshots, and external distribution. Do not claim a slide package, render, visual inspection, accessibility pass, or output hash when none was produced.

### Observed reasoning and output

**Claim register (source IDs are synthetic and their locators are the supplied ones):**

Synthetic input-body identities (SHA-256 over UTF-8 without BOM, LF between lines, no trailing LF): Pilot brief r2 `4e476191a2c63cfc147830223a77721f584566467d4c6d098630eb4b327fdf81`; Board deck r7 `33296552f5f2e56d1390280fef2ecb2faf4705558bac231b85b22b3b7b6b2fbd`; Support analysis r1 `6c886a939d44f9bee9b5b5a4b62d6a696135946241b4d13dd84457969271a5b7`; Rights note r1 `c3a941addbfc6f574259a46b96947881d7b820d81cbae65cdfc9e410f564ed01`.

| ID | Claim and evidence | Class / treatment |
|---|---|---|
| L-01 | 48/120 = 40%; teams invited by 2026-07-01, follow-up through 2026-07-31; Pilot brief r2, p1; EV-22; Analytics | Supplied observation; July cohort only; no causal or revenue attribution |
| L-02 | 132/300 = 44%; includes trials; 2026-09-01–2026-09-15; Board deck r7, slide 4; EV-31; formula undocumented | Supplied assertion; denominator/cohort and window differ from L-01; not comparable to L-01 or a time trend |
| L-03 | 150 to 123 hours; `(150-123)/150 = 18%`; Support analysis r1, table 2; 10 accounts | Derived arithmetic from supplied values; periods differ (30 versus 14 days), no matched control/randomization; descriptive only, no causal savings claim |
| L-04 | “Onboarding drove USD 400,000 ARR growth”; Board deck r7, slide 4 | Unsupported assertion: no source or causal analysis in supplied material; hold/exclude as a fact |

**Text-only slide map:**

| Slide | Role / proposed conclusion | Evidence and caveat | Audience action / visual intent |
|---|---|---|---|
| S-01 | Decision frame: whether to expand by 2026-10-01; no recommendation because no acceptance threshold is supplied | L-01, L-02; their populations and windows differ | Ask the committee to set a threshold and request a harmonized cohort; use separate metric cards, not a connecting trend line |
| S-02 | The sample shows a raw 18% decrease in reported hours, not established causal savings | L-03; unmatched and unequal observation windows | Request comparable windows/control or mark as a descriptive pilot signal; show both raw hours and windows, with a visible caveat |
| S-03 | ARR impact is not supportable from this source pack | L-04 is unsupported; Pilot brief r2 also says no revenue attribution | Hold the USD 400,000 statement pending source and analysis; use an unresolved placeholder, not a positive/negative revenue conclusion |

**Rights/evidence receipt:** internal draft only; use synthetic aggregate text only; no logos, screenshots, customer names, or external sharing. Content support was checked against the supplied text. No slide file/package or adapter was produced, package/structure checks are not applicable, render and visual inspection were not performed by instruction, and accessibility of a rendered artifact is open. There is no deck output hash. No publication or distribution occurred.

**Verdict: READY for the requested text-only pre-build handoff.** No unsafe omission was observed within that packet. Full slide-file creation, package checks, rendering, visual/accessibility acceptance, and recipient approval were intentionally not exercised; this verdict is not a readiness claim for a finished deck.

## Case 4 — Agora: cross-artifact fact register

### Exact prompt

```text
Text-only exercise. Reconcile the following complete synthetic artifact bodies for an internal consistency packet as of 2026-09-23. The audience is the CFO preparing an internal review before possible deck distribution; distribution is not authorized. CFO Mira Sen is the decision owner for the final ask, ARR definition, and use-of-funds; no approved choice or deadline is supplied. Do not decide the raise, edit any artifact, infer source material not attached, or communicate externally. Return a stable-key fact register, assertion map, mismatch/decision-owner list, correction log, exact artifact versions and SHA-256 body hashes, and a bounded consistency receipt.

Canonical hash rule for these synthetic inputs: SHA-256 over each exact body below encoded as UTF-8 without BOM, LF between lines, and no trailing LF. Hash the body text only, not the prompt wrapper.

PitchDeck v4 | as-of 2026-09-18 | internal
S7: Fundraising ask: USD 1,500,000.
S7: Use of funds: Product USD 700,000; Sales USD 500,000; Operations USD 300,000; stated total USD 1,500,000.
S8: ARR: USD 1,200,000 at 2026-08-31; recurring subscription revenue, trailing 12 months; one-time fees excluded. Source: billing export BILL-31, owner CFO Mira Sen.
S9: TAM: USD 4.8 billion. No source or calculation shown.

InvestorMemo v2 | as-of 2026-09-22 | internal
P2: Fundraising ask: USD 1,800,000. Draft; not approved.
P2: Use of funds: Product USD 900,000; Sales USD 600,000; Operations USD 400,000; stated total USD 1,800,000.
P3: ARR: USD 1,200,000 at 2026-08-31; metric definition not stated. Source BILL-31 referenced, but no extract attached.
P4: Runway: 18 months; derived from Model M-3, assumptions unreviewed.

Model M-3 v1 | created 2026-09-20 | scenario, unapproved
Summary!B4: Raise scenario USD 1,800,000.
Summary!B5: Runway 18 months.
Assumptions!A2: Four sales hires start October 2026; salaries estimated, source not attached.
Summary!B9: ARR baseline USD 1,200,000; formula adds USD 90,000 one-time onboarding fees to subscription ARR USD 1,110,000; period 2025-09-01 through 2026-08-31.
Owner: finance analyst N. Cole; CFO Mira Sen approval pending.

Use these exact artifact versions and locators. Treat each as a supplied synthetic source; no workbook formula file or BILL-31 extract is included.
```

### Expected independent rubric

1. Maintain source identities and exact version/hash evidence; track availability, freshness, access, and validation distinctly.
2. Give material facts stable keys and preserve definitions, unit/currency, period, source locator, calculation lineage, claim class, caveat, reuse status, and owner.
3. Map every material assertion to its key and exact location; distinguish an observed artifact statement from a derived arithmetic result, model scenario, or unsupported claim.
4. Classify the ask conflict, use-of-funds arithmetic, ARR definition mismatch, and unsupported TAM; do not let the newer memo automatically win. Preserve the runway as an unreviewed forecast/scenario.
5. Leave correction log empty because edits were not authorized. Name the CFO as the supplied decision owner, retain unresolved status and missing deadline, and do not authorize distribution.
6. Deliver a bounded receipt with no external effects and no false “aligned” result.

### Observed reasoning and output

**Fact register:**

| Key | Definition / value / lineage | Status, caveat, owner, reuse |
|---|---|---|
| AG-ASK | Funding sought, USD: Deck S7 = 1,500,000; Memo P2 = 1,800,000 (draft); Model M-3 Summary!B4 = 1,800,000 (scenario) | Value/approval conflict; model is unapproved and memo draft is not authority. Decision owner CFO Mira Sen; unresolved; do not select by recency or reuse externally |
| AG-UOF | Use-of-funds categories, USD. Deck S7: 700,000 + 500,000 + 300,000 = 1,500,000. Memo P2: 900,000 + 600,000 + 400,000 = 1,900,000, while stated total is 1,800,000 | Deck arithmetic reconciles. Memo has a 100,000 arithmetic discrepancy and different allocations/total; arithmetic derived from supplied components. CFO Mira Sen to resolve; not aligned |
| AG-ARR | Headline USD 1,200,000 at 2026-08-31. Deck S8 says TTM recurring subscriptions excluding one-time fees. Model M-3 Summary!B9 says 1,110,000 subscription ARR + 90,000 one-time onboarding fees. Memo P3 leaves definition unstated and BILL-31 extract is absent | Same label/value does not establish same metric: definition/scope mismatch; BILL-31 source not available for validation. CFO Mira Sen owns definition; unresolved; do not mark aligned |
| AG-TAM | USD 4.8 billion, Deck S9 | Unsupported: no source, calculation, population, or owner supplied. Hold from factual reuse; owner unassigned |
| AG-RUNWAY | 18 months, Memo P4 and Model M-3 Summary!B5; model scenario uses four estimated sales hires starting October 2026 (Assumptions!A2) | Forecast/derived scenario, not observed outcome; assumptions unreviewed and salary source missing. Model owner N. Cole; CFO approval pending; not validated for external reuse |

**Assertion map:** Deck v4 S7 → AG-ASK and AG-UOF; S8 → AG-ARR; S9 → AG-TAM. InvestorMemo v2 P2 → AG-ASK and AG-UOF; P3 → AG-ARR; P4 → AG-RUNWAY. Model M-3 v1 Summary!B4 → AG-ASK; Summary!B5 → AG-RUNWAY; Assumptions!A2 → AG-RUNWAY support; Summary!B9 → AG-ARR. The locations remain distinct even where displayed values match.

**Mismatch and owner list:** (1) Ask amount: USD 1.5m versus USD 1.8m draft/scenario — value and approval-state conflict; CFO Mira Sen; obtain an explicit approved ask. (2) Use of funds: memo components sum to USD 1.9m rather than its USD 1.8m stated total and differ from the deck allocation — arithmetic discrepancy/value conflict; CFO Mira Sen; confirm components and dependent model inputs. (3) ARR: equal headline amounts but deck excludes one-time fees, model includes USD 90k and memo is undefined — definition/scope mismatch; CFO Mira Sen; obtain BILL-31 extract and settle definition. (4) TAM — unsupported claim; source/calculation owner not supplied. (5) Runway — scenario dependent on unreviewed hiring/salary assumptions; analyst N. Cole and CFO approval remain outstanding. No deadline was invented.

**Correction log:** none; no artifact was edited. **Artifact identities and SHA-256:** PitchDeck v4 `c1332c2b0eafa96b828ab0ce0ddde0940d0e63315751b9d9f4eec22782b092a4`; InvestorMemo v2 `b3f4d8875d587be811f043ead3c3071c86b277533ea03a363872b6055b2db4fb`; Model M-3 v1 `91e8d375d6cdbfbbbe40e1f3a8efc9f653099febfe91970f75fd0f0f4d4b5b23`. These are hashes of the supplied synthetic bodies under the prompt's canonical rule.

**Bounded receipt:** 3 synthetic artifacts reviewed; internal-only analysis; source availability is limited to the supplied bodies (BILL-31 extract absent); validation is incomplete; no corrections, external communication, distribution, forecast approval, or account/financial effect. Overall consistency status is `unresolved / not aligned`; next decision owner is CFO Mira Sen for ask, ARR definition, and use-of-funds. No approval date was supplied.

**Verdict: READY within this cross-artifact register boundary.** No unsafe omission was observed. The method does not decide which financing ask, ARR definition, or forecast is correct; it preserves the decision for the named owner. No live source, workbook formula, or distribution state was tested.

## Overall limitations

- The observed packets were authored in this one Codex task; there was no independent second-run or second-agent variance measurement. “Independent” here means the expected rubric and hand-derived oracle were not copied from an observed implementation; it is not independent-model validation.
- All records and runtime/provider responses were supplied synthetic text. No system state changed, and no product, ledger, source, or Git operation was performed.
- READY means the requested bounded text packet respected the named method for the supplied case. It does not qualify all edge cases, real platform behavior, full slide creation/rendering, live transaction recovery, deployment, or business decisions.
