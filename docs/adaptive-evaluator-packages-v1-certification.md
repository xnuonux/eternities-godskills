# adaptive evaluator packages v1 certification

certified: 2026-08-31

disposition: `certified-retrospective-evaluator-canary`

reviewed head: `d62ee7e0ee012bb0adc252835904293e83fdb935`

reviewer: `Hubble` (`01a05719-9b1a-7c63-8214-6ece1d1be382`)

aggregate receipt: `a7649453504001333f103521d4dfe1e016de7041b70c6d910507c7d1734f1334`

evaluator package receipt: `5eb0360cb487f3525ffcc233dd4eb1ebc0754f89ec434a9cf9b8c96e5d0292f7`

shadow replay: `cab71a0bf4c889ccbb2b60ae2502adfd1c9dd3829a5605f341723e1951b002ca`

proof boundary: `package-integrity-and-retrospective-deterministic-evaluation-only`

## certified scope

this disposition covers the versioned adaptive evaluator package protocol, its
deterministic package and aggregate receipts, the pinned Aegis v2 evaluator,
and the ineligible replay of five immutable Aegis artifacts. it proves that the
reviewed evaluator package can be rebuilt from exact local bytes, that its
closed request and result contracts fail closed under the tested controls, and
that the archived artifacts are interpreted deterministically without changing
their v1 evidence.

the certification does not turn the retrospective replay into a trial. it does
not authorize a ledger row, profile recommendation, lifecycle action, runtime
routing change, Godagents adapter, global installation, or Lunari integration.

## frozen identities

| artifact | exact identity |
|---|---|
| aggregate receipt logical digest | `a7649453504001333f103521d4dfe1e016de7041b70c6d910507c7d1734f1334` |
| aggregate receipt file SHA-256 | `ae7ded06bbed4aa0e2dea32dad9f841c1427f9abade57b86ad19c25b261bd519` |
| evaluator package logical digest | `5eb0360cb487f3525ffcc233dd4eb1ebc0754f89ec434a9cf9b8c96e5d0292f7` |
| evaluator package file SHA-256 | `da38b9af701d3dcea7e8ca3dde62a8252895b1dbfd45068d2096fab93952ae80` |
| shadow replay logical digest | `cab71a0bf4c889ccbb2b60ae2502adfd1c9dd3829a5605f341723e1951b002ca` |
| shadow replay file SHA-256 | `3acc919b24a8eb87eb747e945728e9c781463afec8c00c4a79024c4f65c5638e` |
| adaptive evidence v2 parent digest | `2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d` |
| adaptive evidence v2 parent file SHA-256 | `7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a` |
| evaluator entrypoint SHA-256 | `253dcc5a506c276d3852f186f40993e5a27c7357efdc7f0324c6c7ac5cf73187` |
| package protocol SHA-256 | `c8095ecab2723c6a4d26ec80dceb4b93ca88fcfa74dfbc6f2dba642331684a19` |
| protected activation scanner SHA-256 | `3bb0d825e6838b901315e685f9e5b02c94dac316ccb7788f54cd6fd18cd6a6ab` |
| evaluator module parser SHA-256 | `b5eb49b1bba8b5eb3db7b09b34518e34e178435ff7a110dd66f52d8772560194` |
| pinned Acorn 8.18.0 parser SHA-256 | `953573b8fdab71599749ea5f2b33d3e760c2116178f9423ee7458dbe39d59453` |
| package lock SHA-256 | `e0b5c43f574e04c2ae7b9c0df4a1f09b609879341a8b6294a5de470009d7565c` |
| package builder SHA-256 | `287d80c0c2a2011b8c03c21d03ceb3fac3d427abe914721655e3248fa998d546` |
| replay builder SHA-256 | `794f37a5658d4d41dfbf34878f60c947a6f05ab3187b0f0e0b1375b4aa3dec1b` |
| historical host-policy snapshot SHA-256 | `dd37170be0e916515d26a8520d73c81ec566ffd1bc2fd9c1a49b44d0881ddeab` |
| oracle logical digest | `be981827a3588790d3b664feb58e6d7fdfdbd99f045c6d40f4f3e3be3051f469` |
| oracle file SHA-256 | `df3b9ef38e4e6f96a4b61ba2b607f72ea5c3b2c1bbdeb3b027901b4c96584345` |
| task definition logical digest | `0568ed329d3e3971317ba5039723e3c61f1fe9326c32e9e759e462f63a1eeec9` |
| task definition file SHA-256 | `71dc6ba5957d7183e4e0f6d99c650d3244cc3e6808c111706b4c74df09f49aa7` |
| runtime record file SHA-256 | `01e13ddf8e97050c7a0fc479566de8dca5d30e80c633ee447cfed7c2d2ac8e04` |

