# Aegis method cards

## audit-remediation-root-cause-and-regression-review

Start with the exact finding, affected target, evidence locator, and acceptance rule. Reproduce the observed boundary locally when possible, then draw the smallest causal chain from input or condition to impact. Separate the triggering defect from amplifiers such as broad permissions, stale dependencies, or weak observability. Test the strongest benign explanation before assigning severity.

Choose a remediation that changes the responsible boundary: validate at the trust boundary, reduce authority, isolate a secret, constrain an argument, pin an identity, or make a failure observable. Record compatibility and rollback. Add a regression case that would fail if the control were removed, plus a clean, comment-only, or out-of-scope control when the finding came from a deterministic rule. Recheck the original path and record residual risk, uncovered paths, owner, and expiry. The output is a remediation decision and regression receipt, not a declaration that all security risk is gone.

## Static and workflow review notes

For a workflow or tool chain, trace attacker-controlled source, transport, AI or execution sink, and available authority separately. A permissive setting is an amplifier until the source-to-sink path is proven. Preserve uninspected remote or runtime-fetched material as unresolved. For an acquired skill, compare exact body identity with purpose, permissions, transmission, persistence, triggers, and dependencies; static cleanliness permits further review, not automatic trust.
