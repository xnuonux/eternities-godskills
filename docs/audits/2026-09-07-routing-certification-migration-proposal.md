# Routing certification migration proposal

Status: proposed release design, not an execution approval or active trust root.
Date: 2026-09-07.

## Intended outcome

Certify the corrected compiler without rewriting historical evidence or silently
changing Godagents' executable trust. Keep source closure and behavioral proof
separate: reproducing a digest does not prove task success; passing a fixture
does not bind the executable that Godagents will run.

This proposal accompanies the
[bounded ranking audit](2026-09-07-local-reasoning-ranking.md). It is deliberately
not an executable implementation plan: the historical resolver and cross-repo
pin transition need a coordinated design decision first. No paths below have
been created or activated merely by documenting them.

## Observed dependency map

| Existing check or artifact | Why it rejects this candidate | Migration requirement |
| --- | --- | --- |
| `receipts/intent-compiler-v1.json` | Binds compiler text at its previous revision | Preserve receipt; verify against its exact historical source, issue new candidate evidence |
| `receipts/compiler-generalization-v2.json` | Binds the same changed compiler | Preserve historical evidence and rerun cases for the candidate |
| `receipts/intent-compiler-v3.json` | Pure rebuild includes candidate compiler digests | A new compiler release receipt, not an in-place rewrite |
| `receipts/specialist-preference-routing-v1.json` | Source closure includes compiler; parent pins are explicit | New preference release evidence with exact new compiler parent |
| `receipts/routing-executable-v1.json` | Complete closure and fixed parent pins cover those releases | New executable release root and independently reviewed closure |
| `tests/codex-routing-policy.test.mjs` | Matches obsolete global instruction wording | Separate reviewed policy-test change; never mutate user instructions to satisfy it |

The inspected builders are `scripts/build-intent-compiler-v3-receipt.mjs`,
`scripts/build-specialist-preference-routing-v1.mjs`, and
`scripts/build-routing-executable-receipt.mjs`. The executable builder hard-pins
parent receipt bytes. Merely generating a new compiler receipt cannot satisfy
those pins. Conversely, changing a pin without behavioral and closure evidence
is not certification.

## Ordered release gates

1. **Freeze the repair.** Resolve independent review and record the exact commit,
   compiler hash, test corpus hash, unchanged card hash, candidate metrics and
   catalog gap. Preserve the failed live trial and its inputs. No provider rerun.
   This gate is currently blocked by the four generic-padding applicability
   counterexamples, not merely by stale certification hashes. The partial
   duplicate-token fix is not a complete semantic-admission repair.
2. **Agree historical resolution and new identities.** Use an immutable source
   manifest identifying each historical receipt's exact source revision and
   paths. Verify those old bytes against old receipts; do not substitute current
   bytes or simply stop checking freshness. Version the new compiler, preference
   and executable release identities. Wire-protocol versions change only if the
   protocol actually changes, not just because the release identifier changes.
3. **Implement a dual proof lane test-first.** Historical lane: exact old receipt
   bytes and historical source resolution, rejecting a wrong revision, missing
   path or mismatched content. Candidate lane: current source, fixed local
   reasoning corpus, all previous arena/generalization controls and authority
   checks. Include rejected proposal reintroduction and default/specialist
   parity. No swapping in a generated expected value to make a test tautological.
4. **Build new evidence in dependency order.** Compiler semantic evidence, then
   specialist-preference evidence, then complete executable source closure and
   parent-bound receipt. Write to new versioned locations. Keep unchanged parents
   pinned; refresh only the transitive changed boundary. Verify repeated builds
   produce identical logical digests and file hashes, with tamper-negative tests
   for the compiler, a dependency, a parent receipt and routing cards.
5. **Separate workstation policy from release proof.** Resolve the obsolete
   global-wording test under its own scope. The release must not claim zero
   failures while that test remains red, nor alter global instructions to hide
   it. Any portable replacement must test actual policy invariants, not another
   magic phrase.
6. **Review and coordinate before integration.** Require targeted behavior,
   whole-repository final suite, historical proof and current closure to pass.
   Send Godagents exact commit, receipt path, file SHA-256, logical digest,
   protocol, source-closure manifest and parent coordinates. Agree the explicit
   pin transition before modifying the trusted binding. No automatic upstream
   adoption or fallback to another release when verification fails.
7. **Qualify a new trial separately.** A gap result cannot count as scheduling
   success. Godagents must settle explicit native-mode eligibility versus a
   required bound skill stack. A later trial requires its own authorized spend,
   immutable input/response records and outcome evaluation. The original failed
   trial remains unchanged.

## Non-goals

No new math skill made solely to satisfy this objective. No Logos rebranding,
universal fallback, threshold search over the failed mission, broad receipt
regeneration, provider retry, global instruction edits or Godagents pin mutation.
No claim that certification proves Godskills outperforms a raw agent.
