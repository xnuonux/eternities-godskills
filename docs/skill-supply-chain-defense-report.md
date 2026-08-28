# Skill supply-chain defense report

## Outcome

Eternities Aegis v3 adds a first-party, dependency-free trust gate for acquired agent skills. The gate reads regular files as inert bytes, records bounded structural and behavioral evidence, and requires an exact semantic review before promotion evidence can advance. It never imports, installs, executes, or invokes acquired code.

The implementation was independently written after a mechanism-level review of `NVIDIA/SkillSpector@1b875933a666b627c3ed1b695f066a21a6773dc4:skills/skill-inspector/SKILL.md`. The exact source body is SHA-256 `655d3a69020552c8ec3d64b7b64d22f3f3b6d85f1a5ed107ef44c7e8e98b1daa`, its repository signals Apache-2.0, and no source prose or implementation was copied.

The production gate loads one exact source record and one exact ledger row, rescans current source bytes, rejects any row mismatch, binds the semantic review to the complete manifest, and only then returns an advancement decision. The selected mechanism source has a source-bound `CAUTION` decision with exact repository revision, body digest, scan digest, ledger-row digest, and decision digest. Caller-fabricated scan objects are not accepted by the public gate.

## Wave 2 result

The deterministic ledger accounts for all 7,776 exact Wave 2 source records:

- 1,844 are clear for semantic review;
- 5,593 require manual semantic review;
- 339 are rejected before indexing;
- 20 of the rejected rows reached a structural traversal or byte budget and remain explicit `STRUCT-SCAN-FAILED` evidence.

The ledger is 7,531,044 bytes and reproduces at SHA-256 `73bf99bcabeb5a3af7bf65a87d51a27692b00f1aa45c43044bd9a886c8ed4347`. It records 370 credential-transmission correlations, 1,508 declared-purpose mismatches, 245 destructive surfaces, 218 download-and-execute correlations, 36 obfuscated-execution correlations, 863 persistence surfaces, 56 prompt-boundary attacks, 11,693 sensitive-capability findings, 57 binary-file findings, and 20 structural scan failures. Counts are finding leads, not unique vulnerabilities.

## False-positive controls

Pattern evidence is never promoted directly into a safety claim. The scanner separates critical rejection from sensitive behavior that needs review, reports generic redacted evidence rather than credential values, excludes Git metadata, rejects links and special files, and binds every result to a canonical manifest digest. The semantic reconciler then requires exact scan and body digests plus explicit judgments for purpose, permissions, transmission, execution, persistence, prompt behavior, trigger scope, dependencies, and user control.

Traversal revalidates canonical containment and file identity immediately before reading, consumes bytes through an already-open file handle, and compares a final recursive snapshot against the initial discovery. Changed, added, removed, or replaced files fail the scan. The host filesystem is not globally locked, so every decision remains valid only for its exact bound digests and promotion must consume those same bytes.

Stale evidence, hostile prompt behavior, hidden execution or persistence, unexplained transmission, purpose mismatch, excessive permissions, absent user control, or any critical static rejection fails closed. Uncertainty remains `CAUTION` and promotion-ineligible. A documented sensitive capability may remain `CAUTION` while becoming eligible for a later governed promotion decision, but it is never silently approved.

## Evaluation

The new Aegis route passes 10 of 10 all-critical direct, paraphrase, exclusion, conflict, malicious, documented-sensitive, stale-review, missing-review, clear-static, and excessive-permission fixtures. The existing Aegis suite remains 16 of 16. The measured Aegis entrypoint is 1,508 approximate tokens, below the 4,000-token policy ceiling.

This is deterministic local evidence. Clean static evidence does not prove safety, regex findings do not prove exploitability, and routing fixtures do not prove arbitrary live-model interpretation. No host profile or adapter was activated by this release.

## Evidence map

- neutral contract: `data/skill-supply-chain-defense-contract.json`
- provenance and Wave 2 review: `data/reviews/github-wave-2-skill-defense.json`
- exact semantic review: `data/reviews/nvidia-skillspector-skill-inspector-review.json`
- exact advancement decision: `data/reviews/nvidia-skillspector-skill-inspector-decision.json`
- static ledger receipt: `receipts/github-wave-2-skill-security.json`
- Aegis v3 promotion receipt: `receipts/promotions/eternities-aegis-v3.json`
- evaluated synthesis: `syntheses/eternities-aegis.v3.json`
