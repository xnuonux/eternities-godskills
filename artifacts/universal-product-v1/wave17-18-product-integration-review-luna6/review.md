# Independent product-integration review: Wave17–18 owner refinements

**Overall static instruction-reviewed integration: NOT READY.** The four method cards are mostly bounded and the release package is internally consistent, but Daedalus R2 is not reliably discoverable for plausible paraphrases or the planned contradictory-atomicity case. Its all-or-nothing sentence also needs a tighter transactional-boundary qualifier. The declared Logos-to-Muse visual-acceptance handoff is absent from Logos’ catalog relationship metadata. These are integration blockers, not source-proposal defects.

| Refinement | Static finding |
|---|---|
| Hermes R1 — incremental byte-to-record intake | READY: method scope, runtime gate, framing, resource bounds, terminal errors, and protocol exclusions are clear. |
| Daedalus R2 — partial-commit state matrix | NOT READY: paraphrase/conflict discovery misses the owner; wording can overgeneralize atomicity across external effects. |
| Logos R1 — evidence-bound slide artifact | READY as instruction content; its stated Muse handoff is not exposed by `related` metadata. |
| Agora R2 — cross-artifact business fact register | READY: bounded to consistency evidence, with decision authority, calculations, legal/financial conclusions, and outreach excluded. |

This review is bound to worktree `C:\dev\eternities-godskills\.worktrees\universal-product-v1`, HEAD `6fa17164e85187a34bb3e8144604189e139968e1`, and candidate release `0e8abfdfe55c0342b280975ede01e7b4321648acf87cd4109ca397fb330dbff7`. No source, product, ledger, script, or Git content was edited. Only this review and its receipt are written by this review.

## Blocking integration findings

### Daedalus partial-commit discovery is too brittle

The direct query used by the candidate’s test ranks `eternities-daedalus` first. A natural paraphrase—“A database action succeeded but a downstream service failed: decide what remains committed, what is undone, and how to reconcile before retrying”—ranks Daedalus fifth, behind `bounded-service-shutdown`, `venture-falsification-and-planning`, `eternities-agora`, and `scene-continuity-and-coverage`. A second paraphrase, “A write is durable but the downstream step failed; decide whether to compensate or safely continue after checking persisted state,” omits Daedalus from the first five.

More importantly, the candidate’s own proposed conflict case is not routed to Daedalus: “The service should be atomic even though the first database commit must remain when the next provider call fails” returns no Daedalus result in the first five. That is precisely the contradictory requirement the method says to preserve and resolve before choosing an implementation. A more lexical query containing “completed payment,” “commit state,” and “reconciliation” does bring Daedalus into the top three, so this is a discovery weakness rather than an absence of the method text.

Add a paraphrase and a conflicting-atomicity case to owner-discovery regression coverage before treating this method as integrated. The authored test covers only one direct wording. Catalog retrieval is advisory, but the intended method owner should still be discoverable for the request class it is meant to handle.

### Daedalus atomicity sentence needs an explicit boundary

The new card says, “Ordinary all-or-nothing work belongs in one verified transaction.” The surrounding text correctly asks the reader to name external effects and transaction settings, and the card is restricted to partial-commit or uncertain-acknowledgement cases. Even with those safeguards, the sentence does not say that one transaction is appropriate only when the relevant effects share a supported transactional boundary. Read literally for a workflow spanning a database and a remote service, it could encourage an impossible cross-system atomicity claim or a long-running transaction. Qualify that boundary and retain the method’s stop-and-escalate behavior where no supported atomic boundary exists.

The rest of R2 is careful: it binds engine/driver/ORM/version, reconciles uncertain effects before replay, models compensation failure, forbids blind retries, and requires explicit authority for compensation. Its example labels a committed payment as committed rather than claiming the overall workflow rolled back. I found no copied savepoint recipe or unsupported provider-specific transaction claim.

### Logos’ Muse handoff is missing from discovery relationships

Logos’ new method correctly assigns visual and interaction acceptance to Muse when that is the dominant concern. Its `skill.json`/catalog `related` list contains Agora, Chorus, Daedalus, and Oracle, but not Muse. Consequently a discovery result for Logos does not surface the named visual-acceptance owner in its relationship suggestions. This does not invalidate the prose or package hash, but it leaves the reviewed Logos/Muse owner seam inconsistently represented. Align the relationship metadata or document why that handoff is intentionally excluded before calling the integration complete.

Daedalus’ new prose also routes migration, release interruption, and provider quota retry to Atlas, `release-script-safety`, and `api-rate-limit-recovery`; none is in Daedalus’ current `related` list. The direct specialist queries can discover the respective owners, but the relationship list does not reinforce those method-level boundaries. Treat this as a follow-up to the Daedalus routing blocker, not a claim that `related` edges are mandatory loading.

## Method, safety, and provenance review

