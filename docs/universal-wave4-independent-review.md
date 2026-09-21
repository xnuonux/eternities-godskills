# Wave 4 independent bounded review

Date: 2026-09-21

Scope was the current authored worktree state at `96d4e09ce94f6e13ac605d44ab4b0b5a4a42529b`: the refinement-family module/workplan/tests, the structured-output-contracts skill, Hermes and Forge additions, the forward-exercise evidence test/artifacts, the final family index helper, and the two wave requirement documents. Existing frozen ABI files were used only through the focused artifact test; the 410 assignment rows were not semantically reviewed. No network, provider call, subagent, code edit, or git-state edit was used.

## Disposition

No confirmed product-skill, family-accounting, authority-boundary, portability, or coverage-overstatement defect was found within this scope.

### P2 — retained exercise acceptance boundary is ambiguous (not a skill-quality finding)

- `artifacts/universal-product-v1/wave4/exercise/task.md:25-27` requires an abstention `reason` to be a “nonempty string”; it does not say whether whitespace-only text is invalid.
- `artifacts/universal-product-v1/wave4/exercise/score.mjs:29` gives `reason: '  '` an expected status of `invalid` (trim-required semantics).
- `artifacts/universal-product-v1/wave4/exercise/candidate/consumer.mjs:147-150` rejects only zero-length strings, so whitespace-only text returns `unavailable`.
- `artifacts/universal-product-v1/wave4/exercise/result.json:149-151` retains exactly this one failed case: 37/38, `blank abstention`.
- `tests/universal-wave4-exercise-evidence.test.mjs:15-20` freezes the candidate/task/scorer hashes, reruns the original scorer, and requires the retained 37/38 result; the focused run passed this evidence test. No candidate, task, scorer, or result was patched.

Disposition: the scorer’s trim-required expectation is not explicitly supported by the exercised task. “Nonempty” is compatible with the candidate’s positive-length interpretation, so this is an unresolved contract/scorer ambiguity rather than a confirmed worker violation. The later shipped wording in `product/skills/structured-output-contracts/SKILL.md:18-20` now requires each consumer to choose and state positive-length versus normalized-nonblank semantics (`SHA-256 c32d27a924b435be39707394aa312c88f8df0f008d77dd82800d49b9fc4f8508`). That clarification was not part of the frozen exercise snapshot and does not retrofit its result. This exercise has no baseline and supports no superiority claim.

## Verified boundaries

- `src/refinement-families.mjs:39-45` validates packet self-identity and refuses replacement of a different frozen snapshot; `:70-80` rejects duplicate/body/snapshot mismatches, emits explicit `unassigned` rows, and keeps `promotions: 0`.
- `scripts/refinement-family-workplan.mjs:21-22` performs the packet replacement guard before writing. `:39-46` builds the plan/index from the validated summary; the index states metadata-only organization and no automatic promotion.
- The saved aggregate reconciles to `total: 410`, `assigned: 410`, `remaining: 0`, `promotions: 0`; read-only count validation gives `method-candidate: 19`, `owner-extension: 271`, `platform-adapter: 60`, `unclear: 60`.
- The product additions keep permission/effect checks separate from data validation (`structured-output-contracts/SKILL.md:42-49`), require visible unavailable/degraded states (`structured-output-contracts/SKILL.md:51-62`, `eternities-hermes/references/methods.md:15-30`), and keep model feedback from authorizing tools, paid runs, or deployment (`eternities-forge/references/methods.md:13-26`). I found no provider-specific or skill-granted authority in the authored logic.

## Verification receipts

- `node --test tests/refinement-families.test.mjs tests/refinement-family-artifacts.test.mjs tests/universal-discovery-cases.test.mjs tests/universal-wave4-exercise-evidence.test.mjs` — 34 passed, 0 failed.
- `node --check src/refinement-families.mjs` and `node --check scripts/refinement-family-workplan.mjs` — exit 0.
- Read-only aggregate/index assertion — 410/410 assigned, 0 unassigned, 0 promotions; counts 19/271/60/60; index contains the no-promotion boundary.
- `git diff --check` on tracked authored changes — clean.
- The parent reported a later full-suite result of 970 total, 969 pass, 0 fail, and 1 legacy file-symlink skip; this bounded review did not rerun the full suite.

## Parent integration clarification

The opening reference to frozen ABI files being used through focused artifact
tests is imprecise: those tests bind the family and exercise artifacts, not the
historical activation ABI. The parent separately compared all six protected
historical paths against `f3966698d791c4c3082570c07660ce1a64e239a4` and observed
no diff. This note corrects the scope description without expanding the
independent review's claims.
