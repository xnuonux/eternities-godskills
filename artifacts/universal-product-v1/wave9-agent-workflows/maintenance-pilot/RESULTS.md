# Real maintenance comparison: retain the feature, defer the card

## Decision

Do not add the overhead card to default Forge guidance. Its observed input usage decreased in the earlier task but increased here. Neither run shows a distinct, reliable source-selection improvement attributable to the card. Stop this pilot series here rather than adding another evaluation ritual. Keep the candidate as research, not an installed method or a token-saving claim.

Separately, adopt B's useful `--summary` maintenance implementation, subject to independent review and repository regression checks. It exposes progress without source payloads while keeping the existing evidence loader. No new classification, source promotion, installed skills or trust-root change is implied.

## Frozen comparison and outcomes

Snapshot: `df3219b4a9e5d463ae957ce0b52359e00588a4a7`. Frozen plan SHA-256: `cc4cbb194f1b1005c5a9a9480c6777b008e0dfa955cd0dc2f15e132f387d5a9d`. Same MiMo profile, medium reasoning, task, source slice and data; only B adds the unchanged 201-word card. B launched before A, opposite the previous pair. Parent observed two expected summary failures against the old implementation before dispatch. The baseline passed the four remaining groups; that is not full contract acceptance.

| Observation | A: existing Forge | B: Forge + card |
|---|---:|---:|
| Held-out functional/integrity groups | 6/6 | 6/6 |
| CLI-reported input tokens | 248,008 | 309,419 |
| Cached input subset | 139,264 | 188,416 |
| Output tokens | 11,855 | 11,655 |
| Reasoning output subset | 8,237 | 7,117 |
| Observed shell commands | 24 | 23 |
| Final-report bytes | 752 | 733 |
| CLI startup to final-file modification | ~317 s | ~301 s |

B used about 24.8% more input tokens and 1.7% fewer output tokens in this pair. Cache and reasoning are subsets, not additional totals. Actual charges are unknown. Time is shared-host observational timing, not a causal speed comparison. No selective reruns, parent fixes to consumer submissions, provider failures or timeouts occurred. Both original consumers exited zero; raw outputs remain unchanged under `runs/`.

Both implementations counted a different valid three-source/two-body fixture correctly and rejected altered provider receipts and frozen queues. Legacy query output was compared with the original command. In-fixture read-only input hashes remained unchanged. B was selected for integration because its implementation is small, preserves the query path and includes summary in usage guidance, not because its higher input cost was judged a win.

## Scope and failure observations

A manually redirected one negative test's stdout and stderr into two files outside its authorized fixture: `$env:TEMP/catalog-summary-invalid.out` and `.err`. The captured command confirms that scope breach; prior contents are unknown. It remains a failed scope gate despite functional 6/6. The `violations` arrays in `result.json` cover only the in-fixture hash inventory, not host-wide activity; see `runs/a/run-receipt.json` for the separate scope observation. No blanket boundary-compliance claim is made for A.

B tried a PowerShell check whose empty-output handling threw nonterminating errors despite exit zero. It noticed this and replaced that auxiliary check with a successful process-level assertion. A initially used an unsupported directory form of the Node test command and then ran explicit test files successfully. Both tried to read the not-yet-created documentation. These errors remain in command receipts; their own clean final test runs do not erase them.

No out-of-fixture manual access was observed for B in captured commands, but this is not an operating-system access audit. Existing integrity tests create and clean bounded temporary fixtures; that expected test behavior is distinct from A's manual diagnostic redirection.

## Limits and follow-through

Two different tasks, one pair each, do not establish causal or general token savings. A's scope breach further prevents treating this as an entirely clean authority comparison. The shared Forge/host baseline is not a raw agent, and these are not full Godskills/Godagents evaluations. Parent authored the task, checker and card; separate consumers did not see the checker. Experimental design and interpretation have not had independent review. The implementation review is separate and does not retroactively certify the experiment.

The next product work should return to source-backed skill-family refinement and advisory classification, not keep tuning this card. The installed pack remains 63 methods. The catalog's 8,841 unique bodies are intake inventory, not 8,841 finished Godskills.

## Integration verification

[Independent MiMo implementation review](independent-review.md) found no critical or important defect. Its minor suggestion was durable CLI-level corrupt-evidence coverage. Parent added a small valid empty-intake fixture, direct queue/receipt-corruption rejection checks and a child-process timeout; all five summary checks pass. These test-only additions were parent-verified, not independently re-reviewed. Runtime script SHA-256 remains byte-identical to B's original: `4650c768415608f80d74575aa7e60e3b12633795a2eead2a1a8626142029b4fc`.

Final worktree full suite: 1,053 tests, 1,051 passed, zero failed, two existing conditional skips (Windows file-symlink creation and cross-volume commit destination). Both frozen-input and original-consumer output hashes were checked. Existing source/data/policy/protected-activation and portable-product files are unchanged. No API key, model default, provider budget, pacing policy or installed skill folder was changed. The status command reduces returned context, not the validation performed; no measured runtime speedup is claimed.