the evaluator package records this exact static import graph:

1. `src/aegis-evaluator-v2.mjs`
2. `src/adaptive-evaluator-package.mjs`
3. `src/adaptive-evidence-contracts.mjs`
4. `src/io.mjs`

`staticImportsComplete` is true for that direct graph.
`runtimeCodeGenerationProvenAbsent` and `runtimeClosureComplete` are both false.
the builder does not classify runtime code generation. direct `Function`,
computed constructors, and equivalent arbitrary code remain accepted but
untrusted. the receipt is not a hostile-javascript sandbox and does not claim
runtime noninterference.

## acceptance disposition

| condition | disposition | evidence |
|---|---|---|
| closed package protocol | pass | policy, package, request, result, artifact, comparison, and parent objects reject unknown or contradictory fields |
| static package identity | pass | parser-discovered direct local imports, generated schemas, policy, oracle, task, entrypoint, and dependencies are byte-bound; syntax errors, path escape, symlink aliases, missing files, commonjs, bare imports, and direct dynamic loading fail closed |
| honest runtime boundary | pass | the receipt expressly declines to prove runtime code-generation absence or runtime closure and requires a separately isolated host for arbitrary evaluator code |
| critical source grounding | pass | critical flow requires either an exact digest-bound legacy witness or the closed `flow: source -> sink` grammar with exact source-bound aliases |
| critical location grounding | pass | location requires either a bare closed line range or an exact legacy digest and must contain every oracle-required source line |
| finding isolation | pass | one-to-one assignment prevents finding reuse and deterministic digest ordering resolves ties |
| baseline and parent lineage | pass | complete artifact and result bodies are rebound, deterministically replayed, and reviewer/combined chains must share the exact raw lineage |
| historical compatibility | pass | all 19 frozen activation and Aegis files, 44 skill entrypoints, and three capability manifests retain their pre-phase SHA-256 identities; the historical trial replays against its exact archived 9,384-byte host policy instead of today's mutable global file |
| shadow ineligibility | pass | ledger, profile, lifecycle, and Godagents admission flags remain false and the adaptive evidence proposal API rejects the shadow as a trial |
| transactional outputs | pass | an injected later rename failure restores all seven checked destinations byte-for-byte |
| deterministic rebuild | pass | two consecutive builds changed zero of seven checked outputs |
| receipt honesty | pass | every declared source, archive, runtime, parent, package, shadow, and output row matches the actual file bytes and logical digest |

## independent review and repairs

the reviewer first inspected
`95cd9c32be67f2438da200250f8024f14edd8dd7..ccd8dbd89be6275dd16a2280e0f259ff605de3c2`
and reproduced four important defects: a false executable-closure implication,
disconnected critical keyword stuffing, arbitrary-number location acceptance,
and split baseline/review-parent lineage.

the first repair at `4c9cff4107a2415d2311312b4092a88b31bd7eec`
closed the exact witnesses and added full deterministic prior-result replay. a
second adversarial pass found three narrower bypasses: a computed-constructor
escape from the lexical screen, a same-clause explicit flow denial, and a
trailing location disclaimer.

the final repair at reviewed head
`fff9ef957169884f7332dbca8af8b9aedb8e7479` removed the false code-generation
claim and replaced open-ended critical prose with exact digest-bound legacy
witnesses or closed structured forms. the same reviewer then reran the bypass
probes, mutated the legacy witnesses, exercised the exact structured positive
case, inspected lineage and rollback, and found no remaining critical or
important defect.

