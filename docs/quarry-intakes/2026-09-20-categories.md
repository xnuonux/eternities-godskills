# Category-balanced skill acquisition

Date: 2026-09-20. Status: cold source acquisition and experimental classification
complete for this bounded batch. No first-party skill promotion or universal quality claim.

## Division of work requested by Dom

- Scripts/APIs perform bulk discovery, downloads, byte verification and dedupe.
- Jev performs bounded descriptive classification; uncertain outputs stay unknown.
- GPT Luna at max reasoning can perform scoped intermediate synthesis.
- The main engineer orchestrates, reconciles evidence and makes synthesis and
  quality decisions. No continuous premium-model polling loop is required.
- Godagents owns agent frameworks, agent implementations and harnesses, including
  Hermes, Pi and Claude Code's public surface. Its intake is separate and returns
  an index delta rather than writing the shared index concurrently.

## Observed acquisition

39 candidates were sampled round-robin from the previous public-web discovery,
across 13 planned lanes. This batch was capped at 32 successful shallow clones.
32 repositories were acquired and verified against exact origin, HEAD and clean
checkout. 1,111 tracked SKILL.md files yielded 979 distinct raw Git-blob hashes.
Those hashes have no exact matches in the other registered September intakes;
this does not establish no overlap with every historical corpus or semantic method.
Nine repositories lack a clear GitHub SPDX license hint and remain unreviewed.

| Planned sampling lane | Repositories | SKILL.md files |
| --- | ---: | ---: |
| Marketing/social/search | 3 | 66 |
| Design/UX/data visualization | 3 | 113 |
| Games/game UI | 3 | 75 |
| Science/research | 1 | 7 |
| Data/database/observability | 3 | 222 |
| Legal/compliance | 3 | 293 |
| Finance | 3 | 108 |
| Education | 3 | 177 |
| Writing/media | 2 | 6 |
| Hardware/embedded/devices | 2 | 26 |
| Infrastructure/operations | 2 | 14 |
| Security | 2 | 1 |
| Mobile | 2 | 3 |

Lane names describe selection intent, not verified domain membership. Some
repositories are directories or RFCs with no standard skill entrypoint. Jev's
application-domain labels are a separate experimental record.

Warehouse index advanced from 1,456 to 1,488 records. New clones are under
`D:/03-ARSENAL/warehouse/from-stars`. Existing sources were not deleted or
updated. No third-party installers, hooks or skill scripts were executed.

## Classification design

Deduplicate by raw body SHA-256, then interleave repositories so large collections
do not consume the beginning of the classification budget. Use exact Git blobs,
not mutable working-tree text. Maximum 1,200 bodies and 400 calls; maximum 48KB
per body; three documents per request; one attempt per reserved request. Stop
on authentication/quota errors or three consecutive transport errors.

Pinned model: `jev-1.13.0`. Six nonexclusive activity questions are retained from
the previous batch. A seventh question asks the real application domain of the
method, not the domain of the SKILL.md document itself. Seventeen answer choices
include mixed and unknown. Only valid answers at confidence >=0.9 receive a
provisional label. This threshold is not an accuracy guarantee. Batch isolation,
prompt injection resistance and classification accuracy remain unqualified.

The new intake is discovered automatically by `scripts/query-cold-intakes.mjs`.
It remains metadata-only and offline. Stage labels can be used as opt-in filters;
domain labels are stored in the facet records, not yet a CLI filter. Unknown labels
must not be treated as evidence that a capability is absent.

Observed final run: 960 bodies in 320 successful calls, zero transport errors,
4,390,535 reported input tokens. Nineteen oversized bodies were excluded. The
six activity facets produced 3,138 provisional decisions out of 5,760. Domain
classification yielded 740 provisional labels and 220 unknown/low-confidence
results. Provisional domain counts: legal 208, education 161, design 99, finance
95, games 41, marketing 40, operations 25, data 22, security 14, hardware 13,
agents 7, science 5, software 5, media 4, mobile 1. These are model labels,
not independently verified category membership or correctness measurements.

Thirteen focused search/advisor regression tests pass. Exact record parsing,
same-body facet bindings and no credential-pattern leakage are checked before
publication. No production code or frozen certification artifacts changed in
this batch; the previously reported five full-suite environmental failures
remain outside this source-intake change.

## Evidence and continuation

Project metadata: `data/quarry-intake-2026-09-20-categories/`.
Local raw receipts and provider responses:
`D:/03-ARSENAL/warehouse/_operations/category-skill-intake-2026-09-20/`.

Godagents task: `01a04a0c-ae62-7c83-8f77-9d7b1614f390`.
Luna/max synthesis worker: `01a0c08d-208e-7781-ac12-68fa1f2ef70c`, scoped to one
source-grounded report, no installs, commits or shared-index writes.

The existing finite v1 completion contract remains the release boundary. The
historical 163 conflicting source IDs are not repaired by this additive intake.
New material must still earn first-party synthesis, evaluation and promotion.

## Reviewed synthesis and coordinated agent intake

The bounded [Luna/max synthesis](2026-09-20-category-synthesis.md) inspects six
exact methods from the preceding web intake. Its three ranked proposals cover
robotics verification, effect-separated Terraform testing, and semantic async
React Native testing. Source identities were checked during orchestration;
these are proposals, not implemented or promoted capabilities.

Godagents independently acquired 31 additional agent/harness repositories and
reused 46 pinned existing origins. All 31 new origins, commits and clean
checkouts were independently checked before additive warehouse registration.
The shared index now contains 1,519 entries. Publication receipt:
`D:/03-ARSENAL/warehouse/_operations/agent-harness-intake-2026-09-20/index-publication-receipt.json`.

Its corrected Jev batch processed 77 public README bodies in 39 successful
calls, reporting 373,179 input and 23,679 output tokens. Classification receipt
and facet file hash were inspected; the earlier authentication failure remains
preserved. Facets are mechanically checked but accuracy is not qualified.
Discovery category tags are search buckets, not certified capabilities.
Neither batch grants execution authority to acquired material.

The first implementation follow-up is the cold
[infrastructure evidence candidate](infrastructure-evidence-candidate.md).
It adds a pure report-completeness helper and executable boundary tests, not
Terraform execution or active skill routing. Promotion remains pending.
