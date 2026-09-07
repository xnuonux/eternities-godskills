# godskills v1: finite completion contract

status: selected architecture and release plan, not an implemented v1 claim.
decision owner: dom. engineering owner: the Godskills task, coordinating the
existing Godagents task. baseline and evidence are in the
[product audit](../../audits/2026-09-06-product-state.md).

## purpose

make any capable agent better equipped to deliver professional work across
disciplines, without requiring users to memorize slash commands, load thousands
of instructions, adopt a particular agent identity, or surrender ordinary
model competence to a rigid workflow. preserve ambition, creativity, and
specialist depth. quantify improvement instead of promising absolute superiority.

v1 is complete when its declared release surface is discoverable, portable,
substantively reviewed, reproducibly tested, and honestly qualified. it is not
complete because every future human task has been solved. completion closes
this release; later discoveries enter a versioned backlog, not an endless
automatic expansion of its definition.

## architecture decision

| option | advantages | costs and risks |
| --- | --- | --- |
| mandatory unified Godskills/Godagents runtime | one tightly controlled execution boundary | requires runtime adoption for simple skill use; many components must ship together; portability becomes a large integration project |
| skill-pack first, optional tools and runtime integration | useful to a plain file-reading agent; small adoption surface; independent release cadence | unenforced hosts can misuse methods; machine guarantees apply only where the host actually implements them |

choose **skill-pack first**. current evidence supports readable methods and
local contract checks much more strongly than universal runtime adoption.
the strongest counterargument is that prompt-only consumers cannot enforce
authority or recovery. address that with optional host conformance, not by
pretending a markdown file is a security sandbox.

revisit if real adopters cannot use the library reliably without a mandatory
runtime and controlled trials show that the added machinery pays for its cost.
rollback is straightforward: version and keep the old CLI and pinned receipts;
introduce the new product surface additively before deprecating any old path.

```text
user outcome + host authority
          |
     existing agent
          |
 compact directory -> relevant owner -> focused skill or extension
          |                 |
          |            optional selected-body load
          |                 |
     native work <-> guardrail / method / real later review
          |
      actual artifact + task checks + observed cost

optional: Godagents owns persistence, execution, tools, and recovery
optional: keel owns continuity under its own independent contract
optional: cold quarry supplies new pattern evidence to the refinery
```

## boundaries

1. **library:** broad disciplines, focused mechanisms, examples, templates,
   references, tests, and provenance. readable without a JavaScript runtime.
2. **discovery:** compact metadata and selected references. automatic discovery
   means no required slash commands; it does not mean keyword scoring is a
   reliable semantic oracle. the host can use its existing model to select
   candidates. deterministic checks validate identities, budgets, compatibility,
   and authority separately from semantic judgment.
3. **activation:** relevance does not mandate full-method injection. preserve
   native, guardrail, method, and review modes. no real review, no review claim.
4. **evaluation:** separate static validity, executable behavior, actual agent
   outcomes, human preference, and host-security evidence. reuse the existing
   evaluator machinery where useful; do not introduce a parallel receipt system.
5. **host:** the host alone owns tools, credentials, model choice, user approval,
   persistence, and effects. Godagents is one implementation, not the definition
   of a Godskill. a directory record is always untrusted selection data.

normal library use must work without D:, the quarry, Supabase, a keel, a paid
search API, a vector database, Godagents, or an always-running background process.
source mining can keep separate warehouse requirements.

## requirements and release gates

the numbers below are proposed engineering acceptance targets, not measured
performance. changing them requires a documented reason before trial results
are known. they do not modify frozen activation v1 policy.