a final compatibility repair at reviewed head
`cfc116f1fc96124255da7020350c42782bb7fa6d` restored the shared activation
scanner to its pre-phase bytes, isolated the conservative lexical screen inside
the evaluator package builder, and archived the exact host-policy bytes used by
the historical Aegis trial. the certified historical evidence builders also
remain byte-for-byte unchanged; replay loads their already-frozen environment
and trial while separately checking the archived policy bytes. this keeps the
activation and evidence trust roots stable and prevents a newer live Codex
policy from being misrepresented as part of an old trial.

the reviewer then reproduced two evaluator-builder defects against that head:
screened bytes could differ from the bytes already hashed into the receipt, and
raw screening rejected inert JSON or comments. reviewed head
`8906935a7d68884730677fb279bc47aaa5061b7c` now compares the reread module length
and SHA-256 to the closure row before screening, skips JSON modules, and strips
comments from executable modules. dedicated regression tests retain both
witnesses.

one further adversarial pass showed that `//` inside a valid regex character
class could confuse the comment sanitizer and hide a later direct `Function`
call. reviewed head `4697862d5fbe92d6fa772eb659eeec357f017ce3`
now recognizes and masks regex literals, including escapes and character
classes, before screening the remaining executable source. the exact bypass and
an inert regex containing the word `Function` are both retained as controls.

the next pass demonstrated that any partial javascript lexer here would keep
creating a false security boundary. final reviewed head
`2b65aee4c340361e9679bcffd27716dd451eb59b` therefore removes runtime screening
from the receipt builder. the layer now proves only exact bytes and direct
static-import closure, explicitly accepts all retained runtime-code-generation
witnesses as untrusted code, and requires isolation at the execution host.

the reviewer then proved the inherited comment stripper could omit a static
import after a regex literal, violating that remaining closure claim. final
reviewed head `bd0510cfb888955e8fea07f6588679c2cb373c8a` leaves the certified
activation scanner untouched and gives evaluator packages a separate
Acorn-backed ECMAScript module parser. the exact omission witness now binds its
helper module, and changing that helper changes the aggregate identity.

the next review found that raw percent-encoded specifiers could resolve as
different file URLs at execution time. final reviewed head
`d62ee7e0ee012bb0adc252835904293e83fdb935` rejects percent encoding before
resolution. encoded-name aliases and encoded dot-segment traversal both remain
as fail-closed regression witnesses.

## verification evidence

- focused adaptive evaluator gate: 25 passed, 0 failed
- full `npm test`: 725 passed, 0 failed
- seven generated destinations rebuilt twice with zero changed hashes
- aggregate receipt audit checked every declared input and output against actual bytes
- frozen compatibility audit: 66 exact pre-phase paths, zero drift
- syntax checks: pass for both builders, both evaluator protocol modules, the evaluator, and the static scanner
- `git diff --check`: pass
- reviewer final disposition: no remaining critical or important defect

the protected activation compiler, policy, and historical evidence retain their
pre-phase git blobs:

| path | git blob |
|---|---|
| `src/adaptive-activation.mjs` | `3f263e2f68f006b42bda33805eca09add9d74727` |
| `policies/adaptive-activation.v1.json` | `1bdc9636284589f2a335d65efa8e61e815d01bbb` |
| `artifacts/adaptive-activation/evidence.v1.json` | `9b9f77b3acbddc406da1c112b3a3cb3376c4960a` |

## proof limits

- package integrity and Aegis v2 deterministic behavior only
- retrospective replay is not preregistration
- no model quality or recurring-advantage proof
- no cross-trial portfolio or pooled profile
- no lifecycle action, global activation, Godagents adapter, or Lunari integration
- no hostile-javascript runtime isolation proof
- no arbitrary-host equivalence
- no authority expansion

## next evidence boundary

the next admissible milestone is a versioned cross-trial portfolio that keeps
independent trials separate from task-local oracle cases. only after fresh,
preregistered, replicated task evidence clears that boundary may a later phase
consider profile promotion or a Godagents adapter. this certification itself is
not such evidence.
