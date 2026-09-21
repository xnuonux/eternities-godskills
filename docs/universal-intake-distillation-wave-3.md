# Universal intake distillation, wave 3

Date: 2026-09-21. Verified expansion of the 57-method portable pack to 59 methods,
still 21 primary domains. Maturity remains instruction-reviewed.

## Why these methods

The full newest-intake metadata pass produced research leads, not automatic
skills. Jev was asked four bounded questions about the next gaps: it abstained on
the specialist-versus-extension geospatial choice, favored reviewing real ML and
audio procedures over wrapper descriptions, and proposed a focused geospatial
method. The compact receipt is
`artifacts/universal-product-v1/wave3/jev-triage.json`.

Two Luna max reviewers read four complete source entrypoints each after checking
their frozen raw-byte hashes. The parent independently rechecked all eight source
hashes and byte counts and read both reports before finalizing scope:

- `docs/universal-wave3-geospatial-source-review.md`
- `docs/universal-wave3-experiment-source-review.md`

Source references and scripts were not executed. Metadata license hints are not
legal clearance. The product does not redistribute the eight source bodies.

| New method | Retained procedures | Excluded or narrowed |
| --- | --- | --- |
| `geospatial-coordinate-integrity` | CRS assignment versus transformation, task-specific units, independent controls, traceable coordinate operations, geometry/output checks | Vendor tooling, obligatory project scaffolds, universal projection choice, automatic geometry repair, a general geospatial ML pipeline |
| `experiment-artifact-lineage` | Content-bound cache dependencies, phase ancestry, distinct resume/warm-start, required training state, fit/holdout separation, observed reproducibility levels | Path-existence reuse, a seed as proof, arbitrary checklist scores, mandatory tracking vendor, automatic GPU jobs |

The ArcPy planning source supplied no distinct coordinate procedure beyond the
already-covered context/planning discipline, so it was reviewed but not used as
product provenance. The geospatial ML source contributes coordinate-dependent
feature and stable-identity concepts, not its full modeling workflow. The source
review's proposed combined spatial-leakage title was deliberately narrowed;
split/fit lineage belongs with the new experiment method and scientific review.

The parent added framework-neutral safeguards and checked relevant details against
official [PROJ](https://proj.org/en/stable/faq.html),
[GeoPandas](https://geopandas.org/en/stable/docs/user_guide/projections.html), and
[PyTorch](https://docs.pytorch.org/docs/stable/notes/randomness.html) documentation.
No claim is made that a source checklist alone establishes coordinate accuracy or
bitwise training reproducibility.

Audio/video synchronization was deferred: the initial lead is a launcher shell,
and this wave did not establish a distinct source-backed procedure to promote.

## Software checks

Four new direct/paraphrased task lookup cases failed before the skills existed and
passed after adding the methods. The original cases remain unchanged. Broad-owner
relations expose the new specialists without automatically loading them.

A product build uncovered a real pre-existing portability-checker defect: the
final `s:/` within an HTTPS URL matched the Windows-drive expression. A failing
regression reproduced it. The first fix required a drive-prefix boundary, but an
independent Luna review found URL query/path false positives and punctuation-led
local-path false negatives. Both were reproduced with failing tests. The final
fix excludes bounded HTTP(S) URL tokens from the prose scan and then checks local
paths, including paths adjacent to a Markdown link. Drive, home-directory and
UNC rejection tests remain. This is a portability lint, not a security parser.
No search algorithm,
installer transaction or historical activation ABI was changed.

The full pre-review suite ran 944 tests: 943 passed, zero failed, one existing
Windows file-symlink skip. Final integration and installation checks are recorded
with the release result rather than inferred from this intermediate run.

## Actual instruction exercise

The preregistered protocol, identical task and 26 parent-authored acceptance cases
are under `artifacts/universal-product-v1/wave3/exercise/`. Two isolated Luna max
workers implement an artifact-reuse guard. The baseline is **host-native**, not
raw: the pre-existing global skill catalog remains available. Only the assisted
worker receives the new candidate method, still uninstalled at dispatch.

Frozen candidate entrypoint SHA-256:
`92da8b7ef85c7b308d7e4842e3ef3de02ce4b54061a9603e2338fa6d676682fe`.
Task SHA-256:
`e4fd73459c9b9540c176f71ed8ad5073b0e33b1120ff1c4fd549e132d8fbbb2d`.
Scorer SHA-256:
`d26d5e71c3598340aeb703c1c52042b38566714a1dec17111f223ff3debeed6c`.
Workers started 2026-09-21T11:15:03Z, S then H. No worker receives the scorer or
the other output. The guard processes inert manifests, not actual ML checkpoints.
Consequently its results cannot certify live training resumption.

Both workers completed within the ten-minute limit. The parent inspected the
implementation modules before executing them; neither imports dependencies or
performs external actions. The archived outputs were scored H then S:

| Condition | Independent acceptance cases | Worker-authored checks rerun by parent |
| --- | --- | --- |
| H: host-native | 26/26 | 11/11 |
| S: host-native plus lineage method | 26/26 | 15/15 |

The preregistered cases found no unsafe accepts and both arms accepted all valid
controls. This is a **tie with no demonstrated incremental quality gain** on this
task. The task supplied a detailed contract and the host-native model was already
capable; more varied tasks would be needed to test an advantage. Do not infer one
from the assisted worker writing more of its own tests. Actual token charges were
not exposed. The workers reported shared host TDD guidance; H also reported the
verification skill. That self-report is retained, not represented as a complete
audit of hidden host context.

Both original implementations, local checks, reports and case results are kept.
No losing condition was patched or selectively retried. The new method remains
instruction-reviewed, not performance-qualified. The exercise establishes a
bounded successful use and documents its limits.

## Published and installed result

Implementation and exercise evidence were merged and pushed at
`49638d5db9ce0dae9a400bef50930ed0ba71eb50`. Canonical main was tested again after
the fast-forward: 944 total, 943 passed, zero failed, one legacy platform skip.
The product's exact release ID is
`8de2600c40fab57bfbe8b26b50ca7ccfa3351cda02eaf6e86fe4263dd704bee4`.

All 59 native skill directories and the standalone pack were installed and
independently compared with the release manifest. All 56 unrelated pre-existing
files remained unchanged, checked against both the original snapshot and the
immediate pre-upgrade snapshot. Rollback receipt:
`C:\Users\Dom\.agents\godskills-backups\universal-v1-20260921-r4\install-receipt.json`.
Prior versions remain recoverable; no old backup or unrelated skill was deleted.

A fresh non-forked Luna worker, `01a0c3bb-2e99-7a73-a310-dafbf6e05780`, reported
both new names and their native entrypoint paths from its initial host catalog
without reading files or loading bodies. This confirms observed fresh-worker
catalog visibility only; existing open desktop tasks may cache an older catalog.

The ZIP was built from committed `HEAD:product`, extracted to a fresh directory,
and validated successfully. Archive: `eternities-godskills-8de2600c.zip`, 241,851
bytes, SHA-256
`6f06f0cb77f9eb9fb4a154bf4c22670177626500007ff13a2904562078c2f707`.

The isolated development worktree is retained for the active refinement goal.
This is a finished two-method wave, not completion of all source-body synthesis.
Next work should group and refine the remaining evidence-backed gaps, retaining
this same distinction between metadata coverage and useful tested procedures.
