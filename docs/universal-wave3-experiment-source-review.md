# Universal wave 3: experiment artifact lineage source review

Review date: 2026-09-21.  
Worktree: `C:\dev\eternities-godskills\.worktrees\universal-product-v1`.  
Lane: model experiment artifact lineage and reproducibility.  
Review scope: the four exact source records named for this lane, plus the complete local product bodies `product/skills/eternities-athena/SKILL.md` and `product/skills/eternities-hephaestus/SKILL.md`.

## Result

**Retain a dedicated experiment-artifact-lineage method, but keep it narrow and evidence-bound.** It adds value beyond experiment planning and runtime qualification when it owns one question neither route answers operationally:

> Given a requested reuse, resume, or fine-tune action, do the supplied artifacts prove that the proposed operation is the same experiment/phase, or must it become a new lineage?

The method should not become a second experiment planner, a general MLOps orchestrator, a training launcher, or a claim that a run is scientifically valid merely because its files exist. It should return an explicit disposition such as `reuse`, `resume`, `new-run/fine-tune`, or `refuse/unknown`, with the missing or conflicting evidence attached.

The local product overlap is complementary:

- `eternities-athena` appraises design validity, leakage, confounding, uncertainty, and whether a claim matches its evidence. It does not define a content-addressed run identity or checkpoint/cache gate.
- `eternities-hephaestus` requires environment identity for comparable measurements and defines matched acceptance evidence. It does not bind dataset contents, split membership, preprocessing/code, configuration, parent checkpoints, and artifact ancestry into one reuse decision.
- The source `experiment-design` body defines the decision, minimal matrix, baseline inheritance, readouts, and stop rules. That determines what to run; it does not establish whether a prior artifact is the same valid arm.

Therefore the proposed method is a missing bridge between planned experiment arms and qualified measurements. Its contract should consume, and never silently replace, Athena's validity checks and Hephaestus's environment identity.

## Review boundary and verification

The four source entrypoints were treated as inert research material. No source tool, script, installer, provider, API, or web page was run or called. Each declared destination and path was resolved from `data/quarry-intake-2026-09-21-exa/sources.jsonl`; the file bytes and declared byte count were checked; then the complete `SKILL.md` body was read only after the SHA-256 matched `bodySha256`.

The intake fields `reviewStatus: cold-unreviewed`, `sourceKind: exa-jev-proposal`, and each `licenseHint` are metadata. They are not endorsements, quality certification, or licensing clearance. The source bodies also point to companion references/templates that were not needed for this bounded body review; those pointers are not treated as verified evidence.

## Exact source ledger

All four rows existed at the declared destination, had the declared byte count, and matched the declared raw-byte SHA-256.

| Exact `sourceId` | Resolved destination + path | Bytes | `bodySha256` | Intake license hint |
| --- | --- | ---: | --- | --- |
| `muend/geoai-skills@096e5d4e6825a128e376b017783ee4c8c7323f9b:skills/ml-experiment-standards/SKILL.md` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\muend__geoai-skills\skills\ml-experiment-standards\SKILL.md` | 6320 | `ee9407d47e45846b7ed275d7e39b69539397ed49bd8ac59537c8312f7eb6333f` | `MIT` (`MIT License`) |
| `kjuhwa/skills-hub@b8e7275ea024cc3f9d8551b41aa9ebf89b464cd1:skills/ml-ops/sequential-two-phase-training-orchestrator/SKILL.md` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\kjuhwa__skills-hub\skills\ml-ops\sequential-two-phase-training-orchestrator\SKILL.md` | 4056 | `f471eed818d2d6f3a5179f13caa715191dbd0938ab97b3614f2dacec850cffa5` | `MIT` (`MIT License`) |
| `uchicago-dsi/ai-sci-skills@a83a035de3138276d0254b7c0bfd38136a32b634:skills/experiment-design/SKILL.md` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\uchicago-dsi__ai-sci-skills\skills\experiment-design\SKILL.md` | 3071 | `ee76773a102bd94e5b8c189b711e4730cf2cff087ea856fa50fbcdc5610d75b2` | `MIT` (`MIT License`) |
| `baratadiego/ecological-agent-skills@db8917a13c7655dcbae2644abcdb14c992f69ec4:skills/reproducible-ecology-pipeline/SKILL.md` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\baratadiego__ecological-agent-skills\skills\reproducible-ecology-pipeline\SKILL.md` | 5763 | `ed7b3b4fbf5391e0f1d65c44a7dcfca685eab57502b315b6b86d199ec0335c06` | `GPL-3.0` (`GNU General Public License v3.0`) |

