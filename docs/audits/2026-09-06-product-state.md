# godskills and godagents: product state, 2026-09-06

## decision

continue the project, but change the critical path from accumulating certified
infrastructure to delivering an independently usable, selectively loaded skill
library with measured task outcomes. preserve the infrastructure as optional
support. this audit does not demote frozen releases or claim new qualification.

## inspected snapshot

- Godskills main and fetched origin/main: `3501f20baedc95a7ec25a6535278f463b7f98c19`, clean before this documentation branch.
- Godagents main and fetched origin/main: `07b1d53ff2ef6440ceaa3ad540c10cb7f48062cb`.
- Godagents had one tracked dirty current-head artifact and a preexisting
  untracked `package-lock.json`. its task owns their closeout; neither was
  overwritten by this audit.
- Godskills worktree inventory had ten checkouts. the seven merged feature
  branches were not unfinished implementations. the two older Beacon review
  worktrees and their untracked work remain preserved. the already-merged
  discovery checkout is reused for this documentation branch.

these are dated source coordinates, not moving release aliases. inspect live
heads before implementation. the Godagents publication repair is separately
in progress and must not be represented as completed by this snapshot.

## what exists, and what the numbers mean

| observation | direct source | interpretation |
| --- | --- | --- |
| 22 broad cards, 21 families | `artifacts/routing/cards.jsonl`, `family-map.json`, `manifest.json` | current default discovery inputs |
| 44 skill directories | `skills/*/SKILL.md` | 22 broad plus 22 operational entrypoints |
| 22 operational records | `data/operational-capabilities.v1.json` | focused skills, not all present in the default card input |
| 26 owner extensions | `data/godskill-extensions.v1.json` | bounded mechanisms, not separate skill directories |
| 4,741 original source cards | `artifacts/corpus/coverage-summary.json` | foundation accounting with its own historical dispositions |
| 15,993 source identities, 5,209 distinct bodies, 10,784 exact duplicates, 4,926 accepted facets, 283 rejected bodies | `artifacts/quarry-infusion-v2/coverage.json` | combined wave-2/3 atlas, not 15,993 authored capabilities |

the foundation and wave-2/3 summaries are not an established deduplicated union.
do not add them. zero unresolved atlas identities means every identity has a
recorded disposition, not that every useful mechanism has been perfected.

the 44 entrypoints total 151,315 on-disk bytes before references. individual
entrypoints range from 1,888 to 7,837 bytes at this snapshot. these are byte
measurements, not token counts. selective disclosure matters, but reducing
useful methods to empty summaries would defeat the product.

the [directory](../capability-directory.md) names every current entrypoint and
extension. this audit sampled broad and specialist bodies and inspected their
generation/evaluation machinery; it is not a fresh line-by-line domain review
of all 44 skills or their references.

## usable surfaces versus experimental boundaries

**verified Godskills implementation:** readable skill files; local intent and
envelope CLIs; a sealed routing executable; separate activation decisions;
bounded source-atlas retrieval; selected-entrypoint and composition contracts;
an inert Aegis package canary; protocol, observatory, adapter conformance, SDK,
and discovery fixture machinery. the package is private at version 0.2.0 and
the workstation profile locks contain a user-specific destination path.

**verified Godagents implementation:** a public source SDK and economics
subpath, local creation/admission/host entrypoints, provider-family interfaces,
mission/recovery and effect-accounting machinery. the SDK explicitly describes
itself as experimental and disclaims live provider quality, default adoption,
remote exactly-once effects, and Lunari/Soul authority. the separate task is
auditing actual host usability. no provider was called by this audit.

**not established:** a clean universal install-and-use experience for the whole
pack, robust free-form discovery of every focused skill, broad improvement
over raw agents, equal behavior across models, or a production-qualified
Godagents deployment. portable metadata fixtures are not real host adoption.

## discovery defects

the [exact requests and observations](2026-09-06-routing-probes.json) are eight
read-only local reproductions, including two single-word controls. they are
exploratory diagnostics, not a held-out benchmark or live-model comparison.

