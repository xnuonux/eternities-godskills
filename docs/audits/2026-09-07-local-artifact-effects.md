# Explicit local artifact effects: separate candidate

Date: 2026-09-07. Status: isolated partial coverage improvement; motivating
held-out effect omissions remain unresolved.

Branch: `fix/explicit-local-artifact-effects`, based on preserved ranking/study
branch `61612a5be785ad11ecd7901b5a648fc4988e0057`. Initial implementation:
`5894cefa193b95baed5f4b05e84ad8142260389c`. Review correction:
`108ad227a195391a0ac833d83b16c3026cbff8f6`. Main remains `2ccdacf8`.

## Scope and root cause

Existing mutation inference recognizes verbs including build, edit, fix and
implement, but not direct create/write/save requests for local artifacts. A
fresh request such as `Create a local file named notes.txt.` therefore declared
only local-read. This repair adds effect declarations, not execution permission.
It does not modify skill ranking, capability cards, proposal admission or native
eligibility. The held-out data and adjudication were not read for tuning.

The new helper recognizes bounded direct filesystem imperatives involving
create/write/save/generate/emit/make and an explicit file/folder/directory target
or an extension-bearing filename. It permits common polite imperative prefixes,
recognizes selected clause boundaries, and excludes fenced examples, discussion
prefixes, chat-only output, explicit no-filesystem and memory-only output, and
explicit remote destinations from this local-creation rule. It does not claim
general natural-language effect inference. Existing external-effect inference is
preserved rather than replaced.

Effects remain independently derived from capability eligibility. If the caller
has only local-read permission, recognized creation adds local-write and the
existing `effect-authority:local-write` decision. It does not grant local-write,
select a different card or bypass any downstream host check.

## Fresh development evidence

`tests/intent-local-artifact-effects.test.mjs` contains 30 new tests. It covers
local file/directory creation and saving, quoted filenames, polite requests,
separate chat explanation, discussion/quoted/fenced examples, negation, chat-only
content, no-filesystem and memory-only output, a different-file prohibition, and
local creation combined with publication, production deployment or spending.

The first run exposed the 13 missing creation declarations. It also exposed an
unrelated existing external-effect false positive for the noun `message` in a
discussion request. That unrelated inference was not changed: the negative
controls assert the intended local-write boundary, not an inaccurate claim that
every other effect classifier is repaired.

Three additional scope controls first failed for explicit without-saving,
without-touching-filesystem and memory-only qualifiers, then passed after the
recognizer was narrowed. Targeted final run: 107 tests pass, zero failures.
The existing 151-case routing arena remains 151/151, with 92/92 exact positive
selections and zero measured unsafe selection, authority invention, repeatability
or over-composition failures. These are fixture measurements, not execution proof.

Initial candidate compiler SHA-256:
`30265c62131936d9cb32bd931f02072e6279177806660eaa403ee0ba61725879`.
Host logs: `godskills-local-artifact-red.tap`,
`godskills-local-artifact-scope-red.tap`,
`godskills-local-artifact-final-targeted.tap`, and
`godskills-local-artifact-full.tap` in the host temporary directory.

Full candidate run at `5894cef`: 926 tests, 915 pass, ten failures, one skipped,
zero TODOs. The failures are the four preserved generic-padding regressions,
five exact compiler/source-closure certification checks, and the existing
global-instruction-wording check. This is not a passing release suite.

## Independent review and parsing correction

The Godagents task independently reviewed the two-file candidate without reading
held-out cases for tuning. All 30 fresh tests passed, but new probes identified
lost quoted-discussion scope, missed quoted filenames with spaces, a chat-only
veto erasing a separately requested save, and missing plural file targets.
These findings were reproduced as failing tests before correction.

Quoted operands are now masked before clause splitting, then interpreted only
as operands of a direct action. This keeps quoted prose from becoming an action
and preserves spaces/punctuation within filenames. Filesystem noun targets allow
bounded descriptive/plural forms; referential `save it as a file` is explicit
file creation. Coordinated actions are parsed within a direct imperative,
excluding instructional subordinate clauses, and channel restrictions apply to
each action. No global keyword weights or external-effect logic changed.

The four review probes plus filename punctuation and two subordinate-discussion
controls bring the fresh file to 37 tests. Corrected targeted run: 114 pass,
zero failures. Corrected compiler SHA-256:
`5ec1e15c7bd1eaf342cf7c5b65fb2d7725cc4ad220e8160299560bb6de2bf2af`.
Logs: `godskills-local-artifact-review-red.tap`,
`godskills-local-artifact-reviewed-targeted.tap`,
`godskills-local-artifact-reviewed-full.tap`.

Corrected full run at `108ad227`: 933 tests, 922 pass, the same ten held failures,
one skipped, zero TODOs. No additional failure category appeared. This remains
an unqualified candidate, not a passing release suite.

The independent Godagents re-review at exact `108ad227` read the helper diff and
all fresh tests, reran 37/37 successfully, and confirmed all four specific prior
findings closed. This is bounded review closure, not a general parser guarantee.

## Frozen post-repair replay: motivating gap not closed

After review, one frozen read-only replay against the previously used held-out
partition still reported **two missing required effects**, unchanged from main
and the ranking candidate. No held-out text, IDs or labels entered the tuner's
context, and no rule change was made in response. This replay is reuse of an
existing study set, not fresh independent qualification.

The result is preserved at
`D:/00-INDEX/operations/2026-09-07-godskills-applicability/heldout-post-local-effects.v1.json`,
SHA-256 `c4c43bef8e711bbf6b7baaf5f7c6e482e298c9499e42246c830739d5c5cfddb5`.
It binds candidate `108ad227` and unchanged evaluator/data hashes. Other aggregate
candidate metrics stayed at zero unrelated clean admissions, 6/6 expected
shortlist entries retained, one eligible selection miss, and zero missing
required decisions, authority invention or default/specialist disagreement.

Therefore this candidate improves the verified direct-command forms but does
**not** demonstrate repair of the two motivating observed effect omissions.
Do not relabel them fixed because the development tests pass. Preserve this
negative evidence and pause further imperative/synonym expansion against this
corpus. The next decision concerns reliable semantic effect declarations versus
heuristic natural-text inference, with a separately frozen mechanism and new
independent evaluation, not repeated tuning on these hidden cases.

## Hold boundary

The four active generic-padding applicability regressions are unchanged and still
block broad qualification. Historical certification/source closure checks and the
unrelated global-instruction-wording failure also remain separate release gates.
No receipts, main branches, Godagents pins or global instructions were changed.
Improved requested-effect declarations do not prove execution safety, general
semantic admission or successful completion of the original live mission.