- **Hermes R1:** The trigger is conditionally scoped to consuming useful records before response completion. The card requires verified runtime/API chunk support, declared charset/framing and size limits, persistent incremental decoder state, bounded buffering/backpressure, cancellation/timeout handling, EOF validation, and a receipt that distinguishes complete from partial/error outcomes. Complete-body JSON is excluded; WebSocket, SSE, audio, and database protocols are not treated as generic byte framing. No unsafe retry instruction was found; uncertain effects must be reconciled before retrying a non-idempotent request.
- **Logos R1:** The method binds audience, source period, rights, effects, and reviewer; separates supplied claim evidence from analysis ownership; requests claim and slide maps; and separates content, package, rendered, and accessibility checks. It does not equate a clean render with truth, publication, recipient approval, or investment quality. No hosted upload is implied.
- **Agora R2:** The method requires stable facts and artifact assertion locations, preserves definition/unit/period/source mismatches, and assigns conflict resolution to the named owner. Its example does not let a newer raise figure win by recency. It disclaims valuation, forecast, legal, outreach, and publication authority. Agora’s catalog relationship to Logos is present, consistent with the content/artifact seam.
- **Unsupported claims:** The examples are expressly hypothetical or method-level acceptance cases. They do not assert runtime/provider compatibility, financial outcomes, causal effects, or completed external actions. Product instructions remain advice to inspect and verify, not evidence that any case was executed.

The Wave17 restricted presentation bodies S06 (`pptx-official`) and S09 (`document-skills/pptx`) remain exclusion-only; their pinned notices have the same restrictive license SHA-256 `79f6d8f5b427252fa3b1c11ecdbdb6bf610b944f7530b4de78f770f38741cfaa`. The product slide method shares no normalized exact seven-word shingles with S05, S06, or S09. The Wave18 pinned source has no root LICENSE; its README badge and null per-body license hints do not settle rights. The Hermes and Daedalus methods share no normalized exact seven-word shingles with their three principal pinned source bodies. These checks support the absence of copied long phrases; they are not a legal determination or a clearance of source-specific rights. S05’s more-specific external license remains unverified, and Wave18’s rights gate remains open. The product metadata preserves those limitations.

## Release integrity and verification

`verifyProduct(product)` passed for the exact candidate release: 68 skills, 177 manifest files, release ID matching the requested candidate. The manifest binds every packaged file except `release.json` itself; the catalog exactly matches skill metadata, entrypoint hashes, and declared resources. Resource links stay within skill directories, no machine-local path was found in packaged instructions/metadata under the product verifier, and the CLI portability test runs a copied product from a minimal environment. The current change is exactly 14 tracked product files: the release/catalog manifests plus one entrypoint, method/reference file, and metadata file for each of the four owners. `git diff --check` passed.

Verification results:

- Focused product and Wave17–18 tests: 29 passed, 1 skipped, 0 failed.
- Full repository test suite: 1,185 passed, 2 skipped, 0 failed (1,187 total).
- Independent routing probes: direct owner cases passed for all four; Logos and Agora paraphrases surfaced the intended owner in the top three; Hermes paraphrase surfaced Hermes second. Daedalus paraphrase/conflict failures are recorded above. The all-or-nothing Daedalus exclusion routed away from Daedalus; Logos analysis and Agora valuation/legal-decision exclusions routed to specialist owners. Release interruption routed to `release-script-safety`; a specific Retry-After/idempotency query routed to `api-rate-limit-recovery`. A generic “API 429 with safe retries” query ranked Hermes above the rate-limit specialist, another lexical boundary weakness. Full-body JSON ranked `structured-output-contracts` first and Hermes second; search returns owner candidates, not method-level activation. Every probe returned `authority: none` and `activation: none`.

The tests establish package/discovery behavior and static instruction contracts only. No live database, real HTTP stream, external renderer/provider, installation, hosted upload, or recipient action was exercised. Provider/runtime qualification is **NOT RUN / NOT QUALIFIED**. The quality or performance of the whole 68-skill corpus is **NOT ASSESSED** by this scoped review.

## Reviewed evidence

Raw-byte digests below were recomputed for the source-review/proposal/receipt inputs. Wave17 and Wave18 independent-review verdicts were READY to proceed to owner review only; neither receipt claims installation or product acceptance.

| Evidence | Bytes | SHA-256 |
|---|---:|---|
| Wave17 source review | 14,197 | `1fb4dea867ac4348d03ecb6894ebcab712fbbe24d141244e21ea0b4861865812` |
| Wave17 candidate methods | 14,066 | `e7b5ef9725ddfea612df4b46ea0f68c288f26fd19de0b8f7fc648472d2903fa1` |
| Wave17 author receipt | 15,156 | `865a26d4d6a813cb794a7e2d665c08c501516293899cb608dde60b5f23de8323` |
| Wave17 independent review | 15,753 | `8c16618f5c44e9b275c81106197c644e3828f9426c9613fb233bba660542a42d` |
| Wave17 independent receipt | 16,407 | `6495a9c67142f6e828042a072ba29399d7cd1932291932fc81bb808f1f4fb057` |
| Wave18 source review | 16,581 | `ef9a7d6325355a70264a88c1a4765c6a9524dc8f4222ebcd9fcdb85a3cd9952d` |
| Wave18 candidate methods | 11,079 | `9640cc75b63dc2c0e3818f0be61429536ad175418e1247347dcdb4d34df42bbd` |
| Wave18 author receipt | 16,298 | `4283b747de88b2b300f57f6aea3ddb1b685555372a4109ddf3092230ae3a243b` |
| Wave18 independent review | 7,452 | `ef62d78ad4d758ba6f43d0b41b4f4e95cc59b9a9fdcb8d610240e066218911cb` |
| Wave18 independent receipt | 14,336 | `6079b0720d46d6d6336ac5e16a01cef1f463c40bb631c9e992c7ee7dc27423a4` |
