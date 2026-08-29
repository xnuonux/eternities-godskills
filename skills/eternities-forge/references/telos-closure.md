# Telos closure contract

Telos is Forge's opt-in ideal-bar closure route. Use it only when the user explicitly requests perfection, an ideal-bar pass, exhaustive adversarial refinement, or proof that a consequential defect class is structurally closed. It raises the proof bar without pretending that finite work can establish literal perfection.

## bind the closure charge

Before a round, record:

- the exact artifact, diff, or system surface;
- the claim or invariant under challenge;
- the named defect shape, not merely one observed costume;
- acceptance probes and the production change that would make each probe fail;
- downstream consumers and blast radius;
- available authority, rollback boundary, and prohibited effects;
- an iteration budget, time budget, token budget, and mutation budget.

If the oracle is subjective, missing, stale, unrelated, or controlled only by the author, repair the proof surface before changing production behavior. A review verdict does not prove a claim, and a completion token is never an oracle.

## one evidence-bearing round

1. Inspect the actual final-state artifact and baseline evidence. Treat descriptions, plans, comments, prior reviews, and the author's story as claims to test.
2. Try to express the defect shape through distinct seams: inputs, state transitions, ordering, persistence, concurrency, recovery, permissions, consumers, migration, and documentation claims. Search for where a prior fix relocates the same defect.
3. Prefer structural closure over local absence. Make illegal states unrepresentable, put guarantees at the endpoint that knows, reduce writers or lawful merge ambiguity, separate pure decisions from effects, and constrain public interfaces when those moves fit the system.
4. Change one bounded surface. Preserve unrelated behavior, authority, rollback, and repository conventions.
5. Exercise a probe that would fail if the closure were removed. Run focused verification, regression checks, and the relevant downstream or live smoke. Static green alone is not live behavioral proof.
6. When available and proportionate, use a reviewer with fresh context to attack the claim and a separate completeness critic to ask what remains uninspected. Reviewer agreement is not evidence; confirmed findings and executed probes are.
7. Append a round ledger: defect manifestations found, exact changes, fresh evidence, regressions, residual surfaces, scope truncation, resource cost, and measurable gain from the prior round.

Never weaken a gate to make a round pass. Never expand external effects, publish, deploy, merge, spend, or mutate accounts without matching authority. Stop immediately on authority loss, destructive uncertainty, a critical regression, corrupted evidence, or an invalid oracle.

## convergence and terminal states

Evaluate progress after every round:

- `closed`: every bounded claim has fresh relevant evidence, adversarial attempts found no expressible defect inside the declared surface, downstream checks pass, and all truncation is explicit.
- `saturated`: two consecutive rounds produce no new material evidence and no measurable gain. Report the strongest supported state and residual uncertainty instead of spending more tokens.
- `blocked`: authority, environment, evidence, decision, or safe rollback is missing, or a critical regression remains.
- `budget-exhausted`: the iteration budget, time budget, token budget, or mutation budget is reached before closure or saturation.

Do not reset a budget silently, repeat an unchanged approach, or turn `saturated` into `closed`. A new round after a terminal state requires new evidence, changed authority, a changed oracle, or a renewed explicit budget.

## handoff

Return the terminal state, bounded claim, defect shape, closed and residual surfaces, claim-to-evidence ledger, exact verification run, explicit truncation, resource use, rollback state, and the smallest fact that would justify another round. Preserve a verified plateau from which another agent can resume without re-deriving trust.
