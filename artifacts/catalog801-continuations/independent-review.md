**Findings**

**Important: unavailable receipts skip provider/model binding.**  
`src/catalog-skill-classification.mjs:42-46` validates the request digest and snapshot, then returns `jev-unavailable` labels before the provider and returned-model checks at `:48`. A receipt with `status:'unavailable'`, `provider:'Foreign'`, or a mismatched `returned_model` is therefore accepted and changes body/input status accounting. This conflicts with the requirement to validate inner provider binding and reject invalid evidence.

Reproduction using the existing fixture at `tests/catalog-continuation-integrity.test.mjs:62-64`: additionally set `f.raw.provider='Foreign'` or `f.raw.returned_model='wrong'`. `loadCatalogWithContinuations` still succeeds because the branch at `src/catalog-skill-classification.mjs:46` returns first. The current test verifies the distribution-sum result remains unavailable, but not that the unavailable response is from the required provider/model.

**Important: the request-plan receipt is not byte-hash bound or internally validated.**  
`src/catalog-continuation.mjs:42` reads `jev-request-plan-receipt.json` through plain `read`, not `bound`. At `:45`, only `persistedRequestPlanSha256` is checked. Other persisted evidence in that file, including `plannedRequests`, `requiredReturnedModel`, wrapper boundary, and helper identity, can change without detection. Missing or malformed evidence fails, but semantically altered evidence can pass.

Reproduction: change `requiredReturnedModel` or `plannedRequests` in `data/quarry-intake-2026-09-21-catalog801/jev-request-plan-receipt.json` while retaining `persistedRequestPlanSha256`. The continuation loader continues successfully. To satisfy “validate all byte hashes,” this receipt needs an anchored byte digest or complete reconstruction-based validation.

No critical findings.

**Verified behavior**

The reconstructed request plan, frozen queue, original receipt hashes, continuation receipt hashes, duplicate request IDs, foreign request IDs, and traversal/absolute/junction paths are otherwise checked coherently. The query path exposes the continuation judgments with metadata-only scope and no authority or activation. The bound distribution-sum case remains `jev-unavailable`, and `classificationComplete` remains false.

Command run exactly as authorized:

`node --test tests/catalog-continuation-query.test.mjs tests/catalog-continuation-integrity.test.mjs tests/catalog-skill-classification.test.mjs tests/catalog-skill-intake-artifacts.test.mjs .`

Result: 31 tests passed, 0 failed.

**Scope and limits**

Reviewed the current uncommitted diff and the enumerated continuation, test, manifest, classification, and query files. I inspected intake artifacts only at key/count level and did not dump JSONL data, source corpora, logs, transcripts, family material, or wave9 research. No files or Git state were changed, and no network, agents, package installation, or untrusted-source execution was used. This was static inspection plus the authorized tests, not independent runtime validation outside those tests.
