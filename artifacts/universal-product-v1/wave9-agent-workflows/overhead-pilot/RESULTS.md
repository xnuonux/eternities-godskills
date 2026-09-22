# Compact overhead guidance: matched coding pilot

**Decision: preserve the candidate as experimental; do not make it a default or install it yet.** Both implementations passed the same 12 frozen functional checks. The compact-card run used less reported input/output and completed sooner in this pair, but no uniquely attributable guidance behavior or general efficiency benefit has been established.

The revised card is 201 whitespace-separated words. It removes the earlier draft's blanket stop without a measured baseline: qualitative inspection, authorized reversible improvements and correctness checks may proceed; quantified savings still require measurements. It is conditional, not a new mandatory per-task report or top-level skill.

## Observed result

Randomized assignment was A = existing Forge entrypoint plus method cards, B = the same content plus the compact card. Both received the same frozen dependency-runner contract, starter and common prompt. Fresh MiMo CLI contexts used the same named provider profile and medium reasoning. Both completed within the declared 12-minute wall limit. Neither submitted implementation was edited, relaunched or selectively repaired by the parent.

| Observation | A: Forge baseline | B: Forge + compact card |
| --- | ---: | ---: |
| Frozen functional checks | 12/12 | 12/12 |
| Reported input tokens | 193,381 | 81,373 |
| Cached input subset | 104,448 | 30,720 |
| Reported output tokens | 17,124 | 11,355 |
| Reasoning output subset | 8,895 | 5,022 |
| Observed shell commands | 4 | 3 |
| Final explanation bytes | 2,044 | 592 |
| CLI startup to final-file write, approximately | 392 seconds | 168 seconds |

The treatment used about 58% fewer reported input tokens and 34% fewer reported output tokens in this single pair. These are observations, not a promised saving or causal estimate. Cache/reasoning are subsets and must not be added again. Actual monetary charges are unavailable. Both workers had a failed patch-format attempt within their original run, then corrected it. A wrote a larger iterative implementation and ten own tests; B wrote a smaller recursive implementation and five grouped own tests. Those implementation/test choices may explain resource differences and are not independently controlled.

Both completed the coding task without requesting a historical benchmark and distinguished structural deduplication from measured timing/token savings. However, the common task and prompt already instructed them not to fabricate savings or wait for a baseline. Those behaviors therefore cannot be credited specifically to the extra card. Neither result demonstrates that the card is needed for ordinary coding.

## Evidence quality and boundaries

- The parent froze the task, checker, reference, input versions, randomized mapping and decision rule before either consumer ran. The reference passed all 12 checks; empty, always-rejecting, weakened-preflight and duplicate-execution variants were rejected by relevant checks. An absent implementation is reported as unavailable, not a scored success or semantic bug catch.
- Parent inspected each implementation before local evaluation, ran the unchanged checker with a 10-second subprocess bound, and copied outputs with exact hashes. Consumer-authored tests are archived as `submitted-tests.txt` to keep normal repository test discovery from treating their own claims as acceptance evidence. They remain unedited.
- Observed commands read only the supplied task, guidance and starter, and ran locally authored tests. There was no observed source-warehouse access, private-data access, network use, delegation or external effect by either consumer. This is observed tool behavior, not an OS-level proof against every possible hidden influence.
- The host delayed command startup by several minutes; both CLI processes started around 04:22:24 UTC despite earlier launch acknowledgments. Read-only process diagnostics also stalled temporarily. Receipt timestamps distinguish launch-return, final-file write and completion observation. Polling time is not inference time; shared-host parallel timing is noisy. The underlying cause of the startup delay was not established.
- The fixture setup initially had a wrong relative path to Forge, failed before any model dispatch, and left an empty temporary directory. It was corrected and a new exclusive fixture directory was used; only the successful setup was frozen. No paid attempt was replayed.
- This is one task and one run per condition, with native host constraints plus Forge, not raw agents and not the whole Godskills/Godagents system. The parent authored the card, task and checker; the consumers did not see the checker/reference, but benchmark design and interpretation were not independently reviewed. The finite checks do not certify every possible JavaScript object or runtime condition.

## Adoption and next useful evidence

Functional quality is tied on the preregistered criteria. The token/latency signal merits another bounded evaluation, not default expansion on this sample alone. The installed product remains unchanged. A next comparison should use a different real maintenance task where optional source selection or tool-output reduction is an actual decision, and should not explicitly supply the behavior being tested in the common prompt. Freeze the acceptance contract first, keep the same model/settings, reverse or randomize order again, and retain failures and actual available cost data. Do not keep adding prose to chase one result.

Machine-readable frozen inputs, original implementations, messages/commands, usage counters, file hashes and check results are retained in `frozen-plan.json`, `result.json`, and `runs/a` / `runs/b`. The helper/card introduces no new host prerequisite, paid service, automatic skill activation or source promotion.

## Repository verification

Five harness/evidence tests pass, including rerunning both preserved implementations and checking the frozen inputs and output hashes. Parent full repository suite: 1,048 tests, 1,046 passed, zero failed, two conditional skips (Windows file-symlink creation and a cross-volume destination fixture). Product, intake data, runtime source, policies and protected activation artifacts are unchanged. This research-only batch does not require reinstalling the skill pack.

A local `.gitattributes` preserves the exact experiment bytes instead of applying repository-wide line-ending normalization. Original consumer evidence keeps its trailing whitespace where present; checks of authored files remain separate from those preserved evidence bytes. No workstation configuration was changed.

## Completed follow-up

The proposed real maintenance comparison is complete: [results](../maintenance-pilot/RESULTS.md). It did not reproduce lower input usage, and default adoption remains deferred. That follow-up closes this small pilot series; the original observations and frozen records above are preserved, not retroactively upgraded.
