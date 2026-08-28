# Usage-driven skill evolution design

## Outcome

Extend the sovereign refinery with a deterministic, provider-neutral evolution boundary. Reviewed development traces may identify recurring failure codes and support a bounded edit proposal. Held-out cases remain sealed until evaluation. The proposal is inert and cannot mutate or activate a live skill.

## Trust model

- Raw transcripts are not accepted by the evolution core. A caller must first produce reviewed, redacted trace records with exact digests.
- Only `development` records in a self-digesting manifest can contribute to failure mining or proposal construction. A host-configured Ed25519 review trust root must attest the manifest and review-ledger binding; self-signed caller evidence is rejected.
- Held-out case ids, evidence digests, and the suite digest are forbidden construction inputs.
- The evaluator derives a sealed manifest digest from the held-out case manifest. Baseline, candidate, and leakage-audit receipts bind the proposal, exact artifact digests, evaluator identity, held-out manifest, and exact evaluation bytes, then require signatures under a separately configured evaluator trust root.
- Candidate bytes are compared to baseline bytes by canonical markdown section. The exact changed-section set must equal the bounded edit declarations before a proposal can stage.
- A passing score is insufficient. Adoption eligibility requires a measured held-out improvement, all critical cases, no critical regression, resolved effects, and a clean leakage audit.
- Even an eligible decision does not adopt. It authorizes a separate explicit adoption boundary only.

## Portable records

The core exposes four pure operations:

1. `createDevelopmentManifest` canonicalizes reviewed development records under host-supplied review authority and ledger evidence.
2. `mineRecurringFailures` emits a self-digesting receipt above a recurrence threshold.
3. `configureEvolutionTrust` binds host review and evaluator public keys once. Its staging boundary verifies the review attestation, reconciles the mining receipt, derives baseline and candidate digests from bytes, and requires the actual section diff to equal the bounded code-only edit description.
4. `sealHeldOutManifest` derives the suite digest from the canonical case manifest rather than accepting a claimed digest.
5. `auditHeldOutLeakage` proves manifest-level disjointness and states that it cannot prove what an upstream constructor observed.
6. `createEvaluationReceipt` binds baseline or candidate measurements to the exact proposal, artifact, evaluator, and sealed suite.
7. The configured decision boundary verifies evaluator signatures over the leakage audit and both evaluation receipts, ignores self-declared improvements, derives gain from measured fields, and returns `eligible`, `blocked`, or `unverified`. It never writes the target skill.

## Non-goals

This wave does not harvest transcripts, call models, schedule background work, train weights, mutate global instructions, install skills, or claim that deterministic fixtures predict arbitrary production behavior.
