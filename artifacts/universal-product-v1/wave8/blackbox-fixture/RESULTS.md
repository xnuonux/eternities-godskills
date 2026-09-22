# One-pair test-writing result

The frozen random assignment made arm A the explicit Daedalus-method condition and arm B the same-host baseline. Both used mimo-v2.6-pro with the same medium-reasoning configuration, task, tooling and stopping instructions. Each observed command log contains only reads of task.md / optional method.md and a syntax check of its own output. No target source, fixture, other-arm output, Keel, directory enumeration or network command was observed. This is instruction-level isolation, not an assertion that host safeguards were removed.

| Condition | Reference | Reviewed broken variants caught | Disposition |
|---|---|---|---|
| A, selected method supplied | 9 tests pass | 8 / 8 | Valid suite on this fixture |
| B, no explicit method | Fails | Not scored | Invalid suite: assumes Promise-only error signaling |

The baseline calls the synchronous reference before asserting it returned a Promise, so legitimate TypeErrors escape its error helper and fail its tests. The contract says TypeError and no partial result, not Promise-only signaling. The word 'reject' may have contributed to that interpretation; the assisted suite explicitly tolerated either throw or rejection. This language sensitivity is a limitation of the one-task comparison. No consumer was repaired or selectively retried.

## Parent inspection of A's eight failures

1. Numeric-string acceptance: assertion says invalid input produced a result.
2. Zero rejection: a legitimate zero-amount case throws the variant's nonzero-only TypeError.
3. Negative rejection: valid negative cases throw the variant's nonnegative-only TypeError. The bounded log is truncated after sufficient first-failure evidence; it is marked as truncated, not silently represented as complete.
4. Case folding: expected separate `b` and `B` groups differ from the merged actual result.
5. Sorting: actual group order differs from first appearance.
6. Mutation/aliasing: the original input's amount changed from 1 to 3.
7. Special-id skipping: the expected `__proto__` group is absent.
8. First-element-only validation: a later primitive element produces a result instead of TypeError.

Reference execution passed all nine tests. Every numbered failure was an assertion on declared behavior or an exception for a valid input; none was an import, timeout, signal or spawn failure. These are parent-reviewed detections, not the evaluator automatically assigning kills from exit codes. Original consumers and raw evaluator results are preserved under runs/.

## Resources and interpretation

The CLI reported A: 73,809 input tokens (26,624 cached), 18,324 output tokens including 15,878 reasoning tokens. B: 42,363 input tokens (10,240 cached), 5,085 output tokens including 3,054 reasoning tokens. Do not add cached tokens again to the input count or reasoning tokens again to output. Actual monetary charges are unknown.

Using observed launch times and final-result-file timestamps, A took approximately 511 seconds and B 188 seconds. This is local wall-time observation, not a provider benchmark. The improved artifact came with substantially greater time and output usage in this pair; no efficiency gain is claimed.

Decision: keep the targeted instruction-reviewed refinement and its routing correction. This pair is useful evidence that the supplied method can be applied successfully, not a causal demonstration that the method guarantees better output, general professional qualification, or an efficiency victory. One source-independent but same-provider synthetic fixture, no replication, explicit edge cases and a baseline interpretation error limit the conclusion. Further outcome work should test a fresh task and cheaper/smaller guidance rather than replaying only the losing arm.

Reproduce execution with Node 24 from the repository root:

```text
node artifacts/universal-product-v1/wave8/blackbox-fixture/selftest.mjs
node artifacts/universal-product-v1/wave8/blackbox-fixture/regression.mjs
node artifacts/universal-product-v1/wave8/blackbox-fixture/evaluate.mjs artifacts/universal-product-v1/wave8/blackbox-fixture/runs/arm-a/consumer.mjs
node artifacts/universal-product-v1/wave8/blackbox-fixture/evaluate.mjs artifacts/universal-product-v1/wave8/blackbox-fixture/runs/arm-b/consumer.mjs
```
