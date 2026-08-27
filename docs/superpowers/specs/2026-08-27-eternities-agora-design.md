# eternities agora design

date: 2026-08-27

status: approved direction

owner: eternities inc.

## outcome

Create `eternities-agora`, an agent-neutral categorical godskill for
evidence-governed agency and client-service operations. Agora reconciles
prospect assessment, agency and account state, and client deliverable
construction without collapsing their different evidence scopes or expanding
authority.

Agora is one portable capability inside `eternities-skills`. It is not a Codex
workflow, a slash-command suite, a customer relationship management product, or
an autonomous sales system. Any qualifying agent may use it through the
portable routing contract.

## evidence boundary

Agora is synthesized only from the three candidate clusters certified by
`receipts/agency-client-services-clusters-v1.json`:

- `prospect-assessment-depth`;
- `agency-operational-state`;
- `client-deliverable-construction`.

The exact reviewed source ids, review digests, cluster relationships, and
cluster digests remain in `artifacts/corpus/cluster-evidence.jsonl`. Source
repositories remain inert evidence at `D:\03-ARSENAL\warehouse`. No third-party
instruction becomes product authority and no source prose is copied into the
candidate.

The following certified clusters remain outside Agora:

- `business-agreement-drafting-boundary`;
- `regulated-client-onboarding-extraction`;
- `regulated-financial-planning-boundary`;
- `runtime-capability-diagnostics-boundary`.

These exclusions are structural. A future release may reconsider them only
through separate high-stakes or domain-correct designs. Agora cannot silently
absorb them through routing, delegation, composition, or adapter behavior.

## approaches considered

### selected: one categorical godskill with three routes

The three candidate clusters form one coherent client-service lifecycle while
retaining materially different scopes. One entrypoint keeps ordinary discovery
compact and permits a single mission to move through explicit route handoffs.
Each route remains independently selectable and terminates with its own bounded
artifact.

### rejected: three standalone refined skills

Three entrypoints would make each capability narrower, but they would duplicate
shared evidence laws, increase routing-card surface, and force adapters to
compose a routine agency lifecycle from unrelated top-level skills. The route
boundaries already provide the needed separation with less context cost.

### rejected: a complete client-lifecycle monolith

Adding legal drafting, regulated financial planning, identity-document
extraction, external outreach, or runtime administration would create unsafe
authority expansion and an oversized trigger surface. Those domains require
different evidence, risk, and professional-review contracts.

## shared laws

1. Every observed fact retains its source, date when available, and confidence.
   Estimates, heuristics, assumptions, and user-confirmed facts remain distinct.
2. Missing or conflicting evidence remains visible. Agora never improves a
   score, stage, client state, or recommendation by silently dropping a gap.
3. Identity reconciliation is conservative and reversible. Multiple plausible
   clients or prospects require disambiguation before records are combined.
4. One dominant route owns each operation. A mission spanning routes uses an
   explicit handoff artifact rather than recursively invoking Agora.
5. Read authority does not imply write authority. Local write authority does
   not imply external communication, publication, contract acceptance, account
   mutation, or financial commitment.
6. Recommendations trace to verified findings and declared policies. Agora
   does not fabricate prices, legal facts, traffic, revenue, conversion,
   reputation, compliance, or return on investment.
7. Every score discloses its dimensions, weights, evidence coverage, and
   partial-failure behavior. A score is never represented as objective truth.
8. Polished deliverables do not increase evidence confidence. Rendering and
   presentation remain downstream of validated content contracts.
9. Source aliases and slash commands are compatibility evidence only. Canonical
   routing begins from unnamed outcomes and neutral capability requirements.
10. The smallest sufficient route is selected. Routine one-record operations
    do not load the complete operating reference or unrelated route doctrine.

## route: prospect assessment

### intent

Assess a bounded prospect at the evidence depth justified by the request,
available authority, and desired confidence. Preserve rapid screening as a
deliberately shallow alternative to multidimensional assessment.

### inputs

- authorized prospect identity and target scope;
- available local or externally authorized evidence;
- assessment dimensions, weighting policy, and confidence requirement;
- service policy or opportunity taxonomy when recommendations are requested.

### modes