The `kjuhwa` body has a provenance inconsistency worth preserving in the ledger: its frontmatter says it was extracted from `shiyu-coder/Kronos.git` at source commit `67b630e67f6a18c9e9be918d9b4337c960db1e9a`, while the intake identity is `kjuhwa/skills-hub@b8e7275ea024cc3f9d8551b41aa9ebf89b464cd1`. That does not by itself decide whether the procedure is useful, but it prevents treating the frontmatter as a verified origin record.

## Source-by-source appraisal

### 1. `muend/geoai-skills`: `ml-experiment-standards`

**Useful concrete procedures**

- Make the prediction target and decision use explicit; establish a simple baseline before a more complex model.
- At every split, answer whether training contains indirect information about a test sample; fit scalers, encoders, and imputers on train only; compute target-derived features out-of-fold.
- Match split strategy to independent, temporal, spatial, or grouped units and report metric rationale plus uncertainty rather than a single point estimate.
- Keep configuration outside hard-coded training logic, set and record seeds, pin the environment, and write a run metadata record containing configuration and metrics.
- Preserve a pipeline context from data source through cleaning, features/versioning, training, evaluation, deployment mode, and monitoring. Reproduce from a clean environment and compare against a baseline across folds or seeds.

**Questionable or incomplete assumptions for lineage**

- “Every ML job” and “EDA comes first” are broader than the lineage need. They are useful defaults for predictive work, not a universal gate for every deterministic transformation, debugging fixture, or non-predictive analysis.
- The proposed `run_meta.json` records config and metrics but does not require dataset content hashes, exact split membership, preprocessing identity, code revision/tree hash, parent checkpoint, optimizer/scheduler state, environment/hardware identity, or artifact hashes.
- `random.seed`, NumPy/PyTorch seeds, and `pip freeze` do not alone establish deterministic execution across data-loader order, GPU kernels, drivers, hardware, package resolution, or runtime settings.
- “Reproduce from a clean environment” lacks an equivalence rule: bitwise identity, metric tolerance, ranking stability, and decision-level agreement are different claims.
- The body relies on external companion references for spatial CV and authoritative version-sensitive APIs; those references were not part of this source-body evidence.

**What to generalize**

Retain the leakage audit, train-only fitting rule, split rationale, uncertainty, baseline comparison, and deployment caveat. Generalize the reproducibility skeleton into a canonical run manifest that binds immutable inputs and parent artifacts to the output. Make deterministic execution and comparison an evidence level, not a promise implied by a seed or a JSON file.

### 2. `kjuhwa/skills-hub`: `sequential-two-phase-training-orchestrator`

**Useful concrete procedures**

- Encode phase order in a callable orchestrator so the invariant “phase N precedes phase N+1” is executable rather than only documented.
- Give each phase its own logger and seed, require the prior phase's artifact before starting the next phase, short-circuit on failure, and manage distributed initialization/teardown once for the whole pipeline.
- Keep explicit phase-selection and skip controls, and report total wall time. The dependency guard is a useful starting point for artifact ancestry.

**Questionable or unsafe assumptions for lineage**

- `os.path.exists(best_model_path)` is only an existence check. With `skip_existing`, a stale, partial, incompatible, or differently produced checkpoint can be silently accepted.
- The phase-2 guard checks only that a tokenizer path exists; it does not verify tokenizer/model revision, dataset and split identity, preprocessing, configuration, code, environment, completion status, or the parent phase's manifest.
- The body treats skipping an existing phase, resuming an interrupted phase, and starting fine-tuning from weights as adjacent operations, but they have different lineage semantics and required state.
- A path-based flag can make a changed experiment appear unchanged. It also provides no cache invalidation rule when upstream data, labels, split, transform, or code changes.
- The frontmatter's extracted-source metadata conflicts with the intake source identity as recorded above; the procedure therefore needs an independent provenance ledger before reuse.

**What to generalize**

Retain the ordered phase graph, explicit dependency guard, and failure short-circuit. Replace path existence with a manifest and content-hash compatibility check. Require a completed, compatible parent artifact for reuse. Define `resume` as continuation from a checkpoint that includes the state needed to continue the same run; define fine-tuning or changed-input reuse as a new run with a parent pointer. Never let `skip_existing` silently convert an unknown artifact into a valid input.

### 3. `uchicago-dsi/ai-sci-skills`: `experiment-design`

**Useful concrete procedures**

- Start from the decision, identify live hypotheses, and design the smallest matrix that can separate them.
- Keep the nearest valid baseline, freeze everything not under test, declare readouts and predicted outcomes, and make stop/follow-up rules hypothesis-scoped.
- Preserve baseline inheritance: if a candidate fails, the unchanged successful parent remains active; a successor must beat it on the same decision readouts.
- Include at least one readout tied to the real success criterion and state what is deliberately not being run.

**Questionable or incomplete assumptions for lineage**

