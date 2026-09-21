# Use report

## Loaded host guidance

- `test-driven-development` (`C:\Users\Dom\.agents\skills\test-driven-development\SKILL.md`)
- Its required `writing-good-tests.md` reference
- `verification-before-completion` (`C:\Users\Dom\.agents\skills\verification-before-completion\SKILL.md`)

No task-specific method file, external project material, network resource, dependency, checkpoint, agent, or hidden-test material was used.

## Assumptions

- `fitIds` and `evaluationIds` are complete, unique, non-empty string ID arrays; missing or malformed membership evidence blocks use.
- A cache must declare `data`, `split`, `preprocess`, and `code`; only identities listed in `dependsOn` are cache dependencies.
- Resume requires exact equality for all six identities and every caller-listed state entry to be explicitly `true`; a resume mismatch never becomes a warm-start.
- Warm-start requires a complete, verified checkpoint with an explicitly compatible architecture and verified model weights; other training identities may differ because this is a new run.
- A successful decision requires the artifact fit membership to be disjoint from the current holdout. Paths and labels are ignored as identity evidence.

## Test results

- `node --test guard.test.mjs`: 11 passed, 0 failed.
- The test set covers valid reuse, rebuild, resume, warm-start, identity mismatch, missing evidence, holdout overlap, incomplete/unverified artifacts, missing cache dependencies, incompatible weights, and input immutability.

## Unresolved limits

- The guard cannot verify artifact bytes or digests; it trusts the caller’s `verified: true` assertion.
- It does not load artifacts, inspect checkpoint contents, train, or promise bitwise reproducibility.
- Compatibility is limited to the opaque IDs and explicit state/membership declarations supplied by the caller.
