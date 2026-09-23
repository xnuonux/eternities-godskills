# Wave 13 product integration review

Review date: 2026-09-23 09:17 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Baseline: `7438872d9ac89762608f4b05ef213298eb4b1a50` (`feat/universal-product-v1`)  
Candidate: 68 skills, release ID `19b799aab5a20db1d9c4c290e1fd89f453d2b2da1a2663115baf083defa3b666`

## Verdict

**Not ready for product integration acceptance.** The molecular specialist and release packaging are coherent, but the farm addition has two blocking integration defects: offline search fails to surface two of its new use cases, and the integrated reference omits a safety boundary present in the source-reviewed artifact. The existing integration tests pass because they check resource wiring and owner relationships, not those behaviors.

This is a verdict on the current worktree candidate only. It is not a finding about the already published or installed 66-skill release, and it does not certify scientific, agronomic, hydrologic, legal, or professional outcomes.

## Snapshot and review boundary

The Git index has no staged paths. I therefore reviewed the named release candidate as the current `HEAD`-to-worktree product delta, not as a Git-staged patch. The product delta comprises the catalog, index, release manifest, corpus-scope note, agricultural owner entrypoint and metadata, its new reference, the interatomic specialist, the staged scientific-surrogate parent, and the wave13 integration test. Other pre-existing worktree artifacts were left outside scope and untouched.

I read the wave13 farm and molecular source reports/receipts, the earlier independent repair review, the exact product diffs and metadata, and the portable product validator/search implementation. I did not run the source-wave validators, upstream scripts, farm or model workflows, an installer, a broad suite, publication, or external calls.

## Blocking findings

### 1. Water-quality and growing-degree-day queries do not discover the farm owner

The agricultural owner now links the new reference from its entrypoint and declares `references/site-data-and-water-triage.md` as a resource ([`SKILL.md:16`](product/skills/agricultural-observation-and-trial/SKILL.md), [`skill.json:23`](product/skills/agricultural-observation-and-trial/skill.json)). The reference covers mapped soil data, seasonal heat units, and farm-water routing. However, the owner's catalog triggers remain the three older phrases at [`skill.json:6-8`](product/skills/agricultural-observation-and-trial/skill.json). Offline search ranks only triggers, ID, summary, category, and task types (`product/lib/product.mjs:148-160`); it does not search the body or resource text.

Read-only search against the candidate returned no `agricultural-observation-and-trial` result in the top 20 for either:

- `triage a farm water quality result from a supplied laboratory report`
- `calculate growing degree days from supplied weather records`

By comparison, `compare mapped soil survey data with site measurements for this field` returns the agricultural owner at rank 1. That route works because `soil` and `field` already appear in the old triggers. The integrated link therefore exists, but two of the extension's intended entry routes are effectively undiscoverable through the product's search interface. Add suitable farm-water / water-quality and heat-unit / growing-degree-day trigger coverage and positive plus negative search cases before accepting this integration.

The current `tests/universal-wave13-integration.test.mjs:9-21` verifies the link, declared resource, selected phrases, and a generic provenance row; it does not call `searchCatalog`. This omission allowed the routing failure through.

### 2. The integrated farm reference drops an explicit hazard-diagnosis boundary

The source-reviewed farm reference artifact has SHA-256 `8f34c4ef56787ab198e486818d6a9e933009f7d859fad828e45d89cdbc46cc2b`. The product copy is `1bd54f25cfa3f475c164e93ac3b6a3ca84b1b6096c67721742d6c09337f92d76`; it is an edited derivative, not a byte-identical integration. The diff removes the source artifact's explicit restriction against using one value to diagnose a hazard, as well as its warning against promising a guaranteed agronomic outcome (`artifacts/universal-product-v1/wave13-farm/proposed-product/skills/agricultural-observation-and-trial/references/site-data-and-water-triage.md:18-22`).

The current water-quality section says not to invent thresholds, treatment instructions, or claim water is safe (`product/skills/agricultural-observation-and-trial/references/site-data-and-water-triage.md:70-74`). That is useful, but it does not state the corresponding limit against diagnosing a hazard from one value. The owner entrypoint's “not treatment or infrastructure authority” wording does not restore that boundary either. Preserve an equivalent explicit limit in the product copy and add a focused assertion. The earlier source-level “ready for owner integration” decision was tied to the reviewed author artifact; it does not by itself approve this materially changed boundary text.

## Checks that passed

- Product validation returned `verified-content`, the requested release ID, and `skillCount: 68`. The catalog contains 68 skills; the farm resource, both specialist entries, and their entrypoints are covered by the release manifest. The two new method entries are present in `product/INDEX.md:116,120`.
- The farm owner metadata carries the declared resource and wave13 source-pattern provenance, including body digests. The molecular `interatomic-model-validation/SKILL.md` is byte-identical to `wave13-molecular/repair-r1` (SHA-256 `fa1e1443277a7ded60d3f4bca483695b53e7c1511d4b5878d296ebeabd878583`). Its product metadata differs from repair-r1 only by `maturity: draft` → `instruction-reviewed`; the separate repair review recommended product integration, while explicitly not claiming behavior or scientific qualification.
- The specialist-parent chain is valid in this candidate: `interatomic-model-validation` specializes `scientific-surrogate-validation`, which specializes `eternities-athena`. Direct offline-search probes ranked the interatomic specialist first for an interatomic-material query and for “Evaluate a machine learning potential for material screening”; the general scientific-surrogate query ranked `scientific-surrogate-validation` first. The specialist body also routes general predictor validation back to its parent and names the adjacent lineage, numerical, trajectory, and appraisal owners.
- The integrated skill and reference files contain no machine-local drive or UNC paths. The optional product CLI imports Node built-ins only; the Markdown pack itself is the baseline interface. A focused clean-room test passed with a copied product pack and an empty `PATH`. That test still uses Node through `process.execPath`; it does not demonstrate CLI use on a machine with no Node runtime.
- The product content is non-executing instruction text. No D-drive warehouse, API, provider, installed skill location, or source repository is required to read the new methods.

## Verification run

| Check | Result |
|---|---|
| `node product/bin/godskills.mjs validate` | Passed; verified release `19b799…a3b666`, 68 skills |
| `node --test tests/universal-wave13-integration.test.mjs tests/universal-wave11-discovery.test.mjs` | Passed; 6 tests, 0 failures |
| `node --test --test-name-pattern="real product CLI works from a copied pack and a minimal environment" tests/universal-product.test.mjs` | Passed; 1 selected test, 0 failures |
| Offline-search probes | Direct molecular and mapped-soil routes passed; farm water-quality and growing-degree-day routes missed the agricultural owner in top 20 |

No broad suite was run. The product tests created and removed their temporary clean-room fixture; this review changed no pre-existing product, test, source, or review file.

## Release boundary

The 68-skill manifest is internally consistent and portable, and the molecular integration is ready within its reviewed scope. Do not accept the overall wave13 product integration until both farm findings above are resolved and the focused tests exercise the repaired routes and boundary. Passing package validation proves byte and metadata consistency, not route completeness or domain performance.
