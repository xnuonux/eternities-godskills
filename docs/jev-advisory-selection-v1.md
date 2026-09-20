# Jev advisory skill selection: exploratory v1

Status: optional research module, not installed into the runtime router. No
activation, permissions, model changes, or global agent instructions are changed.

## What shipped

`src/jev-advisory-selection.mjs` provides two pure functions:

- `prepareAdvice({task, cards, model, limit?, minimumConfidence?})` creates a
  bounded lexical shortlist and a typed Jev choice request with an explicit
  `none` option. Defaults: five candidates, minimum confidence 0.8. Exact model
  version is required. It performs no I/O.
- `acceptAdvice(request, response)` returns a candidate or a fallback. The
  caller correlates the response with `requestDigest`; this is not a signed
  provider attestation. Request mutation, model mismatch, malformed choice,
  uncertainty, and abstention do not recommend a candidate. Every result has
  `activationAllowed: false`. Existing authority checks remain mandatory.

The digest binds the submitted task, selected candidate metadata, question,
model and threshold. It is an identity suitable for a caller's cache, not an
implemented shared cache. Confidence is provider output, not calibrated accuracy.
Candidate metadata and tasks remain potentially adversarial; the prompt's data
boundary is a mitigation, not a security guarantee. Do not send secrets or
private source text without separate authorization.

## Observed September 20, 2026 pilot

16 author-labeled development cases were saved before live dispatch. All calls
returned the pinned `jev-1.13.0` model. Evidence is under
`data/jev-advisory-selection-v1/`.

| Measure | Observed |
| --- | --- |
| Simple lexical top-one baseline | 10/16 correct |
| Jev advisory result, valid abstentions included | 15/16 correct |
| Suitable candidate in shortlist, or expected abstention | 15/16 |
| Transport errors | 0 |
| Median / mean / maximum call latency | 185 / 196 / 444 ms |
| Reported total input tokens | 12,003 |

At the previously observed $0.042/million input rate, input-only estimated cost
is $0.000504126. This is not an invoiced charge or an account spending cap.

All five deliberately unnecessary-workflow cases were correctly rejected. The
paraphrased continuity task failed because the lexical shortlist omitted
Mnemosyne; Jev's low-confidence result fell back. A downstream selector cannot
repair missing candidates.

These results do **not** compare with the existing Godskills intent compiler,
raw frontier agents, or end-to-end task quality. They are a small, non-independent
development set with several easy category cues. One successful injected-text
case does not establish injection resistance. Do not enable by default on this
evidence alone. The next useful experiment is held-out paraphrase/negative-task
coverage against the existing compiler, including retrieval recall and actual
context/latency savings.

## Reproduce

Offline guard tests:

```powershell
node --test tests/jev-advisory-selection.test.mjs
node scripts/evaluate-jev-advice.mjs --out=D:/path/to/new-dry-run
```

For authorized live calls, supply `TYPESAFE_API_KEY` or `JEV_API_KEY` through the
environment and add `--live`. The output directory must not already exist;
reservations are written before dispatch. Maximum 20 calls, 100KB per request,
15-second timeout, no retries. An interrupted run is not resumed automatically.
Creating a new run directory deliberately permits a new paid run. Evidence
includes exact input identities, provider responses, latency and errors, never
the authentication header. Labels are not sent to Jev.

## Verification and boundaries

Six focused tests pass. Full repository run: 849 tests, 842 passed, five failed,
two skipped. The failures are the same pre-existing external-environment
problems: two Aegis host-policy checks require the absent global AGENTS.md;
Athena's external source hash differs; two continuity certification checks find
stale external bytes. No historical certification was refreshed to hide these.

The implementation is independently written. Design observations came from the
inert Jev intake recorded in `quarry-intakes/2026-09-20-jev.md`: typed bounded
choices, local preselection, explicit abstention and stale-response protection.
No upstream installer, proxy, or permission-changing hook was executed.