#### rapid screen

Perform one bounded evidence retrieval, score only observable signals, disclose
blind spots, and identify the smallest next checks. This mode cannot imply the
coverage or confidence of a multidimensional assessment.

#### multidimensional assessment

Build one shared target context, evaluate independent dimensions, validate
structured returns, reconcile partial failures, and rank evidence-backed
findings and opportunities. Unavailable dimensions remain gaps and any adjusted
weighting is disclosed.

### output

A prospect assessment contract containing evidence coverage, confidence,
dimension results, weighting, findings, gaps, bounded opportunities, and next
checks. The output does not authorize outreach or commercial commitment.

### handoffs

- current external evidence research may yield to `eternities-oracle`;
- consequential trust or authorization ambiguity may yield to
  `eternities-aegis`;
- verified findings may hand off to `client-deliverables`.

## route: account operations

### intent

Reconstruct agency, portfolio, or individual account state from authorized
evidence without losing stale, partial, duplicate, or unmatched records.

### scopes

#### portfolio pipeline

Discover prospect records, resolve conservative identities, retain partial
composites, classify bounded workflow stages, rank evidence-backed priorities,
and expose portfolio uncertainty.

#### client account

Find and verify records for one client, construct a dated history, preserve
score provenance, identify missing assessments, and recommend the next bounded
account action. Ambiguous identity stops reconciliation pending clarification.

#### operational rollup

Summarize pipeline, commercial, capability, activity, and follow-up indicators
while separating observed facts from estimates. File naming, activity, and
commercial heuristics remain disclosed and cannot be treated as booked revenue
or confirmed engagement.

### output

One scope-specific state contract with represented identities, evidence paths,
dates, stage or status, uncertainty, gaps, attention items, and bounded next
actions. No customer relationship management system or external account is
mutated automatically.

### handoffs

- a portfolio item may narrow to a client-account operation;
- verified account findings may hand off to `client-deliverables`;
- implementation of a persistent dashboard or integration may yield to
  `eternities-forge`, `eternities-architect`, or a future systems capability.

## route: client deliverables

### intent

Transform verified client evidence into either a scoped service proposal or a
validated rendered report without allowing presentation quality to conceal weak
evidence.

### modes

#### service proposal

Reconcile findings, deduplicate needs, map each recommendation to evidence,
apply an approved service and pricing policy, label commercial assumptions,
construct bounded options, and define delivery phases and checkpoints.

#### client report

Reconcile heterogeneous assessment evidence into a bounded report-data
contract, preserve missing dimensions, delegate rendering to an isolated exact
renderer, and verify the resulting document against the data contract.

### output

An editable proposal draft or verified report artifact with source links,
assumptions, missing evidence, scope, and verification evidence. Follow-up
messages may be drafted when requested, but sending, publishing, signing,
accepting, purchasing, or account mutation requires separate matching
authority.

### handoffs

- document-specific rendering yields to an exact installed document skill;
- consequential research yields to `eternities-oracle`;
- multi-stage repository implementation yields to `eternities-forge`;
- legal agreements and regulated advice are refused and remain outside Agora.

## routing contract

The compact routing card uses family `agency-client-services`. It provides:

- `prospect-assessment`;
- `account-operations`;
- `client-deliverables`;
- `evidence-traceability`;
- `client-service-governance`.

The canonical interface is an ordinary desired outcome. Direct,
paraphrased, and contextual examples contain no slash command, skill id, or
required product name. Clearing every `legacyAliases` value must preserve the
exact route receipt.

The card declares only `local-read` and `local-write`. Any external read or
write is a separate delegated operation with matching authority. The candidate
risk class is `moderate`; requests crossing into regulated advice, identity
screening, legal enforceability, or external commitment do not qualify.

Agora may be compatible with Oracle, Aegis, Architect, Forge, and exact
document capabilities. Compatibility does not authorize automatic composition.
The portable router may select Agora only when it is the smallest sufficient
single capability or part of an explicitly compatible composition of at most
three cards.

## portable artifact structure

The candidate contains:

1. `skills/eternities-agora/SKILL.md`, the concise entrypoint and routing law;
2. `skills/eternities-agora/references/operating-system.md`, detailed route
   mechanics, evidence contracts, handoffs, and failure behavior;