| id | release requirement | observable acceptance |
| --- | --- | --- |
| R1 | truthful inventory | all 44 current skill directories and 26 extensions have exact typed entries, owners, provenance pointers, and an explicit release disposition; no source count is advertised as skill count |
| R2 | selective discovery | one compact broad directory, owner drill-down, and exact specialist lookup; no body loading during listing; metadata pages limited to five results; broad summary target at most 12 KiB and each page at most 4 KiB |
| R3 | semantic relevance without authority invention | regressions cover api-client/business-client and message-noun/send-message distinctions, absent specialists, unknown benign work, and dangerous requests; high-confidence selection cannot rely on one ambiguous token counted repeatedly |
| R4 | substantively useful skills | each shipped method has a concrete mechanism, a worked example, failure/negative cases, and verification appropriate to its domain; every entry and extension is reviewed rather than mass-promoted from template shape |
| R5 | unbundled portability | a clean relocated checkout can list and read selected skills without warehouse access; a whole-pack distribution is tested outside the development tree; installation preview, collision refusal, removal and rollback are covered |
| R6 | outcome and resource evidence | preregistered task attempts with actual artifacts, comparable model/tool/time conditions, independent task checks, usage and latency records, and honest missing-data labels; no synthetic fixture counted as an agent win |
| R7 | model-conditioned activation | qualify modes only for measured task/model/host conditions, or retain explicit-use/experimental/native status; no hidden global method enablement |
| R8 | practical integration | a plain file-reading host and one optional Godagents adapter follow the same documented discovery/load boundary; local conformance and real host trials have separate labels |
| R9 | truthful release | all release checks finish before atomic publication; previous good results survive failure/interruption; no hard-coded pass count can stand in for an observed test result |
| R10 | finite handoff | versioned library, concise onboarding, complete maturity/limitations table, preserved history, reproducible checks, release notes, and a bounded next-version backlog |

## the completion sequence

### 0. close the current release honestly

Godagents owns the confirmed current-head publication defect. finish only that
repair and its verification, preserve the prior artifact on failure, then
refresh the agreed cross-repository snapshot once. Godskills owns this
documentation reorganization. neither task starts another infrastructure layer
to avoid addressing product gaps.

exit: exact heads and observed checks are known; no orphan passing claim is
treated as a completed release; historical evidence is unchanged. R9.

### 1. make the whole existing library accessible

ship a read-only typed directory over the existing 22 broad cards, 22 focused
records, and 26 extensions. distinguish a display summary from an authoritative
routing card. give every consumer one documented listing and drill-down path.
do not add semantic scoring, body loading, installation, or execution to this
first slice. the [executable plan](../plans/2026-09-06-capability-directory-v1.md)
defines exact files and tests.

exit: R1 and the listing part of R2 pass in a relocated fixture. a new agent
can find the numerical-validation and retry methods without reading the quarry.

### 2. fix the discovery and activation experience

use the recorded routing probes as public development regressions, not a
secret test set. trace the correlated-token and noun/effect failures before
changing the compiler. reuse verified routing/activation boundaries instead of
patching around them with a second permission engine. host semantic proposals
are suggestions, never authority; reject unknown IDs and validate effects
independently. retain the current compiler as an explicitly scoped compatibility
path while testing the unified facade.

benign catalog misses return native work or a catalog-gap record, not a demand
that the user choose a skill. ambiguity about a dangerous effect still requires
resolution. a chosen top-level owner can expose its focused methods without
loading every sibling. do not infer a specialist's availability from its name.

exit: R2, R3 and R7 interface tests pass, including fresh paraphrases and
negative examples from outside the card author's examples. no global host
configuration or frozen policy changes implicitly.

### 3. refine content for leverage, not ceremony

review all 44 entrypoints and 26 extensions in owner-sized batches. prioritize
reproducible deficiencies: fragile integrations, security review, visual/game
quality, science/data validation, truthful marketing, and idea-to-product work.
retain breadth across the remaining families; do not silently make the pack
engineering-only or Lunari-specific.

each review asks: what does this add that the raw agent is likely to miss;
what concrete algorithm, decision aid, tool recipe, worked example, or failure
check provides that value; which repeated preamble can move out of the method;
where does the method overconstrain competent work; what evidence would reject
the proposed change? keep exact specialist knowledge, not just a generic list
of governance principles. defer authority to the host rather than refusing a
normal authorized task merely because the prose says local-only.

