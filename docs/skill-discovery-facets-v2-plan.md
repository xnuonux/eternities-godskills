# Skill discovery facets: corpus reconciliation and Jev pilot

Date: 2026-09-20. Status: approved-direction research, not a reclassified or
performance-qualified corpus. Existing catalogs, routing and certifications are
unchanged. Jev is a descriptive classifier, never the authority for promotion.

## Objective

Make all recorded source collections, including the newest intake, discoverable
by the desired outcome, relevant method, task stage, output, prerequisites and
exclusions. Preserve broad Godskills as curated workflows; do not convert every
source file into another installed skill.

Success means improved held-out retrieval and downstream task outcomes at a
measured context/latency cost, not merely more labels.

## Reconciliation findings

Eight existing source manifests contain 24,456 rows, 23,410 source IDs and
12,298 distinct recorded body hashes. This includes the original foundation,
waves 2 and 3, and September 7/13/17/20 intakes, including the Jev follow-up.
It does not establish that every file anywhere in the warehouse is represented.
No fresh GitHub star sweep was performed in this batch.

163 source IDs have contradictory recorded hashes. For the inspected adaptyv
specimen, the current working-tree raw and LF-normalized hashes match neither
historical record. Root cause is not established. Therefore 12,298 is a count
of recorded hashes, NOT verified unique present-day skills. Nothing was deleted
or normalized to conceal these conflicts.

Before mass classification: bind source identity to actual git blob/commit and
raw byte digest; retain working-tree variants separately. Preserve historical
receipts. Quarantine unresolved identities from automatic enrichment. Dedupe
identical verified bodies while retaining every source alias and provenance.

## Pilot and negative evidence

Twelve entrypoints from twelve repositories in the newest intake were selected
deterministically (first size-eligible entrypoint per repository, alphabetical
input order). Their exact body hashes were checked against the intake before
dispatch. This sample is deliberately bounded but NOT representative of the
whole corpus, independently labeled, or held out.

Two live passes used pinned `jev-1.13.0` with four typed choices per specimen:
stage, output artifact, dependency specificity, workflow organization.

- Pass 1: 22/48 labels met confidence >=0.8, 40,621 input tokens, zero transport
  errors. The artifact question incorrectly encouraged classification of the
  SKILL.md itself as a workflow instead of its eventual deliverable.
- Pass 2: clarified final deliverables; 20/48 labels met the threshold, 42,157
  input tokens, zero transport errors. Research and review now yielded reports.
  Many dependency and mixed-purpose cases remained uncertain.

These are acceptance counts, not accuracy scores. Confidence is not calibrated.
The lower second-pass acceptance is not a regression in measured accuracy:
there is no independent accuracy evaluation here. Both results are preserved,
not just the cleaner second pass. No whole-corpus inference was launched.

## Revised architecture

1. **Immutable source registry.** Exact bytes, commit/blob, aliases, notices,
   historical and current versions, conflicts and missing-body dispositions.
2. **Nonexclusive descriptive facets.** Atomic yes/no/unknown questions for
   research, planning, implementation, verification, recovery and orchestration;
   separate output-kind facets. Avoid forcing multi-purpose sources into one bin.
3. **Evidence-backed operational constraints.** Required tools, platform,
   effects, prerequisites, exclusions and source review status retain source
   references and deterministic validation. Jev cannot certify these as safe.
4. **Task-to-candidate retrieval.** Combine existing catalog search with facets
   to repair paraphrase recall; load only a bounded shortlist, then exact useful
   sections. Explicit no-skill outcome and fallback remain available.
5. **Curated composition.** Candidate complement/substitute relationships start
   as hypotheses. Only compatible, evaluated methods enter a Godskill or a
   multi-stage plan. Similar labels do not prove semantic equivalence.

## Ordered implementation and gates

### A. Reconcile the corpus

Resolve or explicitly quarantine all 163 conflicting IDs, verify source-byte
availability, preserve snapshots, produce reproducible exact-body groups.
Include newest registered intakes; record any new unindexed acquisitions in a
separate delta. No automatic overwrite of certified historical evidence.

### B. Qualify the atomic classifier

Manually label a stratified development set across old/new, broad/specialized,
short/long and multi-stage skills. Use a separate held-out set not shown during
question revisions. Each decision has source-bound evidence or unknown; never
force a label. Include injected instructions and ambiguous outputs. Store model,
question version, source hash, raw response, usage, latency and disposition.

### C. Enrich incrementally

After B passes predeclared per-facet precision/coverage targets, classify unique
verified bodies once. Cache on content+taxonomy+question+model identity. Use
bounded resumable batches with predispatch reservations; failed/uncertain calls
do not silently retry or become labels. Start with newest intake, then existing
corpus. Never charge for every alias separately.

### D. Prove retrieval value

Compare existing Godskills compiler, lexical baseline, facet-assisted retrieval,
and retrieval plus Jev selection on the same held-out tasks. Measure recall@5,
irrelevant loading, correct abstention, latency, API usage and loaded tokens.
Then compare real task outcomes. Preserve losses as well as wins. Only adopt a
new default when the actual user-facing benefit is established.

No source setup/hooks executed, third-party skills installed, global instructions
changed, or model-routing permissions altered in this research batch.

## Evidence

Committed metadata/results: `data/skill-discovery-facets-2026-09-20/`.
Full local census and source-bearing pilot manifests:
`D:/03-ARSENAL/warehouse/_operations/godskills-facet-census-2026-09-20`,
`godskills-facet-pilot-2026-09-20`, and
`godskills-facet-pilot-v2-2026-09-20` under the same operations directory.
Operational prototypes: `C:/Users/Dom/Desktop/godskills-facet-census.mjs` and
`C:/Users/Dom/Desktop/godskills-facet-pilot.mjs`. These are research scripts,
not supported runtime APIs. They require no installed third-party code.
