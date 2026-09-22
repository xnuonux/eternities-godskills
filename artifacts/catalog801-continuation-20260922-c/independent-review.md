**Merge recommendation: do not merge as-is.** The JS retry-overlay logic is sound and focused tests pass, but two confirmed runner/evidence defects should be fixed first. No critical issue was confirmed.

**Important**

1. **Retry-side admission refusal can misreport the next unattempted index.**  
   `artifacts/catalog801-continuation-20260922-c/recovery.py:11-23` settles and persists the original before retrying. If the retry receives `paced`, `busy`, quota, or another local refusal, `execute_request()` returns `stop`; then `recovery.py:108-109` uses the retry output to set `nextNeverAttemptedIndex=index`. The original at that index was already attempted and persisted, so resume status can rewind/stall on an already-attempted request. Shared `Service.judge()` emits those refusals before dispatch (`C:/Users/Dom/plugins/jev-reflex/scripts/reflex.py:263-277`).

2. **`diagnose-distribution.py` does not emit the required tool-shaped retry record.**  
   `artifacts/catalog801-continuation-20260922-c/diagnose-distribution.py:39-43` stores `result=response`, where `response` is the direct `Service.judge()` result. That is a plain result dictionary (`reflex.py:179-180`, `304-312`), but `normalizeJevReceipt()` requires `record.result.content[0].text` (`src/catalog-skill-classification.mjs:38-40`). Therefore `diagnostic-retry.json` cannot feed `applyClassificationRetries()` unchanged. `recovery.py:92-99` uses the correct wrapper shape. A concurrent downstream adapter may mitigate this, but that adapter was outside the requested review.

3. **Accidental duplicate-call coverage is incomplete.**  
   `tests/catalog-classification-retry.test.mjs:45-52` catches duplicate retry records, and `test_recovery.py:22-31` bounds `execute_request()` to one retry. Neither test exercises the persisted-receipt replay path in `recovery.py:71-86`, so duplicate dispatch after rerun is not directly verified. Given paid dispatch, this should have a focused test.

**Minor**

- `diagnose-distribution.py:30-33` accepts an empty probability map and then calls `min()`/`max()`, raising `ValueError`; `Service.judge()` converts that to `transport-uncertain` (`reflex.py:307-309`), masking the malformed-distribution cause. `recovery.py:55` correctly guards against empty maps.
- `PLAN.md:7` says “never retry” while `PLAN.md:15` supersedes that for `distribution-sum`; the amendment is understandable but the earlier rule remains misleading.

**Verification**

- `node --test tests/catalog-classification-retry.test.mjs tests/catalog-continuation-integrity.test.mjs`: 29 passed.
- `test_recovery.py` could not start with `C:/Users/Dom/.local/share/jev-reflex/runtime/Scripts/python.exe`; both direct and script invocations returned `Access is denied`. I therefore do not claim the six Python tests passed.
- `git diff --check` was clean.
- I did not run `recovery.py` or `diagnose-distribution.py`, make network/provider calls, or edit files. Concurrent changes to `artifacts/catalog801-continuations/manifest.json` and `tests/catalog-continuation-integrity.test.mjs` were observed but excluded from findings per scope.