# Wave 13 split-product independent review

Review date: 2026-09-23 14:23 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Candidate release ID: `29b0c04e8a32bff16fd7d10d22b8748b8f6f53acf3f3470724c5d0203ef19218`  
Git HEAD: `7438872d9ac89762608f4b05ef213298eb4b1a50`  
Runtime: Node `v24.18.0`

## Verdict

**Ready for bounded product release.** The candidate is a self-consistent 68-skill package: the previously reviewed baseline agricultural entrypoint and metadata, search implementation, and README are byte-for-byte identical to HEAD; the experimental agricultural reference and routing metadata are absent from the product manifest; and the two new scientific skills are present with explicit specialist relationships and provenance. The release validator, focused product contract suite, and bounded route smoke all passed their applicable checks.

The farm-water extension remains on hold outside the release. I did not treat farm-water discovery as a required route or as a release blocker. This verdict covers the package, manifest, and checked bundled-search paths only. It does not certify scientific model performance, agronomic performance, universal routing quality, or completion of the source corpus.

## Comparison boundary

I inspected the candidate `product/catalog.json` and `product/release.json`, the baseline farm entrypoint and metadata, `product/lib/product.mjs`, `product/README.md`, the two scientific skill entrypoints and metadata, `product/CORPUS-SCOPE.md`, the explicit farm routing hold, the preserved reviewed reference, and `tests/universal-product.test.mjs`.

At HEAD `7438872d9ac89762608f4b05ef213298eb4b1a50`, the following current bytes match `git show HEAD:<path>` exactly:

| File | SHA-256 | HEAD match |
|---|---|---|
| `product/skills/agricultural-observation-and-trial/SKILL.md` | `dad70e81edda0d52ada7e726b7e19375dc2a1f3251435be295d9a92992304f2d` | yes |
| `product/skills/agricultural-observation-and-trial/skill.json` | `ee6e741e16650be93fcb245c8e2f75edf135d2ea79bdef29dfe184c56cdb933f` | yes |
| `product/lib/product.mjs` | `f5dfed39ab6e9f01fad202aa30aaec0bd228e951a1fd12cdfc93d39c7b935edf` | yes |
| `product/README.md` | `82a3ac75cf302cb5fc4f7a6972a5ba66abce8b227e1ebc55b6b82fd8f5a522a5` | yes |

The candidate catalog, release manifest, and corpus-scope document are working-tree candidate content rather than HEAD-identical files. I reviewed those candidate bytes directly and ran the validator against them. No implementation files were edited during this review.

## Release, farm hold, and content boundary

- The catalog and release both report 68 skills; the release manifest has 177 file entries and release ID `29b0c04e8a32bff16fd7d10d22b8748b8f6f53acf3f3470724c5d0203ef19218`.
- The agricultural skill has only its baseline `SKILL.md` and `skill.json` paths in the release manifest. Its metadata has the baseline three triggers, no water/heat/soil reference resource, and no `queryAnchors`. The `references/site-data-and-water-triage.md` path is absent from the product directory and manifest. The separately preserved reference and `docs/wave13-farm-routing-hold.md` remain outside the product package.
- The README describes Markdown/`INDEX.md` as the baseline interface and Node 24+ search/validation as optional deterministic lexical tooling. The restored implementation has no `queryAnchors` or punctuation-to-phrase search change. Its anti-trigger behavior lowercases and NFKC-normalizes, collapses whitespace, and applies the declared string phrase check; the README accurately says this is limited negative matching, not semantic negation or authorization.
- The hold record explicitly says the farm extension is not part of the portable release, the 66-method baseline agricultural method remains unchanged, and r5's civic false positives plus farm-source/negation false negatives motivated removal of the experimental routing changes. It preserves the reviewed reference rather than deleting it. This matches the current farm product files and manifest.

## Scientific specialists and provenance

- `scientific-surrogate-validation` is present as a science skill specializing `eternities-athena`. Its entrypoint limits the work to validation design/evidence and explicitly does not train models, create labels, recommend deployment, or certify scientific performance. Its metadata retains two pinned pattern-reference records with source identities and notes that source license metadata is not legal clearance.
- `interatomic-model-validation` is present as a science specialist of `scientific-surrogate-validation`; its related owners include experiment lineage, molecular observables, physical/numerical validation, and Athena. Its entrypoint bounds the output to a declared materials use and says static review does not establish physical accuracy, universal transfer, or real-world safety. Metadata retains five pinned pattern-reference records with body hashes plus a primary research reference, and identifies the source procedures/thresholds that were not carried over.
- Both skill metadata files are included in the release inventory and pass product verification. These are provenance and instruction-scope observations, not evidence that a model was trained, simulated, or scientifically qualified.

## Corpus-scope truthfulness

`product/CORPUS-SCOPE.md` describes the current 68-method progression consistently with the catalog: the preceding 66-method pack, the 67th scientific-surrogate method, then the 68th interatomic specialist. It distinguishes source counts and research leads from refined product skills, says the acquired-source backlog remains unfinished, and explicitly states that the farm-water reference is on routing hold and outside this release. It also disclaims scientific-performance qualification and broader completion. I found no claim that the full corpus is incorporated or that either scientific skill establishes performance.

## Verification

- `node product/bin/godskills.mjs validate`: `verified-content`, release ID matches the requested candidate, 68 skills.
- `node --test tests/universal-product.test.mjs`: 20 passed, 0 failed, 1 conditional second-volume test skipped because its opt-in volume environment was not configured. The test `real product CLI works from a copied pack and a minimal environment` passed; it copies the product pack, builds/verifies that copy, then invokes its CLI search with a minimal environment.
- Route smoke through the bundled product CLI returned the expected first result in all three checked routes: baseline agronomic trial → `agricultural-observation-and-trial`; scientific surrogate validation → `scientific-surrogate-validation`; learned interatomic potential assessment → `interatomic-model-validation`. All outputs retained `authority: none` and `activation: none`.
- Farm-water routing was intentionally not probed for pass/fail because the extension is explicitly held. No host-native loader, full corpus audit, broad test suite, scientific experiment, or agronomic workflow was run.

No blocker was found for this bounded package release. The hold record remains the boundary for the separate farm-water integration work.