- “Freeze everything not under test” is a planning instruction, not a verifiable identity record. It does not say how to prove that the dataset, split, code, preprocessing, configuration, environment, or baseline bytes remained frozen.
- Baseline inheritance is decision-useful but does not establish immutable baseline artifacts, parent/child run IDs, or exact candidate deltas.
- The body contains no resume, cache invalidation, checkpoint completeness, heldout-access, or reproducibility-claim procedure.

**What to generalize**

Keep the decision-first matrix and baseline/stop semantics. Add a lineage manifest to each arm so “frozen” means hash-checked identity, not an intention. The lineage method should link each artifact to the experiment arm and readout without duplicating the matrix-design logic.

### 4. `baratadiego/ecological-agent-skills`: `reproducible-ecology-pipeline`

**Useful concrete procedures**

- Create a parameter manifest, decision log, software-environment record, data-provenance record, and file manifest.
- Preserve raw inputs, record dataset source/version/access/license metadata, checksum inputs and intermediate outputs, document seeds and parameters, and version or hash derived artifacts.
- Re-run from raw data before reporting, cross-check reported numbers against manifests and outputs, and verify that figures can be regenerated from code.
- Treat missing provenance or incomplete parameters as a reason to halt finalization, rather than filling gaps from memory.

**Questionable or incomplete assumptions for a universal method**

- The ecology-specific directory and named tools (`renv`, `targets`, DVC, MLflow, Zenodo/OSF) should not become mandatory product dependencies or provider requirements.
- Listing MD5 alongside SHA-256 is not a useful default for new identity gates; a neutral method should require a collision-resistant content hash and record the algorithm.
- One fixed seed, `pip freeze`/`conda list`, and an OS/Python version do not fully capture parallel/GPU randomness, drivers, hardware, package resolution, or runtime flags.
- A binary “7/9 PASS” threshold is arbitrary for lineage: a missing split manifest or heldout boundary can be critical even when many low-risk checklist items pass.
- “Scripts run end-to-end without manual intervention” and mandatory external archiving are not universal acceptance criteria. Approval steps, inaccessible data, or local retention policies can be legitimate; they must be recorded as boundaries rather than silently omitted.
- “Final outputs match” needs a declared comparison mode and tolerance. Bitwise identity is stronger than numerical agreement, which is stronger than agreement on a decision or ranking.
- A file manifest alone does not capture code identity, exact split membership, checkpoint ancestry, optimizer state, or whether the heldout set was accessed during development.

**What to generalize**

Retain the provenance/parameter/decision/file-manifest pattern, raw-data immutability, and pre-report re-execution. Make it domain-neutral, use critical predicates rather than an arbitrary score, and add dataset/split/code/config/checkpoint identity plus explicit reproducibility levels. External archival and workflow managers remain optional adapters.

## Overlap and missing coverage

### Already covered or safely reusable

| Existing route or source | Useful overlap | Do not duplicate in the lineage method |
| --- | --- | --- |
| `product/skills/eternities-athena/SKILL.md` | Claim/design matching, leakage and confounding, missingness, uncertainty, calibrated supported/qualified/unknown conclusions | Scientific validity appraisal, causal identification, or metric interpretation as if an artifact hash proves them |
| `product/skills/eternities-hephaestus/SKILL.md` | Environment identity, comparable measurement conditions, matched acceptance evidence, rejection of unknown hard predicates | General runtime/model/hardware qualification and deployment recommendation |
| `experiment-design` source body | Decision-first experiment matrix, nearest baseline, arm delta, stop rule, baseline inheritance | Hypothesis matrix construction and broad experiment planning |
| `ml-experiment-standards` source body | Split/leakage audit, train-only preprocessing, uncertainty, baseline, clean-environment check | A universal EDA or metric curriculum; the method should consume these checks as evidence |
| `reproducible-ecology-pipeline` source body | Provenance, parameter manifest, decision log, file checksums, rerun audit | Ecology-specific tools, external archive requirements, and arbitrary checklist scoring |
| `sequential-two-phase-training-orchestrator` source body | Ordered phase dependencies and failure short-circuit | Training launch, DDP lifecycle, or path-based skip behavior |

### Missing contract that justifies a dedicated method

- A canonical, content-addressed **run identity** that binds target/decision, dataset versions and content hashes, exact split/group/time membership, preprocessing/feature identity, code revision, config/hyperparameter identity, model revision/base checkpoint, environment/runtime/hardware, and randomness/state.
- A typed **artifact manifest** with artifact kind, content hash, producer run/phase, parent artifact(s), completion status, schema/version, and metrics/readouts. File existence is never sufficient evidence.
- Explicit **resume versus fine-tune versus reuse** semantics. A true resume needs the continuation state (at least checkpoint, optimizer/scheduler/global step, and required RNG/data-order state) and an unchanged experiment identity. Intentional weight inheritance after a data, target, split, code, or configuration change is a new run/fine-tune with a parent pointer.
- **Cache invalidation** across dataset content, split assignment, labels, preprocessing code/config, feature parameters, model revision, and upstream artifacts. A cache whose manifest is absent or mismatched is `unknown/refuse`, not “probably reusable.”
- A protected **heldout boundary**: exact heldout membership or group/time rule, no development-time use, and a recorded leakage audit. Any overlap or target-derived feature fitted with heldout information invalidates the affected claim.
- **Reproducibility claim levels** and comparison rules: for example, rerunnable from immutable inputs; numerically equivalent within declared tolerances; decision-equivalent; or bitwise identical. The report must not promote a lower level to a stronger one.
- **Failure and refusal states** that preserve the attempted lineage and evidence gap instead of overwriting the parent or silently selecting another checkpoint.