1. an HTTP 429/Retry-After repair request selected `eternities-agora`, the
   agency/client-services skill. its sole qualifying score was 21, with four
   evidence labels all coming from the same word, `client`. replacing only
   `client` with `program` removed the candidate. correlated token matches
   were counted as if they established domain relevance.
2. a sales-page request to improve its `message` inferred `external-write`,
   despite requesting local analysis. changing only `message` to `wording`
   removed that inferred effect. both requests ranked an unrelated Orpheus
   card. effect inference treats an ambiguous noun as an action.
3. a units/conservation/analytic-reference heat-simulation request produced
   `intent-not-understood`, although
   `physics-constrained-numerical-validation` exists. the default command
   cannot select a specialist absent from its supplied 22-card catalog.
4. `hello` becomes `needs-decision` in this specialized CLI. a host must not
   turn that catalog miss into a mandatory user interruption for ordinary work.

the puzzle-garden probe selected Arcadia. a repair-and-test request selected
Forge. these useful cases do not cancel the defects above.

reproduce from the repository root without writes or a provider call:

```powershell
node --input-type=module -e 'import {readFile} from "node:fs/promises"; import {compileAndRoute} from "./src/intent-runtime.mjs"; const p=JSON.parse(await readFile("docs/audits/2026-09-06-routing-probes.json","utf8")); const cards=(await readFile(p.cardsPath,"utf8")).trim().split(/\r?\n/).map(JSON.parse); for(const {request} of p.probes){const r=compileAndRoute({request,cards}); console.log(JSON.stringify({id:request.requestId,status:r.routeReceipt.status,selected:r.routeReceipt.selectedIds,effects:r.compilerReceipt.requestedEffects}));}'
```

## what the evidence actually proves

- the [visual report](../adaptive-amplification-report.md) records raw Terra
  preferred in three of four matched visual tasks. white-fire skill input
  cost 2.73 times the prompt bytes and 44 percent more wall time. this is
  limited development evidence, not a universal model ranking.
- the [Aegis trial](../adaptive-evidence-v2-report.md) kept its evaluator frozen.
  all five conditions triggered its critical predicate; method and combined
  scored especially poorly. the
  [retrospective correction](../adaptive-evaluator-aegis-v2-shadow-report.md)
  exposed evaluator errors and recovered plausible scores, but cannot become
  preregistered qualification after seeing the outputs.
- the [portfolio](../adaptive-evidence-portfolio-v1-report.md) is explicitly
  a structural fixture. it does not add new agent attempts.
- `src/operational-capability-evaluation.mjs` first matches authored prompts
  against the same record's declared case kinds. those checks are useful
  contract regression tests, not independent evidence of skill-assisted
  execution or general language understanding. its own limitation says so.

fresh targeted verification in this audit: five named test files passed,
covering intent runtime, core router, routing index, operational promotions,
and specialist preference routing. at the documentation integration gate,
the full suite reported 843 tests: 842 passed, one skipped, zero failed or
cancelled, in approximately 10.1 seconds. this verifies the existing software
regressions after documentation changes, not the proposed v1 architecture or
agent performance. 71 relative documentation links and eight recorded probes
were also checked.

## release-reporting defect

at the inspected Godagents source, its current-head builder contains literal
passing counts and writes an artifact before the full/focused test calls.
an interrupted run can leave a structurally valid but unproven pass claim.
the Godagents task independently confirmed this and owns a targeted repair:
validate historical snapshots as historical, run checks before publication,
use observed results, and atomically replace the current artifact only after
success. preserve the previous artifact on failure or interruption.

this is a release blocker for that refresh, not evidence that every historical
test result is false. do not rerun or rewrite every old certificate to fix it.

## organization and completion

the former README is preserved in [history](../history/README-before-2026-09-06.md).
the front page now distinguishes the current library, experimental runtime,
and historical milestones. no executable, schema, policy, skill body, source
card, or receipt is changed by this reconciliation.

the [completion contract](../superpowers/specs/2026-09-06-godskills-v1-completion.md)
sets the critical path: honest release closeout, unified portable discovery,
substantive skill refinement, outcome qualification, one real integration,
then a versioned release. the architecture remains universal; Lunari is not
the acceptance test for this product.
