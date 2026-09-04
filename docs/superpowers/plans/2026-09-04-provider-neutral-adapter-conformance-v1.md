# provider-neutral adapter conformance v1 implementation plan

## goal

Create the first phase-6 conformance harness for the frozen Godskills package,
protocol, and observatory roots. The harness will model the minimum host
translation boundary for Codex, Claude Code, a local-model runner, MCP, and
Godagents, then verify that equivalent host projections produce one semantic
decision without exposing secrets, widening effects, executing source, or
claiming real host integration.

## constraints and acceptance gates

- start from pushed Godskills main `1534824` and reconcile `origin/main` before
  the worktree is created.
- preserve package, protocol, observatory, activation, and historical receipts
  byte-for-byte.
- accept only bounded host metadata and digest references. raw prompts, mission
  text, credentials, provider responses, private keys, and free-form notes are
  rejected.
- host-specific metadata may vary, but normalized semantic decisions must be
  identical for the five conformant fixture hosts.
- host authority is intersected with requested protocol effects; an adapter
  cannot widen or invent effects.
- unsupported protocol/package features produce an explicit unsupported result,
  not a silent fallback or partial conformance claim.
- secrets remain outside protocol payloads and review availability is reported
  as host capability, never invented as a completed review.
- the harness is data-only. it does not call a provider, load a skill body,
  execute package source, change routing, or perform an external write.
- the receipt binds all fixture, schema, runtime, and exact focused/full-suite
  verification bytes.

## files and interfaces

1. `src/godskill-adapter-conformance.mjs`
   - export `buildHostProjection`, `buildConformanceFixture`,
     `verifyConformanceFixture`, and `normalizeConformanceDecision`.

2. `tests/godskill-adapter-conformance.test.mjs`
   - begin with a failing import test before production code.
   - cover five equivalent hosts, normalized decision identity, effect
     intersection, unsupported feature refusal, secret/raw-content rejection,
     duplicate-host rejection, tamper detection, and deep immutability.

3. `schemas/godskill-adapter-conformance-v1.schema.json`
   - define closed schemas for host projections, semantic decisions, and the
     conformance fixture with explicit unsupported status.

4. `runtime/godskill-adapter-conformance-v1.md`
   - document host translation, equivalence, unsupported features, privacy,
     rollback, and proof limits.

5. `scripts/build-godskill-adapter-conformance-v1.mjs`
   - build a fixed five-host data-only fixture bound to the current protocol
     and package receipts and emit it transactionally with an exact receipt.

6. `receipts/godskill-adapter-conformance-v1.json`
   - bind protocol/package roots, fixture, schema, runtime, and focused/full
     verification counts.

7. `docs/godskill-adapter-conformance-v1-certification.md`
   - record the bounded matrix and explicit non-claims.

8. `README.md`
   - add a concise conformance-harness section without implying host adoption.

## implementation sequence

1. Confirm `origin/main` is `1534824` and the worktree is clean.
2. Add and self-review this plan.
3. Add the focused import test and run it red.
4. Implement closed host metadata, authority intersection, normalized semantic
   decisions, and explicit unsupported results.
5. Add conformance fixture verification and deep immutability/tamper tests.
6. Add schema, runtime contract, deterministic builder, fixture, receipt, and
   certification.
7. Run focused tests, syntax/JSON checks, builder, and a fresh full repository
   suite. Inspect the staged diff for secret leakage, authority widening,
   execution, and host-equivalence overclaiming.
8. If all gates pass, commit, fast-forward main, push, and notify Godagents of
   the exact conformance root for its next cross-repository bind.

## completion evidence

Completion requires five semantically equivalent fixture projections, explicit
unsupported-host behavior, no raw or secret payload path, deterministic
receipt rebuild, focused and full tests with zero failures, clean pushed main,
and a certificate that limits the result to local translation conformance.
