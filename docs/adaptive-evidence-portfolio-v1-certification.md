# adaptive evidence portfolio v1 certification

certified: 2026-08-31

disposition: `certified-reporting-only-portfolio-protocol`

proof level: `deterministic-structural-fixture-with-host-pinned-witness-boundary`

reviewed implementation head: `cc6032be62a013a1d900257933ccdc5b328ac678`

independent defect-finding review head: `209e5af3b81f828e92b8570b0fada90895e85ad9`

post-repair independent re-review: `not performed`

aggregate receipt: `54ccdbb41099b1e230c8d393f3ffa9dc84b0e6a046ea4a81ca7595448cc5b819`

plan witness: `9b0216dbb965ee2ede1f35bfeeebecfe264f0779a16d1a5227b84cc53872fc5f`

## certified scope

this disposition covers the cross-trial portfolio v1 policy, exact-set plan,
host-pinned Ed25519 preregistration-witness verifier, independently reverified
trial completion receipts, task-level reducer, closed schemas, deterministic
structural fixtures, and aggregate release receipt.

the protocol counts one outcome per preregistered task. it never sums a
trial's internal oracle cases, never shrinks an incomplete cohort into a
passing one, and fails a candidate when any task carries a critical
regression. every completion and report binds the exact signed plan witness
and expected authority trust-root digest.

this is not model-quality evidence. it does not promote a capability profile,
change lifecycle state, request activation, modify Godagents, install a global
runtime, or expand authority.

## frozen identities

| artifact | logical identity | file SHA-256 |
|---|---|---|
| aggregate receipt | `54ccdbb41099b1e230c8d393f3ffa9dc84b0e6a046ea4a81ca7595448cc5b819` | `119cd1473968d2f2f16a758e546d054a6131f19baee75aab5fbb01655304e0e1` |
| portfolio plan | `8500f4dba507c097184610931f2390d79bb767075fd501b63bd11d7c7d041b59` | `ad0350f41b79fb7a3b51f8c995ea0fe2b073ba7ad3b2631045977bc971161ee5` |
| preregistration witness | `9b0216dbb965ee2ede1f35bfeeebecfe264f0779a16d1a5227b84cc53872fc5f` | `58c0385300968ec3c101665b9cdf8af654e82da22aba320b54368291e83f9fa3` |
| witness trust root | `2f9acbb8d90ea560bdd4bb650edb89af3b293e0602f078ca1bcb1d28cbc1ca93` | bound inside the aggregate receipt |
| portfolio report | `43fd6185131e28da34131890a809bf600e68182aca616b99a489895ed6fc80e5` | `57f91b63a9246d4cbfa510a4f3a791590c1a3395ff15be4af896306a390b7ad7` |
| filesystem completion | `cbde25a7fabb671c6176eeaded76b48089bbb400175af68ed639016e4345964f` | bound in the output manifest |
| provider completion | `ef9da8e04033b17821155b44830dc0ef65c260f86e581d0c37b997abb93d4722` | bound in the output manifest |
| portfolio policy | `7c25686f921ee45ce6db83a01c176d6e342534935e92b6f2e02ace023d7c0492` | `1e5de10fb100c38ae7dee15304bab2a236de040c101fb46d6d07be3df595c74c` |

the frozen parents remain:

| parent | receipt digest | file SHA-256 |
|---|---|---|
| adaptive evidence v2 | `2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d` | `7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a` |
| adaptive evaluator packages v1 | `a7649453504001333f103521d4dfe1e016de7041b70c6d910507c7d1734f1334` | `ae7ded06bbed4aa0e2dea32dad9f841c1427f9abade57b86ad19c25b261bd519` |

## acceptance disposition

