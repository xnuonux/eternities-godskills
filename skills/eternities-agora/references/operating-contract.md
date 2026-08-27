# Agora operating contract

Use this reference when an operation is consequential, spans more than one scope, reconciles identity, computes scores, applies commercial policy, renders a document, or requires a specialist handoff.

## evidence model

Every claim is one of: observed fact, user-confirmed fact, derived value, estimate, heuristic, assumption, recommendation, or unresolved conflict. Preserve the source locator, observation date when available, confidence, and transformation for every nontrivial claim. Never let a derived artifact silently replace its inputs.

Evidence coverage is the number and relevance of supported dimensions, not the polish of the output. Stale, unavailable, malformed, or contradictory evidence stays visible. If a dimension fails, either keep its weight as an explicit uncovered gap or recompute with a disclosed policy. Never silently redistribute weight.

## identity reconciliation

Normalize reversible matching fields, retain original values, and compare independent evidence such as stable ids, domains, names, locations, and dated history. Merge only when the identity policy is satisfied. Otherwise preserve all candidates, record the collision, and request the smallest disambiguating fact. Never infer regulated identity status.

## route contracts

### prospect assessment

Inputs: authorized target, target scope, available evidence, dimensions, weighting policy, and confidence requirement.

Rapid screen performs one bounded retrieval or evidence pass, scores observable signals only, reports blind spots, and identifies next checks. Multidimensional assessment creates a shared target context, evaluates independent dimensions, validates structured returns, reconciles partial failure, and ranks supported opportunities.

Output fields: target identity, mode, evidence inventory, dimensions, weights, coverage, findings, confidence, conflicts, gaps, bounded opportunities, and next checks. No outreach authority is implied.

### account operations

Inputs: authorized record roots, requested scope, identity policy, stage or status policy, date boundary, and requested indicators.

Portfolio pipeline preserves unmatched and partial records, applies bounded stages, and ranks only under a declared policy. Client account produces one dated history with score provenance and missing assessments; ambiguity stops the merge. Operational rollup labels observed indicators, estimates, file or activity heuristics, commercial assumptions, and stale dates separately.

Output fields: scope, represented identities, evidence paths, dates, stage or status, indicators, uncertainty, gaps, attention items, and bounded next actions. No external customer system is mutated.

### client deliverables

Inputs: verified findings, target audience, desired artifact, approved service and pricing policy when relevant, rendering requirements, and output authority.

Service proposal deduplicates needs, maps every recommendation to findings, labels assumptions and placeholders, constructs bounded options, and states phases and checkpoints. Client report constructs a report-data contract, preserves missing dimensions, delegates exact rendering, and verifies the rendered artifact against that contract.

Proposal fields: client identity, findings, evidence links, needs, recommendations, approved services, assumptions, options, price policy status, phases, checkpoints, exclusions, and editable draft status.

Report-data fields: client identity, reporting period, sections, metrics, evidence links, missing dimensions, confidence, tables or figures, renderer contract, and acceptance checks.

## state and scoring contracts

A state contract records schema version, scope, represented entities, evidence inventory, as-of date, policy identifiers, observed state, derived state, assumptions, conflicts, gaps, performed effects, next actions, and handoff status.

A score records dimension id, observable inputs, normalization, weight, contribution, confidence, coverage, failure status, and policy version. The aggregate records the original and effective denominator plus any weight adjustment. A missing score is never zero unless the policy says so explicitly.

## handoff artifacts

Each handoff contains the owning route, completed artifact, source inventory, unresolved facts, assumptions, decisions already made, effects already performed, requested specialist outcome, authority available, authority missing, and acceptance conditions.

- research handoff: exact unknowns and freshness requirements;
- authority handoff: proposed effect, target, consequence, reversibility, and evidence;
- implementation handoff: settled behavior, interfaces, constraints, and verification;
- rendering handoff: validated data contract, format, layout constraints, and visual acceptance checks.

The receiving capability is not authorized merely because it is named. Its own trigger and authority contract must pass.

## failure behavior

- missing authority: stop the affected effect and return the missing authority;
- ambiguous identity: preserve candidates and request disambiguation;
- stale or conflicting evidence: retain the conflict and lower confidence;
- partial assessment: preserve coverage and use only disclosed weighting behavior;
- missing commercial policy: use labeled placeholders or defer the recommendation;
- renderer failure: preserve the data contract and return renderer evidence without claiming completion;
- route collision: finish at the earliest unresolved evidence or authority boundary and emit one handoff;
- legal, financial, regulated identity, runtime administration, or unauthorized external intent: refuse this capability and name the excluded boundary.

## acceptance checklist

- exactly one route and one scope or mode own the artifact;
- source, date, confidence, and claim class survive transformation;
- identity merges are supported or remain unresolved;
- scores expose dimensions, weights, coverage, and failures;
- recommendations trace to findings and approved policy;
- local and external effects are distinguished;
- handoffs state requested outcome, authority, and acceptance;
- rendered output is not treated as evidence of content correctness;
- termination leaves no background loop, implied commitment, or recursive Agora call.
