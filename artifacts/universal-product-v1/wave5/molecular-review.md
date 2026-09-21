# Wave 5 molecular source-refinement review

## Decision

One genuinely distinct, portable method is proposed: **molecular observable integrity gating**. It is a domain-specific contract for deciding whether a trajectory-derived observable has valid topology/frame identity, observable-appropriate periodic-boundary semantics, and correlation-aware sampling evidence before it is reported. This is a sidecar draft only; no product owner, catalog, test, or runtime surface is promoted.

The method is distinct from the existing owners because it binds molecular data representation to the estimand. `physics-constrained-numerical-validation` checks units, invariants, limits, numerical convergence, stability, and independent references in general numerical models; it does not define atom/frame identity, wrapped versus unwrapped coordinate semantics, or effective information for a trajectory observable. `eternities-athena` appraises claims, design, bias, uncertainty, and causal or descriptive inference; it does not provide a portable trajectory-integrity gate. The candidate combines those boundaries into one molecular-specific reporting decision without importing an engine, runtime, provider, or fixed threshold.

## Neutral contract

- **Outcome:** a defensible estimate, or an explicit refusal to estimate, for one declared molecular/atomistic observable.
- **Inputs:** topology and trajectory/log records; observable and estimand; ensemble, units, time spacing, boundary conditions, atom/frame selection; declared transient cutoff and uncertainty/sensitivity rule; optional independent trajectories.
- **Operations:** verify stable atom identity, types, finite values, box and time metadata; choose and record the coordinate representation required by the observable; remove or retain rigid-body motion explicitly; exclude and inspect transients; compare block/window scales and correlation-aware uncertainty; compare independent runs where available.
- **Output:** value and units, source span, input/transform receipts, block or effective-information summary, sensitivity result, and one of `supported`, `qualified`, `inconclusive`, or `not-computable`.
- **Effects/dependencies:** read-only analysis of user-supplied records using generic parsing and numerical operations; no source execution, installation, model call, or external mutation.
- **Positive triggers:** reporting or reviewing a structural, thermodynamic, or dynamical observable from a molecular trajectory.
- **Negative triggers:** force-field or ensemble setup, reactive-bond inference without species tracking, biased/free-energy reweighting, electronic post-processing, or hardware/experimental certification.
- **Failure/termination:** stop at the first unresolved identity, unit, box-history, nonstationarity, or sampling-integrity failure; finish with the strongest supported status and the missing evidence, not a guessed value.

## Source ledger and read receipts

Only family-packet items `r0113` and `r0389` were reviewed. This is not a review of all 39 molecular sources. The matching `sources.jsonl` records are line 2539 (`r0113`) and line 2538 (`r0389`); both resolve to the inert local checkout `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\SFETNI__Deep-Matter-Chem-Skills`, commit `2d90941a2985ca177f96e200f0708d31b53dc1f7`.

| item | repo-relative source and exact local path | raw receipt | license / disposition |
|---|---|---|---|
| `r0113` | `skills/atomistic-md/md-equilibration/SKILL.md`; `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\SFETNI__Deep-Matter-Chem-Skills\skills\atomistic-md\md-equilibration\SKILL.md` | 601/601 lines read; 38,159 bytes; body SHA-256 `2f1f734c63685c46aedddf04bdee9e00f800a634abecf679053d73afd619a85b`; Git blob `1fae2464bf6b0de122c89c029dda78417a994880` | Intake says MIT; root `LICENSE` at the same commit is MIT. Pattern reference only: staged equilibration, ensemble caveats, momentum/structural diagnostics. Engine scripts, thresholds, and source prose rejected. |
| `r0389` | `skills/atomistic-md/md-analysis/SKILL.md`; `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\SFETNI__Deep-Matter-Chem-Skills\skills\atomistic-md\md-analysis\SKILL.md` | 1,520/1,520 lines read; 77,837 bytes; body SHA-256 `e68321d54630521c5fc7eebe3706b5194fd3fe8ffbabb135eb19e8f58a5c4169`; Git blob `6fc656d0ad2138fffd89612af1f807061e2d1183` | Intake says MIT; same root `LICENSE` evidence. Pattern reference only: topology/trajectory checks, observable-specific PBC handling, correlated-data uncertainty, provenance. Code, provider commands, fixed thresholds, and source prose rejected. |

The file hashes match the packet `bodySha256` values; Git blob IDs and blob sizes match the intake rows. The two source bodies were read as inert text only. No source helper, command, test, runtime, or model call was executed. The MIT finding is repository-level evidence, not legal clearance; no per-file notice or license compatibility analysis was performed.

## Scientific grounding

The correlation premise is supported by the primary correlated-data error analysis of [Flyvbjerg and Petersen (1989)](https://doi.org/10.1063/1.457480): serial dependence changes the information content of a time series, so raw frame count is not a sufficient uncertainty basis. The [NIST/LiveCoMS best-practices article](https://pmc.ncbi.nlm.nih.gov/articles/PMC6286151/) documents autocorrelation and block approaches for molecular simulation sampling. Official [MDAnalysis wrapping documentation](https://docs.mdanalysis.org/2.7.0/documentation_pages/transformations/wrap.html) and the [NoJump specification](https://mdanalysis.readthedocs.io/en/latest/documentation_pages/transformations/nojump.html) support the boundary that wrapped and sequentially unwrapped views are different analysis inputs, and that unwrapping needs per-frame box information and sequential processing. These sources support the premises, not the draft's efficacy.

## Scenarios and checks

| check | scenario | expected disposition |
|---|---|---|
| Direct | A density or local-geometry estimate has stable atom mapping, finite per-frame boxes, explicit units, a declared transient cutoff, and block/window stability. | `supported` for the stated record; retain the receipts and scope. |
| Direct with limitation | A single trajectory passes the integrity checks but has no independent run. | `qualified`; report within-trajectory evidence and do not imply run-to-run reproducibility. |
| Paraphrase | A displacement estimate arrives in wrapped coordinates. | Require a recorded sequential unwrapping step and per-frame box history; do not copy or prescribe a particular engine command. |
| Exclusion | A source workflow proposes thermostat/barostat values, MLP uncertainty cutoffs, or a code-specific parser. | Exclude from the draft: those are setup, calibration, or provider-specific claims, not universal contract requirements. |
| Boundary/conflict | Image history or units are missing; atom identity changes; the series is nonstationary; or a reactive/biasing regime is present without its own accounting. | `not-computable` or route out; never guess an unwrap, reclassify a transient as production, or apply plain averaging. |

The draft was independently authored from the contract. A phrase-level review found no source code block, source-specific command, fixed source threshold, or fixed provider/runtime requirement carried into it. The draft contains one method only, one `SKILL.md`, and no optional reference file.

## Validation receipt and uncertainty

Observed state: `draft`, instruction-reviewed, source-ledgered, and structurally checked after authoring; runtime evaluation is deferred because no molecular dataset or clean-machine exercise was authorized or available. The remaining technical uncertainty is empirical: no independent test set establishes universal tolerances, window rules, or status thresholds; reactive, biased, nonstationary, and deforming-cell cases need specialist extensions; no agent-behavior improvement or scientific superiority is claimed. The source license is still a legal-review uncertainty, and only the two named family items were inspected.

Changed paths are limited to:

- `artifacts/universal-product-v1/wave5/molecular-review.md`
- `artifacts/universal-product-v1/wave5/molecular-draft/SKILL.md`

No git commit was created.
