# Recovery review disposition

Independent MiMo review (CLI task 01a0c814-3b22-7eb2-82b6-20d0a3bafa51, exit 0) is preserved verbatim in independent-review.md. It found no critical issue but requested fixes before merge. It verified 29 focused Node tests; sandbox access denied its Python invocations, so Python verification below is parent evidence, not independent execution.

- Retry-refusal progress bug: confirmed and fixed. Progress now derives from the ORIGINAL attempt, not the final retry output. Added a regression for a dispatched original followed by a local retry refusal; next index cannot rewind the original.
- Diagnostic direct-result shape: the diagnostic preserves a direct Service response, not a tool receipt. The explicit integrate.mjs adapter wraps the identical result and binds the diagnostic file hash; it does not relabel provider data. Parent verified the entire original result equals the wrapped result and all eight resulting rows pass the real catalog loader. The raw diagnostic is not itself listed as a classification receipt.
- Paid replay coverage gap: added a filesystem-backed regression exercising the exact judge_or_replay function used by the runner. Existing receipt means zero new dispatch; changed request, snapshot, digest or damaged JSON fail rather than dispatch. Receipt bytes remain unchanged.
- Empty diagnostic map: guarded before min/max, avoiding accidental exception masking.
- Historical-plan wording: initial rules are explicitly marked historical and superseded by the subsequent owner-directed amendments.

Eight Python recovery tests now pass. Changes after review were parent-verified; no claim of a second independent review. Shared helper idempotency/accounting tests also remain relevant: 27 pass after the separately owner-authorized unlimited quota update. No provider results are normalized or granted authority.

The unlimited worker was already running when the progress-reporting/replay extraction fixes were written. Its loaded original behavior still retains the shared ledger's idempotency and quotas are disabled. Its completed receipt set and any stop cursor must be inspected against the persisted original attempts before any later resume; no blind resume based on a retry-side stop field.
