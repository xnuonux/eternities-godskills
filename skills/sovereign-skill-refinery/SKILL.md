---
name: sovereign-skill-refinery
description: Refine multiple candidate skills or a workflow quarry into one provenance-backed, independently written, evaluated capability. Use when asked to synthesize, combine, sovereignize, or measurably improve overlapping agent workflows. Do not use to invoke an existing skill, install one known skill, or merely search a repository warehouse.
---

# Sovereign Skill Refinery

Produce the smallest first-party capability that preserves the strongest verified behavior of its sources and proves any superiority claim.

## Boundaries

- For discovery alone, delegate to `arsenal-repo-miner` and stop after evidence is returned.
- For one settled skill with no source synthesis, use `skill-creator` directly.
- Never execute third-party repository code merely to inspect a candidate.
- Do not copy candidate prose into the output. Record concepts, contracts, evidence, and extraction disposition instead.
- Do not claim legal clearance. Preserve source identity, license class, confidence, and uncertainty.
- Keep every result cold until its promotion receipt says `promoted`. Promotion does not itself authorize global installation.

## Refinery loop

1. Define the requested outcome, success condition, effects, and exclusions. Read [references/contract-template.json](references/contract-template.json) and fill a neutral capability contract before comparing implementations.
2. Search the certified cold index, then inspect exact source files for the smallest useful candidate set. Record every inspected source in the provenance ledger with its digest and one disposition: `independent-implementation`, `pattern-reference`, `rejected`, or `deferred`.
3. Compare candidates by input, operation, output, effects, failure behavior, dependencies, and observable proof. Names and popularity are supporting evidence, never capability equivalence.
4. Design a first-party workflow from the neutral contract. Preserve useful invariants, resolve conflicts explicitly, and move conditional detail into references so the entrypoint stays discriminating and lean.
5. Build through a failing behavioral or structural test. Include direct, paraphrase, exclusion, and conflict cases. Test any executable helper on an isolated fixture and verify the real output.
6. Evaluate the candidate against an executable baseline with `scripts/evaluate-skill.mjs`. A promotion requires every critical case, every policy kind threshold, resolved effects, token-budget compliance, no critical regression, and at least one policy-listed measured improvement.
7. Write the decision receipt. If evidence is incomplete, retain `experimental`, `blocked`, or `unverified`; never round it up to `promoted`. Leave promoted output cold for a separate profile activation step.

## Usage-driven evolution

When the requested refinement is based on prior agent use, treat it as a stricter refinery path:

1. Accept only reviewed, redacted trace records with exact evidence digests. Raw transcripts are upstream material, not refinery inputs.
2. Mine recurring failure codes from a declared `development` partition. Do not let a one-off failure justify a durable skill edit.
3. Bind each proposed edit to a recurring failure and the exact baseline skill digest. Keep the edit set bounded and stage it inactive.
4. Seal held-out identities, evidence digests, and suite digest away from proposal construction. Audit identity, digest, and suite overlap before evaluation.
5. Evaluate baseline and candidate against the same held-out suite. Require measured gain, every critical case, no critical regression, resolved effects, and the normal token and kind gates.
6. Return `eligible`, never `adopted`, when every gate passes. Eligibility only permits a separate explicit adoption action; it does not edit, install, activate, or globally route the skill.

Never schedule self-modification, execute third-party optimization code, or infer permission to harvest private transcripts from a request to improve a skill.

## Required evidence

Return or preserve:

- the neutral contract and exact source ids;
- provenance dispositions and rejected or deferred uncertainty;
- candidate and baseline evaluations;
- token size and declared effects;
- the promotion decision and failed gates;
- verification commands and their observed results.
- for usage-driven work, the partition declaration, leakage audit, staged proposal, and explicit-adoption boundary.

The refinery is successful when another agent can reproduce why the capability was synthesized, what was intentionally excluded, and why its current disposition is warranted.
