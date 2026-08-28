# Usage-driven skill evolution design

## Outcome

Extend the sovereign refinery with a deterministic, provider-neutral evolution boundary. Reviewed development traces may identify recurring failure codes and support a bounded edit proposal. Held-out cases remain sealed until evaluation. The proposal is inert and cannot mutate or activate a live skill.

## Trust model

- Raw transcripts are not accepted by the evolution core. A caller must first produce reviewed, redacted trace records with exact digests.
- Only `development` records in a self-digesting manifest can contribute to failure mining or proposal construction. The host supplies the expected manifest and review-ledger digests as trust anchors.
- Held-out case ids, evidence digests, and the suite digest are forbidden construction inputs.
- The evaluator derives a sealed manifest digest from the held-out case manifest. Baseline and candidate receipts bind the proposal, exact artifact digests, evaluator identity, held-out manifest, and exact evaluation bytes.
- A passing score is insufficient. Adoption eligibility requires a measured held-out improvement, all critical cases, no critical regression, resolved effects, and a clean leakage audit.
- Even an eligible decision does not adopt. It authorizes a separate explicit adoption boundary only.

## Portable records

The core exposes four pure operations:

1. `createDevelopmentManifest` canonicalizes reviewed development records under host-supplied review authority and ledger evidence.
2. `mineRecurringFailures` emits a self-digesting receipt above a recurrence threshold.
3. `stageEvolutionProposal` reconciles that receipt to the exact trusted manifest, then binds baseline and candidate artifact digests plus a bounded code-only edit description into an inactive proposal.
4. `sealHeldOutManifest` derives the suite digest from the canonical case manifest rather than accepting a claimed digest.
5. `auditHeldOutLeakage` proves manifest-level disjointness and states that it cannot prove what an upstream constructor observed.
6. `createEvaluationReceipt` binds baseline or candidate measurements to the exact proposal, artifact, evaluator, and sealed suite.
7. `decideEvolutionAdoption` ignores self-declared improvements, derives gain from measured fields, and returns `eligible`, `blocked`, or `unverified`. It never writes the target skill.

## Non-goals

This wave does not harvest transcripts, call models, schedule background work, train weights, mutate global instructions, install skills, or claim that deterministic fixtures predict arbitrary production behavior.
