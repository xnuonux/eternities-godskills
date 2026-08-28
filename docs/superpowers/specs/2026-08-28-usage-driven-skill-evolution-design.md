# Usage-driven skill evolution design

## Outcome

Extend the sovereign refinery with a deterministic, provider-neutral evolution boundary. Reviewed development traces may identify recurring failure codes and support a bounded edit proposal. Held-out cases remain sealed until evaluation. The proposal is inert and cannot mutate or activate a live skill.

## Trust model

- Raw transcripts are not accepted by the evolution core. A caller must first produce reviewed, redacted trace records with exact digests.
- Only `development` records can contribute to failure mining or proposal construction.
- Held-out case ids, evidence digests, and the suite digest are forbidden construction inputs.
- The candidate must be evaluated against the same held-out suite as the baseline.
- A passing score is insufficient. Adoption eligibility requires a measured held-out improvement, all critical cases, no critical regression, resolved effects, and a clean leakage audit.
- Even an eligible decision does not adopt. It authorizes a separate explicit adoption boundary only.

## Portable records

The core exposes four pure operations:

1. `mineRecurringFailures` validates reviewed development records and emits stable clusters above a recurrence threshold.
2. `stageEvolutionProposal` binds a target skill, baseline digest, bounded edits, and exact development evidence into an inactive proposal.
3. `auditHeldOutLeakage` proves that construction evidence is disjoint from sealed held-out identities and digests.
4. `decideEvolutionAdoption` combines the existing promotion gate with partition, proposal, and leakage gates and returns `eligible`, `blocked`, or `unverified`. It never writes the target skill.

## Non-goals

This wave does not harvest transcripts, call models, schedule background work, train weights, mutate global instructions, install skills, or claim that deterministic fixtures predict arbitrary production behavior.
