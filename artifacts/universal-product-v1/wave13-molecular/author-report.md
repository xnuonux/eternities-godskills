# Wave 13 molecular/materials author report

## Result

Prepared one independently authored, portable draft: `proposed-product/interatomic-model-validation/`. It is a narrow specialization of the existing physics-constrained numerical-validation owner; it is not adopted or installed. The body review found a material gap around learned interatomic-potential evidence: traceable model/reference identity, evaluation partitions aligned to the claimed transfer domain, baseline-versus-adapted retention, and properties that go beyond static fit scores. The existing product has adjacent scientific appraisal, numerical-validation, statistical-diagnostic, invariant, and trajectory-observable owners, but no owner currently joins those checks for a learned-potential claim.

The draft specifies a review contract, evidence record, and routing boundaries only. It adds no training or platform execution workflow, universal numerical cutoff, implementation code, or measured-performance claim. Adoption, installation, and deployment are outside this task. The artifact is ready for independent review.

## Frozen inputs and source review

The assigned set is exactly `r0020,r0022,r0048,r0056,r0077,r0084,r0111,r0113` in family `molecular-materials-modeling`. The fixed plan file digest was verified as `4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6`; the recorded baseline is `7438872d9ac89762608f4b05ef213298eb4b1a50`. Source identities were resolved from the family packet and quarry intake, and bodies only from the pinned local warehouse checkout at commit `2d90941a2985ca177f96e200f0708d31b53dc1f7`.

For seven sources, the complete current Markdown entrypoint was read as inert text. `r0113` reuses the exact complete 601/601-line disposition in wave5 because its current raw SHA-256 and Git blob match that prior receipt; the body classification in wave7 was not treated as body review. For all eight, the current raw SHA-256 matches both fixed-plan and intake body digests, and the current Git blob matches both intake and the pinned commit:path blob. The source checkout HEAD is pinned and the selected paths are clean. No source scripts, code, commands, tests, notebooks, models, or runtimes were executed.

| ID | Body-level disposition | Useful mechanism and owner route | Main exclusion |
|---|---|---|---|
| `r0020` | Pattern reference | Keep lattice-dynamics evidence separate from static fit metrics; route claim appraisal to the draft and Athena. | VASP/QE/Phonopy/DFPT recipes and fixed calculation or acceptance settings. |
| `r0022` | Pattern reference | Compare base and adapted checkpoints on independent target evidence; assess retained domain when still in scope. | MACE-specific fine-tuning, sample heuristics, and fixed error/forgetting limits. |
| `r0048` | Pattern reference; principal owner gap | Separate structure errors, claim-relevant properties, and trajectory/execution evidence; stratify by claimed material regime. | Source thresholds, software recipes, and treating any metric as a universal test. |
| `r0056` | Pattern reference | State model-family/domain assumptions and align holdout groups to the claimed transfer axis. | NequIP training, GPU, architecture, and training-data-size procedures. |
| `r0077` | Pattern reference | Treat surfaces/adsorption as a separate domain with explicit structure and reference identity. | Slab/DFT setup recipes and fixed slab, vacuum, convergence, or model-error values. |
| `r0084` | Rejected | No distinct portable method beyond existing convergence/reference owners was warranted. | The complete Quantum ESPRESSO platform adapter and its input, pseudopotential, and HPC workflow. |
| `r0111` | Rejected | Body review resolves the unclear lead as broad electrochemistry/corrosion and multiphysics work, beyond this narrow gap. | Experimental electrochemistry interpretation and corrosion workflows; no new domain owner is proposed. |
| `r0113` | Pattern reference, exact prior review reused | Preserve the existing molecular-observable-integrity route for equilibration context and trajectory observables. | Duplicate equilibration method, engine schedules/commands, and fixed thresholds. |

## Existing-owner comparison and boundary

Complete current owner skill/metadata files were compared, including Athena's methods reference where relevant:

- `product/skills/eternities-athena/{SKILL.md,skill.json,references/methods.md}` supports evidence-grounded scientific appraisal, study design, and claim/bias reasoning. It does not provide a learned-potential evidence ledger or domain-partition protocol.
- `product/skills/physics-constrained-numerical-validation/{SKILL.md,skill.json}` owns units, numerical invariants, convergence/stability, and independent reference checks. It does not specify checkpoint/label lineage, leakage-resistant split design, target-versus-retained domain assessment, or separate derived-property evaluation for learned potentials.
- `product/skills/molecular-observable-integrity/{SKILL.md,skill.json}` owns atom identity, periodic-coordinate interpretation, equilibration context, trajectory observables, and correlation-aware uncertainty. The draft routes those questions there instead of duplicating them.
- `product/skills/diagnostic-statistical-model-inference/{SKILL.md,skill.json}` and `product/skills/invariant-guard/{SKILL.md,skill.json}` address adjacent statistical diagnostics and invariant enforcement, not the integrated materials-model validation gap.

The resulting draft stays subordinate to the general numerical-validation owner and routes broad claim appraisal, statistical diagnostics, and trajectory interpretation to their existing owners. It does not claim experimental accuracy, universal transfer, physical truth, or deployment certification from agreement with a selected computational reference.

## Provenance and licensing uncertainty

The source intake and pinned repository root identify MIT; the pinned root `LICENSE` blob is recorded in `source-integrity.json`. This is repository-level evidence only. Per-file notices, compatibility across any reuse, and legal clearance were not assessed. The candidate is newly worded and carries no source prose, code, command, configuration, or threshold. Source attribution is retained in the disposition ledger and candidate metadata; no claim is made that repository-level licensing resolves every provenance question.

## Review cases and validation

`cases.md` contains direct and paraphrase routing examples, explicit exclusion, conflicting reference conventions and cutoffs, and boundaries for surface transfer and trajectory observables. They are contract fixtures for reviewers, not executed capability tests.

The bounded structural check is:

```text
node artifacts/universal-product-v1/wave13-molecular/validate-structure.mjs
```

It checks the exact eight IDs and their ordering, fixed plan/baseline/source pins, source raw-hash and Git-blob agreement, recorded complete-read/reuse counts, disposition and owner-map completeness, draft provenance and maturity, required contract sections, case classes, and report coverage. It does not validate scientific performance, legal compatibility, or independent reviewer agreement. Its exact run result is recorded in `author-receipt.json`.

## Artifacts in this assigned folder

- `source-integrity.json` — frozen input and per-source integrity/body-read evidence.
- `source-dispositions.json` — eight body-level retained/rejected mechanism records and owner routes.
- `proposed-product/interatomic-model-validation/SKILL.md` and `skill.json` — portable first-party draft and draft metadata.
- `cases.md` — direct/paraphrase/exclusion/conflict/boundary fixtures.
- `validate-structure.mjs` — bounded structural validator.
- `author-report.md` — this synthesis and review record.
- `author-receipt.json` — exact verification and artifact digest receipt.

No product owner, plan, packet, intake record, historical receipt, global installed skill, Git branch, provider setting, or source repository was modified. No commit, push, installation, external call, training, or GPU work occurred. This handoff stops at the independent-review boundary.