use the quarry for a named missing mechanism, not to maximize acquired count.
retain source attribution and licensing obligations where applicable; original
rewriting is not automatic clearance. record each source/skill disposition as
retained, improved, merged with a replacement, explicit-use, deferred, or
rejected, with a reason. no silent loss of useful behavior.

exit: R4 has an entry-by-entry review and named checks. routing tests alone
cannot satisfy substantive domain review.

### 4. measure actual benefit and choose the lightest effective support

start with six task classes: service reliability, authorized security review,
interactive visual/game work, numerical/data validation, marketing claims, and
idea-to-product integration. preregister four varied tasks per class and one
candidate support mode against a raw baseline on the same model. that is 48
single-attempt runs for the initial one-model pilot, not 48 proof units of
universal superiority. reserve further runs for a declared follow-up, not an
unbounded retry loop. budget and provider permission are settled before dispatch;
no API expenditure is authorized by this document.

freeze task inputs, per-run resource ceilings, tools, activation bytes,
evaluation criteria and candidate mode before outputs. separate public
development examples from qualification tasks. fix evaluator false positives
with independent calibration artifacts before dispatch. preserve failed runs
and missing observations. for creative tasks use blinded human preference plus
interaction/accessibility/performance checks; for software and numerical work
use artifact execution and independent oracles. score a task once, not once
for each assertion it contains.

report paired outcomes, uncertainty, critical failures, actual billed/cached/
uncached usage where available, elapsed time, artifact quality, and retry cost.
equal model/tool/attempt limits are required; an unmatched review pass gets its
own ablation and cost, not a free advantage. a loss is useful evidence: simplify,
switch to review/guardrail, leave explicit-only, or retire the candidate.

then qualify any advertised second-model or second-host claim with matched
tests there. the existing activation gate can remain a compatibility floor,
but three examples or an aggregate win rate cannot support a universal claim.
no improvement claim graduates beyond the evidence population.

exit: R6/R7; a published scorecard distinguishes measured winners, neutral
support, losers, unknowns and explicit-use methods. if performance does not
justify automatic use, release that skill with the correct narrower label.

### 5. package, integrate once, and release

ship the whole declared library as portable files with relative links and a
machine-readable directory. retain an optional tool package and one documented
Godagents integration, not a mandatory daemon. run fresh install/use/removal
and relocation tests plus the final relevant suites. do not claim host live
qualification from descriptors alone. preserve the rollback path and carry
explicit non-goals into release notes.

exit: R5, R8, R9 and R10. all R1-R10 gates have evidence or an explicit
scope reduction approved before calling the release complete. adding new
capabilities after this point is v1.x or v2 work.

## economics and release discipline

keep one bounded milestone active per repository. targeted checks during edits,
one complete suite at a real integration gate, and no repeated unchanged task
polls. reuse a completed agent artifact instead of rerunning it. no new agent
orchestrator, vector service, signed meta-ledger, certification recursion, or
automatic model selector without an observed unmet requirement.

cache optimization starts with stable small descriptions, selected-only reads,
and no unnecessary prompt churn. do not cache user authority, secrets, or an
activation decision across unrelated missions. measure provider cache behavior
where available instead of assuming byte equality guarantees cache hits.

## risks and open evidence

- semantic selection remains model-sensitive; deterministic validation is not
  semantic certainty. the release must tolerate a native fallback.
- contract-heavy skills can suppress creative quality. preserve raw baselines
  and judge the actual artifact, not compliance with a preferred aesthetic.
- a full adversarial host platform, hosted tenancy, cross-machine scheduling,
  self-evolution, Soul activation, and Lunari production integration are not
  prerequisites for the portable skill-pack v1. they remain separate projects.
- paid trial budgets and available models are execution-time facts. mark a
  blocked qualification honestly rather than inventing evidence or spending.
- unsafe same-user processes are outside a markdown library's control. say
  what the host enforces and what it does not.

## stop rule

do not stop early at a source count, a routing score, a passing fixture, or a
renamed folder. do stop this release when the ten gates are satisfied and the
deliverable is usable. ambition continues through deliberate versions, not an
indefinitely moving finish line.
