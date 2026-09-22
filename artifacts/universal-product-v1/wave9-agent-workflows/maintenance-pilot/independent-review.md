**Review result: no critical or important issues.**

**Minor, non-blocking:** `tests/catalog-summary.test.mjs:30` exercises summary exclusivity and clean failure output, but does not directly run `--summary` against corrupted evidence. Loader rejection is covered by `tests/catalog-continuation-integrity.test.mjs` and the parent’s frozen corrupted-receipt/queue checks, so this is a small residual CLI-level test gap rather than a contract defect.

**Inspection findings**

- `scripts/query-catalog-skill-intake.mjs:5-13` rejects summary combinations, repeated flags, values, and unknown arguments before producing output.
- `scripts/query-catalog-skill-intake.mjs:14-17` retains exact loader verification before success output, derives both counts from `sources` and `queue`, and omits `results`, `sources`, and `queue`.
- Existing query output construction remains unchanged in field content and ordering.
- The real loader in `src/catalog-continuation.mjs` still binds paths, bytes, manifests, request plans, receipts, and frozen queues before returning summary data.
- `docs/catalog-status.md` accurately documents invocation, exclusivity, derived counts, omitted fields, and the limits of metadata triage.
- Git inspection showed no changes to source/data/policy/trust-root files; the other additions are the permitted tests, documentation, README links, and preserved experiment artifacts.

**Verified checks**

- `node --test tests/catalog-summary.test.mjs`: 2/2 passed.
- `node --test tests/catalog-continuation-query.test.mjs tests/catalog-skill-intake.test.mjs tests/catalog-continuation-integrity.test.mjs`: 34/34 passed.
- Git diff/status inspection against the stated baseline.

**Merge assessment:** Merge-ready. The implementation satisfies the maintenance contract and preserves query compatibility and integrity boundaries.