3. `skills/eternities-agora/references/capability-contract.json`, the portable
   route, effect, termination, and binding contract;
4. `skills/eternities-agora/references/routing-card.json`, the compact
   agent-native card;
5. `skills/eternities-agora/references/mining-receipt.md`, exact cluster and
   source provenance plus independent synthesis declarations;
6. deterministic evaluation cases and results;
7. a promotion receipt only if every policy gate passes.

No core file depends on Codex identity, model names, one discovery directory,
one tool-call syntax, or one operating system path. Runtime adapters bind
logical capabilities without rewriting the core.

## failure behavior

- missing authority: stop the affected effect and return the missing authority;
- ambiguous identity: preserve candidates and request disambiguation;
- stale or conflicting evidence: retain conflict and lower confidence;
- partial assessment: recalculate only with disclosed coverage and weights;
- missing policy: use placeholders or defer commercial recommendations;
- renderer failure: preserve the validated data contract and return rendering
  evidence without claiming a completed report;
- regulated, legal, or financial intent: refuse Agora routing and identify the
  excluded boundary;
- external communication request: produce a draft only unless matching external
  authority is independently established;
- route collision: select the earliest unresolved evidence or authority boundary
  and emit one explicit handoff.

## termination

Agora terminates when the selected route has produced one evidence-traceable,
scope-bound artifact; every gap, assumption, conflict, score policy, and
performed effect is visible; unsupported actions are refused or handed off;
and no external or regulated operation remains implied.

It does not remain active as a background agency manager, monitor client files,
send communications, or mutate external systems after termination.

## evaluation and promotion

The all-critical evaluation suite must include:

- direct, paraphrased, and contextual cases for all three routes and every mode;
- unnamed-outcome routing and exact alias-removal equality;
- rapid-screen versus multidimensional assessment precedence;
- portfolio, client-account, and operational-rollup scope separation;
- proposal versus report construction separation;
- missing, stale, conflicting, and ambiguous evidence failures;
- exclusions for routine lookup, generic document editing, exact renderer work,
  generic architecture, implementation, and simple account questions;
- conflict cases for legal agreements, financial planning, regulated identity
  screening, unsafe runtime administration, and unauthorized outreach;
- authority and effect cases proving no external write or account mutation;
- exact cluster and review-digest reconciliation;
- source-prose independence and agent-neutrality audits;
- routing-card validation, 5,000-card bounded retrieval, and selected-body-only
  progressive disclosure;
- token measurement at or below the 4,000 estimated-token entrypoint ceiling;
- deterministic artifact and receipt rebuilding.

Promotion requires all critical cases, every promotion-policy threshold,
resolved effects, exact source coverage, no critical regression, and at least
one reproducible improvement over every material source-cluster baseline.
Passing static fixtures does not prove live-model interpretation, commercial
success, renderer correctness, or production reliability.

## integration boundary

Development occurs on `feat/release-five-systems`. No GitHub remote is
configured. This design authorizes local candidate construction, testing,
evaluation, and deterministic receipts only.

It does not authorize publication, push, deployment, global skill activation,
external communication, provider mutation, or changes to existing active
profiles. Any later integration or activation requires fresh full verification,
review, a canonical-main decision, and explicit user authority for the external
or global mutation.

## acceptance criteria

Agora is ready for an integration decision only when:

1. the three selected clusters reconcile exactly to their certified source and
   review digests;
2. the four deferred clusters are absent from the capability contract and
   implementation doctrine;
3. all three routes and seven route scopes or modes remain independently
   selectable and terminate with bounded artifacts;
4. no route expands authority or performs external communication implicitly;
5. the entrypoint is agent-neutral and below 4,000 estimated tokens;
6. the routing card passes unnamed-outcome, alias-removal, authority, effects,
   risk, compatibility, and bounded-disclosure tests;
7. every critical evaluation case passes with no skipped test;
8. the promotion receipt is deterministic and limits its superiority claim to
   measured evidence;
9. the complete repository suite passes with zero failures and zero skips;
10. no global activation, publication, or external mutation has occurred.
