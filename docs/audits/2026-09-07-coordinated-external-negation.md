# coordinated external-negation repair candidate

status: isolated candidate, not a certified release or a Godagents mission unblock.

## reproduced failure

base: `2ccdacf8ae04aceaff417de7c27fb3885b0bb7b7`.

The frozen input is
`D:\00-INDEX\operations\2026-09-07-godagents-minimax-comparison\candidate-2\workflow\mission-request.json`,
SHA-256 `269db0d950346e4edb7dd14a6ae0f934baf693f74e39fa7bfd70489053e44493`.
The local probe passes its `mission.objective` and `hostCeiling` directly to
`compileIntent` with the checked-in routing cards. It never launches the mission
or calls a provider.

Objective:

> Select the maximum-total-weight compatible subset of the supplied jobs. Produce one scheduling result, without tools or external actions.

| observation | unchanged base | repair candidate |
|---|---|---|
| requested effects | external-write, local-read | local-read |
| leading candidates | Hephaestus 19, Beacon 18, Agora 13 | Hephaestus 19, Logos 13, Agora 12 |
| unresolved decisions | external-read authority; external-write authority/effect permission/support; ambiguous intent | external-read authority |
| supplied authority | local-read, local-write, realm:write | unchanged |

The original adjacent `without external actions` check misses coordination.
Independently, the bag-of-words scorer treats excluded words as positive evidence.
The prior global exclusion also suppresses a different positive occurrence of
the same external-action phrase. Regression tests cover both directions.

## bounded repair

`src/intent-compiler.mjs` removes only recognized negative noun-list spans from
the lexical inference view. Original request text, digests, envelope outcome,
supplied authority, proposed effects, proposed decisions, and selected-card
policy requirements remain intact.

The deliberately limited grammar recognizes `without` or `no`, optional `any`,
and either an external action/change/mutation noun or a small coordinated list
of tools, browsing, and network access ending in that noun. Lists require an
explicit final `and` or `or`. The recognized span must end at a terminal clause
boundary or end of input; trailing words and comma continuations remain
conservative, including conditional `unless`, `if`, and `except` forms. Prefix
checks are clause-scoped, so an earlier `no local changes,` does not reverse the
final exclusion. Ambiguous comma-only lists and negating prefixes including
double negation and contractions remain conservative. This is not a general
natural-language negation parser.

Effect inference, candidate scoring, and consequential permission checks use the
same lexical view. Removing one exclusion cannot cancel a separate positive
external-action mention. A following positive publication still requires its
normal authority. No authority requirements are weakened.

## separate, unresolved ranking defect

Remove the entire exclusion and the local scheduling objective still selects
Hephaestus from generic overlaps such as `select`, `one`, and `result`.
Hephaestus requires external-read, which the caller does not possess. This is a
discovery/ranking defect, not permission to alter Hephaestus or drop its checks.

`tests/intent-compiler.test.mjs` contains a deliberately failing TODO regression
for the no-exclusion objective. It records the desired absence of an irrelevant
external-read requirement without silently bypassing authorization. The passing
negation tests also assert that the currently selected card's requirement remains
enforced. The two issues must not be conflated into a mission-success claim.

## verification and release gates

- Test-first: the initial targeted run exposed nine expected failures; three
  additional safety controls failed before the grammar was narrowed.
- Before adding the separate ranking TODO, 53 compiler/generalization checks
  passed. No live provider or mission run was performed.
- The first full candidate run had 863 tests: 856 passed, six failed, one skipped.
  Five failures detect changed compiler bytes or derived source-closure evidence.
  They are real release blockers, not behavioral pass evidence and not a reason
  to weaken the comparisons.
- Re-running those six test files against unchanged main produced 16 passes and
  one failure among 17 tests. The pre-existing failure is
  `codex-routing-policy.test.mjs`, which requires an old literal phrase in the
  installed global AGENTS instructions. The user's new instructions are preserved.
- Final targeted run: 58 tests, 57 passed, zero failures, one deliberately failing
  TODO for the separate ranking defect.
- Final full run: 868 tests, 860 passed, six failures, one skipped, one TODO.
  The six release blockers are the same five changed-byte checks and the
  pre-existing workstation-wording check. This is not a green release suite.
- Final compiler file SHA-256:
  `988305567bf78573109194673962e9f9817303a6fabcf86ae1327fa0abf2117b`.
- Independent Terra reviewer Ptolemy identified the earlier-negation scope issue
  and trailing conditional issue. Both reproduced as failing tests before repair;
  final independent re-review confirmed both closed and found no remaining
  material regression in the narrow change. The reviewer ran 38 passing compiler
  tests and one expected ranking TODO, not the full suite. This is a candidate
  review result, not approval to bypass the release gates.

Changed-byte blockers: `compiler-generalization-v2-certification.test.mjs`,
`intent-compiler-certification.test.mjs`, `intent-compiler-v3-certification.test.mjs`,
`routing-executable-receipt.test.mjs`, and
`specialist-preference-routing-receipt.test.mjs`.

## migration recommendation

1. Keep this candidate isolated. Keep Godskills main, Godagents' trusted pin,
   historical receipts, and the unsuccessful live experiment unchanged.
2. Independently review the narrow behavior change and its conservative controls.
   Diagnose actual behavioral failures separately from byte-identity mismatches.
3. Repair and qualify the separate ranking problem against local reasoning tasks
   and genuinely external should-serve controls. Do not grant external authority,
   loosen the selected card, or force a native fallback simply to pass this task.
4. Explicitly agree on a versioned compiler/routing release. Preserve old evidence
   and issue new candidate evidence for the changed compiler and every affected
   dependency. Historical verification must resolve its historical pinned bytes;
   do not overwrite old receipts or remove freshness checks.
5. Separately replace the brittle workstation-wording assertion with an appropriate
   policy test under its own reviewed scope. Do not rewrite user instructions to
   satisfy a stale string test.
6. Only after the relevant suite, source closure, evidence, and independent review
   pass may the owners coordinate a new Godagents pin and fresh admission. Any
   live rerun needs its existing or newly explicit provider/spend authority and
   a new recorded trial, not a rewrite of the original failed trial.

No receipt builders, acquired source, financial operations, provider requests,
or Godagents mutation are part of this repair.
