# Wave 6 independent pre-merge review

Status: one bounded read-only pass; no subagents, provider/account actions, index, branch, or implementation changes.
Base: `488c6b149b6b31e5634bcc6bd6c30fa0b426d32b`.
Final current release: `product/release.json` releaseId `82694be5aefde7e841b1522387524dba9bd3a1c58c48acf05d3cb76fa4a27b7f`, 63 methods.

## Strengths

- The final method is portable and first-party in effect: no executable source, local-path dependency, account action, payment authority, investment recommendation, audit assurance, or forecast guarantee ([SKILL.md](../product/skills/cashflow-forecast-scenario-integrity/SKILL.md):8,12,18-22,26-28,32-40).
- Recognition versus settlement, internal transfers, restricted cash, undrawn credit, partial/out-of-horizon events, currencies, classifications, missing values, and reconciliation exceptions are explicitly bounded.
- The revised scenario rule distinguishes period movement from cumulative closing-balance deltas and requires prose/table agreement (SKILL.md:34). This addresses the preserved consumer sample's W2/W3 narrative error without rewriting its result.
- Catalog discovery is useful and bounded: three cash-timing queries route to the specialist, owner reciprocity is present, and the investment/payment exclusion remains authority/activation `none` (universal-wave6-discovery.test.mjs:6-25).
- Current catalog, index, release, and CORPUS-SCOPE documentation are regenerated and byte-consistent. `verifyProduct(product)` passed: 63 skills, 157 declared files; all release digests match and the release ID recomputes exactly.

## Findings

### Critical

None.

### Important

None.

### Minor

None.

## Independent checks and boundaries

- Frozen arithmetic independently recomputed: base closes `600,1000,250`, base unrestricted/headroom `400,800,50` / `250,650,-100`; downside closes `600,100,-650`, unrestricted/headroom `400,-100,-850` / `250,-250,-1000`; period receipt delta `0,-900,0`; cumulative closing delta `0,-900,-900`.
- Source provenance independently matched manifest, repository commit, Git blob, bytes, and body hash without executing source code. Exact IDs are `GAJETOso/financeskills@862774c15d83f58536d84973b42dbbffda5af7ae:skills/working-capital-analysis/SKILL.md` (r0010; blob `a9ee337086f514ab285d9197da6c0841e3f60811`; body `042580b2f662d89e92271d0a0425c7563466396ba2d036806e114dd0258ab791`), `GAJETOso/financeskills@862774c15d83f58536d84973b42dbbffda5af7ae:skills/budget-forecast/SKILL.md` (r0093; blob `71a2fb9a59bb7980e86523a52c9f18c06aa2a6d1`; body `2702ce53cffde8b4cb2d2de7a9ec8011387456e61ae8c2922ed4e4d592a02862`), and `GAJETOso/financeskills@862774c15d83f58536d84973b42dbbffda5af7ae:skills/treasury-management/SKILL.md` (r0128; blob `f7aa44a218b152a8bb8b090e44225c2d4605947f`; body `333a81985cdf0d35320f022b1e1c45d16340183ecf57ca33070286b1d105dd62`). Intake manifest SHA-256 is `85b09d2799e66ce5ad2f9abd1b1a78e903632d0c9c34ee0735d46e580c102536`.
- Protected paths are unchanged against `f3966698d791c4c3082570c07660ce1a64e239a4`; current Git blobs match that baseline for all six paths.
- Focused tests: `node --test tests/universal-wave5-discovery.test.mjs tests/universal-wave6-discovery.test.mjs tests/universal-product.test.mjs tests/portable-capability-manifest.test.mjs` => 35 passed, 0 failed, 1 conditional skip.
- The retained first consumer result is parent evidence only: 11 pass/1 partial. The changed-task six-check recheck is not an identical replication or causal benefit test. Package validation is not evidence of agent benefit, forecast accuracy, professional certification, or external authority.

## Merge disposition

**Ready to merge as an instruction-reviewed portable package, with the documented evidence boundary preserved.** Do not promote the known consumer result or package tests into an agent-benefit, forecast-accuracy, or professional-certification claim.

## Exact reviewed SHA-256 file hashes

```text
product/skills/cashflow-forecast-scenario-integrity/SKILL.md d2b85835f46ac7aba103a43d5ee6eb9ccfe2970f3d17a690e8e9a01fa655a66e
product/skills/cashflow-forecast-scenario-integrity/skill.json 6792423b54ff667e97bbe3acb6e7825f1c522a37fe9507f29f86fed926dc8bac
product/skills/financial-statement-reconciliation/skill.json b642f8dfe7feca2f4ee412af16fe78f4d546cfe3c00acd2f292cd7c66e14b68f
product/INDEX.md c9e44bc6ba848a3bc0eca49f700e40e6357872b27d61717d8c1c4f8972de95db
product/catalog.json 896e9d73a14d389ad8cb0727fa6c75382eacf2ccf8ef6972624e400e5c18ed3d
product/release.json fc28bc350e5f93ea36a57df3a356163aee3321f807d68ebdf543ae85400508a8
product/CORPUS-SCOPE.md 9c0b06fc238a29955665b9d4e4501276de70ccd85a41d8b7c0420ac7f6277182
tests/universal-wave6-discovery.test.mjs 4caefbf1eebdc2d6962b2f862a588e0e25fa2b560210b2298828d924cbf22d7d
artifacts/universal-product-v1/wave6/cashflow-review.md 988895658056a9084d8039d0d773d083630742cf62b0b76776d0431aaa0f8033
artifacts/universal-product-v1/wave6/source-dispositions.json a777c6b77b90dd3985bd276323afed7e0cd07e227c8c8dfd5f57bbcc130dd609
artifacts/universal-product-v1/wave6/cashflow-exercise/protocol.md 6ef500a4c6fa5f197864942634eb59c7af35ae527c97d888f3d5c9aaf21d161b
```
