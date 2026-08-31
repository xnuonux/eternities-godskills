# typed execution stepper v1 implementation plan

1. preserve the exact historical typed-composition implementation, generated artifacts, and receipt bytes.
2. write failing tests for begin, ready, commit, completion, fresh-handle replay, invalid-output non-advancement, and provenance rejection.
3. implement the additive private-state stepper in a separate module using the certified method verifier and exact closed contracts.
4. compare completed stepper output byte-for-byte with the historical reference runner.
5. emit a deterministic Muse-to-Forge step transcript and replay artifact without method or skill bodies.
6. build one append-only receipt that pins the typed-composition parent, complete additive source closure, declared evidence, focused tests, full tests, and proof limits.
7. run focused regressions, historical typed-composition release verification, the full repository suite, inline adversarial review, and two byte-identical builds.
8. commit source before issuing the receipt, reproduce the receipt from that source commit, fast-forward canonical main, push, and remove only the clean feature worktree.
9. begin the Godagents durable-node-journal consumer only after the new trust root is frozen.

## stop conditions

- any historical typed-composition artifact or receipt byte changes;
- any node output can enter replay state before exact typed validation;
- any cloned, forged, stale, or cross-execution step is accepted;
- replay differs from the historical execution receipt;
- any authority, effect, provider, credential, default launch, or host integration is introduced;
- any unresolved critical defect remains.
