# Wave 13 independent source and content review

Review date: 2026-09-23  
Baseline: `7438872d9ac89762608f4b05ef213298eb4b1a50`  
Scope: `wave13-farm/` and `wave13-molecular/`; this review writes only to this sidecar.

## Decisions

| Packet | Decision | Finding |
|---|---|---|
| `wave13-farm` | **READY** for downstream owner-integration review | The reference is portable, useful, distinct from the current agricultural workflow, attribution-traceable, and bounded to supplied evidence. It is not yet discoverable as a product resource. |
| `wave13-molecular` | **NOT READY** | The proposed specialist has a useful materials-specific core, but its routing and relationship to the already released `scientific-surrogate-validation` and `experiment-artifact-lineage` owners are unresolved. |

“Ready” here means the source/content packet can proceed to its next product-owner review. It does not mean either draft is integrated, installed, activated, released, or behavior-qualified.

## Independent identity and read-evidence checks

The fixed family plan matches SHA-256 `4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6`; the worktree HEAD is the recorded baseline. Both packets’ eight selected IDs match the fixed plan and their disposition sets exactly. Each selected ID resolves to one intake record with the same repository, commit, path, body SHA-256, and Git blob.

I independently read the current warehouse bytes, recomputed each raw SHA-256 and Git blob ID, checked each repository HEAD and path-specific status, and resolved each `commit:path` blob. All 16 sources match the plan, intake, author integrity record, and pinned commit; all source paths are clean. The three farm repositories and the molecular repository are at their assigned commits. All 14 author-recorded input-digest checks and all 13 author-declared output hashes also match current bytes.

For farm, I read all eight entrypoints as text; observed byte and line counts are recorded in the receipt. For molecular, the seven reported fresh reads have current line counts equal to the authors’ `linesRead` counts. `r0113` is supported by the earlier `wave5/molecular-review.md` record of 601/601 lines, 38,159 bytes, SHA-256 `2f1f734c63685c46aedddf04bdee9e00f800a634abecf679053d73afd619a85b`, and Git blob `1fae2464bf6b0de122c89c029dda78417a994880`; the current body matches those exact identities. The receipt contains all 16 full warehouse paths, pinned identities, hashes, sizes, and read/reuse evidence.

## Farm reference

The draft adds three concrete distinctions that the installed `agricultural-observation-and-trial` owner does not spell out: mapped soil-survey values versus field/lab measurements; calculated seasonal totals versus modeled and observed crop stages; and routing among six different farm-water decisions. That owner already supplies the general local-context, sample-method, evidence-quality, reversible-trial, and uncertainty workflow, so the reference specializes a real gap rather than replacing it.

The text uses supplied or authorized records, requires traceable methods and parameters, exposes missing or conflicting data, and keeps mapped/model-derived information separate from observations. It carries no treatment rates, universal thresholds, API workflow, provider, package, machine path, or unsupported outcome claim. Water-quality, infrastructure, and irrigation boundaries defer consequential actions to current authoritative or qualified review. The GDD source’s conflicting method description is explicitly preserved as unresolved.

The r0063, r0079, and r0083 patterns are recorded in the disposition ledger; the text is independently worded. Farm license claims remain intake hints only, and legal clearance was not performed. The equipment boundary is also accurately qualified: `farm-equipment-operations` is a family whose current owners are listed, not an installed skill or a validated equipment-test protocol.

One integration task remains: the current agricultural owner’s `skill.json` declares `resources: []`, and its entrypoint does not link this reference. The product README says receiving agents use the entrypoint and declared resources. Before packaging, link and declare the reference and carry its source provenance into the owner metadata. This does not block the content-review decision, but the orphaned file alone will not be found through normal product selection.

## Molecular specialist

The draft is first-party, portable Markdown with no runtime dependency. Its useful specialist content is clear: interatomic-potential assumptions and reference conventions; energy/force/stress evidence; property checks beyond static fit scores; and explicit separation of bulk, surface, and other claimed material regimes. It excludes source-specific training and DFT procedures, universal thresholds, and claims of physical or experimental truth. Its six retained patterns and two rejections broadly match the inspected source sections; `r0113` is correctly routed to the existing molecular-observable owner.

The author’s owner audit missed two current released owners. `product/skills/scientific-surrogate-validation/` is listed in the current `product/INDEX.md`, catalog, and release manifest. It already owns decision-time feature checks, leakage-resistant grouped holdouts, domain coverage, matched baselines, uncertainty calibration, and adaptive-pool accounting. The new draft’s trigger, split-protection workflow, domain claims, and evaluation disposition substantially overlap that method, yet its metadata neither relates nor routes to it. `experiment-artifact-lineage` is also a released owner for checkpoint, data/split, preprocessing, and fixed-artifact lineage; that relationship is absent too. The draft instead declares only `physics-constrained-numerical-validation` as its specialization.

This is a relationship and routing defect, not evidence that the materials-specific method has no value. Before advancing, define a narrow specialist boundary: retain interatomic-specific label/reference consistency, property lanes, and material-domain interpretation; route general surrogate split/leakage/calibration and active-pool questions to `scientific-surrogate-validation`, checkpoint/cache lineage to `experiment-artifact-lineage`, general numerical checks to `physics-constrained-numerical-validation`, broader claim appraisal to Athena, and trajectory observables to `molecular-observable-integrity`. Align `specializes`/`related`, triggers, anti-triggers, and route-boundary text with that decision, then add cases that distinguish the specialist from its general parent. Revisit the author report’s claim that the current-owner comparison was complete.

The molecular repository root `LICENSE` blob matches the pinned MIT license blob recorded by the author. This is repository-level evidence only; per-file notices, compatibility analysis, and legal clearance remain unassessed.

## Probe limits

I inspected six farm cases and seven molecular contract cases, but did not execute them through an agent. I did not run either author validator or any upstream source code. The static portability scan found no machine paths, API endpoints, install steps, or runtime packages in the proposed product files. Author-reported structural-validator passes are recorded as author evidence, not independent test results.

This review establishes identity, recorded complete-read/reuse evidence, and bounded content/ownership judgments. It does not establish agronomic or scientific performance, legal clearance, product discovery after integration, installation, activation, or release readiness. I verified the complete current farm bodies. For molecular, I checked the source bytes and all recorded read counts, reviewed targeted sections supporting the retained mechanisms, and verified the exact prior r0113 review; I did not independently reread every line of the seven long molecular bodies in this pass.
