# Wave 13 farm source review

Status: source review and independent draft authoring complete; ready for
independent review. This wave did not edit product files, and no source
material was installed, activated, or executed.

The initial Git inventory had no tracked modifications. At final inventory,
concurrent changes were present in product/INDEX.md, product/catalog.json,
product/release.json, and tests/universal-wave11-discovery.test.mjs. They were
left untouched and are not part of this wave's changed-file list.

## Review contract

The outcome is a body-level disposition for the eight fixed
farm-soil-crop-planning leads, plus a small portable owner-reference draft only
where distinct source patterns add something to the current owner.

Success evidence is exact source identity at the pinned commit and path, raw
SHA-256 and Git-blob agreement, a complete entrypoint read from the warehouse,
an explicit retained/rejected decision per body, current-owner comparison,
portable review cases, and a bounded validator. Inputs are the fixed family
plan, family packet, Exa source manifest, exact warehouse entrypoints, current
owner instructions, and recorded gap/prior-disposition evidence.

Operations were limited to reading metadata and source bodies, hashing bytes,
checking local Git identities, authoring new wave files, and running the
bounded validator. No farm action, real-data change, external network or paid
call, training, GPU work, product edit, ledger edit, plan or intake edit,
historical-receipt edit, installation, commit, push, branch change, or provider
change occurred.

Positive triggers for the draft are a decision based on mapped soil-survey
data, a supplied weather-based seasonal estimate, or a farm-water question
that first needs evidence routing. Negative triggers include treatment rates,
crop-stage thresholds, equipment-performance findings, dam or drainage design,
water-safety determinations, and live provider lookups. The only dependency is
the user's or an authorized source's data and method; the draft requires no
provider, API, package, machine path, or warehouse at runtime.

Failure handling is to expose missing or conflicting records, stop before a
prescription when local parameters or qualified interpretation are absent,
and keep estimates distinct from observations. Termination is reached when
the evidence category is clear, a supported calculation is traceable or the
missing inputs are named, and the next measurement or qualified review is
bounded.

## Fixed scope and identity

The supplied family-plan digest matches exactly:
4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6.
The family packet assigns farm-soil-crop-planning to
agricultural-observation-and-trial. The eight selected IDs are exactly
r0008,r0037,r0039,r0040,r0041,r0063,r0079,r0083.

Each plan identity resolved to exactly one intake record. The pinned commit and
commit:path blob were checked before reading source text. Then the current
warehouse bytes were hashed and each full entrypoint was read. All eight raw
hashes match the fixed plan and intake body SHA-256; all current Git blobs
match both the manifest and pinned commit:path blob; all three repository HEADs
equal their pinned commits; and all eight source paths were clean. Full details
and input digests are in source-integrity.json.

The earlier exact-identity index had all eight bodies as unreviewed and
unresolved with no bound review evidence. Wave 7 family-body metadata also
marks the selected rows as not body-reviewed. Those exact historical states
are retained as prior evidence, not treated as dispositions.

## Owner comparison and design

The complete current agricultural-observation-and-trial entrypoint already
requires crop, stage, place, season, management, soil and water context; it
separates observations from explanations; checks lab method and units; maps
patterns; checks data quality; calls for locally applicable guidance; favors
small reversible comparisons; and reports uncertainty. The proposed draft
does not repeat that workflow. It adds only three evidence distinctions:

- mapped survey information versus a field or laboratory measurement;
- a calculated seasonal total versus a modeled stage versus an observed stage;
- separate evidence routes for water-system choice, operation, shortage,
  drainage, capture, and quality questions.

The full Prometheus entrypoint and metadata were also reviewed because r0040
was assigned to the soil/crop family by its metadata, while its body concerns
tractor, monitor, guidance-system, and sprayer performance claims. The family
packet places equipment operations under agricultural-observation-and-trial
and eternities-prometheus. Prometheus supports evidence labeling and
calculations over supplied measures, but does not supply an equipment test
protocol. r0040 is rejected for this family and marked for that separate
owner boundary; no performance conclusion is inferred.

## Body dispositions

| ID | Body-level disposition | Decision |
| --- | --- | --- |
| r0008 | Rejected | Generic soil-health claims followed by blank sections; no operational method. |
| r0037 | Rejected | Names garden-layout factors but gives no procedure, measurements, or validation. |
| r0039 | Rejected | Generic water-management claims followed by blank sections. |
| r0040 | Rejected; misfamily | Equipment-claim subject, no test procedure, and no crop/soil/water method. |
| r0041 | Rejected | Routing stub delegates to an unavailable companion and contains no method. |
| r0063 | Pattern reference | Retain water-question categories and evidence confirmation; reject unsupported prescriptions. |
| r0079 | Pattern reference | Retain the mapped-survey versus site-measurement distinction; reject service implementation. |
| r0083 | Pattern reference | Retain traceable inputs and visible data gaps; reject default parameters and formula claims. |

The full retained and rejected mechanisms, plan and intake locators, prior
state, license uncertainty, and remaining boundary are in
source-dispositions.json.

## Conflicts, exclusions, and boundaries

The GDD source calls its calculation a modified-sine method but describes an
arithmetic-mean expression. That internal conflict is left unresolved; neither
formula is promoted. The water source's numerical claims about organic matter,
water holding, irrigation schedules, crop-stage demand, drainage dimensions
and costs, catchment ratios, water-quality thresholds, and treatment tables
are not carried forward.

The soil lookup source is US-specific and service-bound; no network call or
global coverage assumption is introduced. The transition stub's linked
companion is absent, and the equipment-validation source is outside the
selected family. Direct, paraphrase, exclusion, conflict, and boundary cases
are recorded in review-cases.json.

All eight intake rows report MIT License metadata. This is a manifest hint
only; repository license files were not independently checked and legal
clearance is not claimed. The draft is freshly written and contains no
upstream code or copied source text. Rewriting does not imply that upstream
obligations are removed.

## Maturity and remaining boundary

The deliverable is an author-created, instruction-level reference draft with
source identity checks and structural case checks. The agricultural workflow
was not exercised with an agent. No agronomic, hydrologic, public-health,
engineering, equipment-performance, or professional outcome was tested. No
numerical agronomic prescription or performance claim is made. The draft is
not integrated into product/ and is not an independent review or certification.

The exact bounded validation command and observed result are recorded in
author-receipt.json. No product suite or unrelated corpus validator was run.
Two early validator runs exposed newline-sensitive assertions in the
author-created draft-text check; no source identity, disposition, or case
check failed. The check was made whitespace-tolerant, and the final run passed.

## New files

- artifacts/universal-product-v1/wave13-farm/source-integrity.json
- artifacts/universal-product-v1/wave13-farm/source-dispositions.json
- artifacts/universal-product-v1/wave13-farm/review-cases.json
- artifacts/universal-product-v1/wave13-farm/proposed-product/skills/agricultural-observation-and-trial/references/site-data-and-water-triage.md
- artifacts/universal-product-v1/wave13-farm/validate-wave13.mjs
- artifacts/universal-product-v1/wave13-farm/author-report.md
- artifacts/universal-product-v1/wave13-farm/author-receipt.json