| condition | disposition | evidence |
|---|---|---|
| exact preregistered set | pass | two exact task slots are plan-bound and extra, duplicate, aliased, or missing members fail closed |
| task-level counting | pass | ledgers with 3 and 3000 internal cases still produce exactly two task outcomes per candidate |
| worst-task gate | pass | the fixture method wins both tasks but one critical regression prevents passage |
| signed chronology boundary | pass with external trust assumption | the exact plan is signed before trial registration and verified against a host-pinned Ed25519 root |
| counterfeit authority object | pass | a duck-typed verifier claiming the pinned digest is rejected by module-private authority identity |
| exact semantic verification | pass | plan, witness, completion, and report schemas are structural only and every runtime verifier recomputes identity and cross-field rules |
| parent compatibility | pass | protected activation, evidence, evaluator, and package-manifest git blobs match base `100f32a6d9d5437bb4352f0a092c2c2c086535e1` exactly |
| deterministic output | pass | two consecutive builds changed zero bytes across all 17 generated and receipt files |
| full repository gate | pass | 743 tests passed with zero failures, skips, cancellations, or todos, including the certification-integrity test |
| authority neutrality | pass | no profile promotion, lifecycle action, activation request, Godagents activation, or authority expansion is emitted |

## review history and repairs

an initial bounded schema review found that the schemas did not state the
mandatory runtime semantic-verification boundary strongly enough and that the
report status constraints were looser than the portable structural contract
allowed. those findings were repaired before candidate
`209e5af3b81f828e92b8570b0fada90895e85ad9`.

the independent Spark reviewer `McClintock`
(`01a0575b-2289-7920-811d-4759b7ebf9a5`) then reproduced an important defect
in that candidate: a caller could backdate `registeredAt`, so a digest-bound
plan timestamp did not prove pre-dispatch selection. the release was stopped.

repair head `cc6032be62a013a1d900257933ccdc5b328ac678` adds an exact signed witness
record, host-pinned Ed25519 trust root, plan and policy binding, signed
`dispatchNotStarted` statement, strict witness-before-trial chronology, and
witness identity in every completion and report. retained tests reject
attacker signatures, altered plans, wrong roots, late witnesses, malformed
chains, and forged chronology.

the final inline adversarial pass found a second form of the same boundary
failure: a caller could provide a counterfeit JavaScript verifier object that
claimed the pinned digest and returned a fabricated success result. a failing
regression test reproduced the bypass. the repair now accepts only authority
objects created by the witness module and held in its private identity set,
then separately checks the host-pinned digest and actual signature.

the user explicitly prohibited further subagents after these repairs. no
post-repair independent re-review occurred, and none is claimed. exact-head
clearance consists of the retained adversarial regressions, inline source and
trust-boundary review, deterministic rebuilds, focused compatibility tests,
and the full repository suite. the earlier review remains valuable as a
defect-finding review, not a clean final verdict.

## verification evidence

- focused parent and portfolio compatibility gate: 55 passed, 0 failed
- reviewed implementation full `npm test`: 742 passed, 0 failed
- final release full `npm test`: 743 passed, 0 failed
- syntax checks: pass for the portfolio compiler, witness verifier, fixture
  signer, and release builder
- deterministic rebuild: 17 files compared twice, 0 changed bytes
- `git diff --check`: pass
- receipt manifest: every generated file is bound by exact SHA-256 and byte
  length
- protected parent audit: nine named paths, including `package.json`, match
  the exact base git blobs

## witness trust boundary

the signature proves only that a key trusted by the host signed the exact
attestation. production chronology additionally depends on an independently
operated authority that keeps its private key protected, has an honest clock,
and refuses to sign after dispatch. the host must pin that authority's public
trust root outside the untrusted request.

the fixture private key is committed solely for deterministic protocol tests.
it is public test material, not a production credential and not a production
trust root. the fixture therefore demonstrates verifier behavior, not an
independent production timestamp or real preregistration event.

the signed sequence and previous-witness digest are tamper-evident metadata.
this repository does not prove the completeness of an external append-only
registry or the honesty of its operator.

## proof limits

- structural protocol and deterministic fixtures only
- no model-quality evidence or recurring-advantage claim
- no retrospective historical trial admission
- diversity-label materiality still requires independent domain review
- witness-authority clock and refusal integrity remain external trust
  assumptions
- no pooled activation profile
- no lifecycle or activation action
- no Godagents activation or adapter change
- no Lunari integration
- no authority expansion

## next evidence boundary

the next admissible step is a real, materially diverse, preregistered
portfolio whose plan is witnessed by an authority operated separately from
the trial producer before any model dispatch. only task-complete evidence that
passes this protocol and independent review may inform a later activation or
Godagents-adapter decision.