## Proposed neutral procedure

This is the smallest useful procedure to add. It is runtime- and provider-neutral; MLflow, DVC, Git, a local JSON file, or another store may implement the records, but none is mandatory.

1. **Declare the requested action and decision.** Record `action` (`reuse`, `resume`, `fine-tune`, or `new-run`), experiment/arm ID, target, success readout, and the baseline or parent run.
2. **Build a canonical run manifest.** Include `run_id`, phase and status; dataset source/version/content hashes; exact split membership or deterministic split rule plus groups/time; preprocessing and feature code/config hashes; code revision; model revision and base-checkpoint hash; hyperparameters; environment/runtime/hardware identity; seed plus required RNG/data-order state; and declared outputs/readouts. Keep timestamps and human notes separate from the identity hash when they are not inputs to computation.
3. **Verify every referenced artifact.** Require the expected bytes/hash, manifest schema, producer status, parent links, and compatibility fields. Check the heldout boundary and leakage audit before accepting a derived artifact. A present path without a matching manifest is `unknown`.
4. **Apply the action gate.**
   - `resume` only when the canonical experiment identity, phase, inputs, code/config, environment requirements, and parent lineage are unchanged, the run is incomplete/paused, and the checkpoint contains continuation state rather than weights alone.
   - `reuse` only when the cached artifact is complete and its manifest matches every dependency required by the consumer. Do not reuse solely because a `best_model` or feature path exists.
   - `fine-tune` or `new-run` when intentional inheritance occurs after any relevant data, labels, split, target, preprocessing, code, config, model-base, or schedule change. Mint a new run ID and retain the parent pointer; never relabel it as a resume.
5. **Record the disposition and outputs.** Write the manifest, artifact hashes, metrics with uncertainty, leakage/split result, stop/failure reason, and any rejected candidate. Preserve the parent and heldout data unchanged.
6. **Make the claim level explicit.** If a clean re-execution is performed, compare using a declared bitwise, numeric-tolerance, ranking, or decision-equivalence rule. If environment or input evidence is missing, report `qualified` or `unknown` rather than “reproduced.”

## Failure cases and required dispositions

| Failure case | Required disposition |
| --- | --- |
| Checkpoint/cache path exists but manifest is missing | `unknown/refuse`; do not skip, resume, or report reuse |
| Hash, byte count, schema, or parent link mismatches | Reject the artifact; preserve the mismatch and do not overwrite the known-good parent |
| Dataset contents, labels, preprocessing, split membership, group/time rule, code, or config changed | New lineage; `fine-tune` only if the change is intentional and documented, never `resume` |
| Weights-only checkpoint supplied for an interrupted training job | Cannot prove resume; treat as a new fine-tune/run unless the experiment explicitly defines weights-only continuation as a different action |
| Phase-N parent is missing, incomplete, or identity-incompatible | Block phase N+1; do not infer readiness from a path or filename |
| Heldout overlap, target-derived heldout information, or post-split preprocessing leakage | Reject/invalidate the affected experiment claim and retain the audit evidence |
| Environment, driver, runtime, precision, or hardware identity is missing or drifted | Allow only a qualified comparison if the declared decision tolerates it; otherwise `unknown/refuse` |
| Re-execution differs beyond the declared tolerance or cannot be compared | Report the failed reproducibility level; do not claim replication |
| Metric uplift is within uncertainty or the baseline is not comparable | Report no clear difference; keep the valid baseline active |

## Acceptance disposition

The sources justify a neutral lineage method only after the above scope is enforced. The strongest retained mechanisms are: decision-first planning and baseline inheritance; leakage-aware splits and uncertainty; explicit phase dependencies; and provenance manifests with re-execution. The mechanisms to reject as universal rules are existence-only checkpoint reuse, fixed-seed sufficiency, unqualified “final outputs match,” arbitrary checklist thresholds, mandatory vendor/archive choices, and any metadata-based quality or licensing inference.

Recommended acceptance fixtures for the eventual method are exactly: valid reuse, incomplete evidence, changed split, missing resume state, and heldout leakage. A candidate that cannot distinguish those cases adds a title and a path, not a reliable lineage capability.

