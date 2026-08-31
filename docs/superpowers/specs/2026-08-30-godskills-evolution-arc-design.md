# Godskills evolution arc v1 design

## status

the evidence-first architecture was approved by Dom on 2026-08-30. this
document defines the complete development arc and the first bounded milestone.
implementation remains gated on review of this written specification.

## decision

evolve `eternities-godskills` through one evidence-first vertical architecture.
keep the existing repository as the source and proving ground until the
portable package and protocol interfaces survive real cross-host trials.

the system will progress from monolithic skill entrypoints to independently
addressable capability layers, then to evidence-qualified activation, typed
composition, portable `.godskill` packages, a provider-neutral protocol,
observability, adapters, and field certification.

Muse, Forge, and Aegis are the first canaries because together they exercise
creative quality, multi-stage engineering, and adversarial trust boundaries.
the remaining capabilities do not migrate until the canary path passes its
artifact, authority, compatibility, and cost gates.

## context and evidence map

### verified implementation facts

- `main` is synchronized with GitHub at `2c6a517` when this design begins.
- Godskills System v3, agent-native router v8, intent compiler v3, the mission
  skill stack, and the portable capability manifest are present.
- the portable manifest represents 22 top-level Godskills and 22 operational
  capabilities.
- adaptive amplification v1 separates selection from `native`, `guardrail`,
  `method`, and `review` activation.
- adaptive v1 accepts only its exact trusted policy and reviewed evidence
  registry. selection and activation cannot expand authority.
- raw Terra won three of four reviewed visual product preferences against the
  Muse v4 candidate. Muse remains experimental and is not method-eligible.
- the current full repository verification baseline is 632 passing tests with
  zero failures.
- existing `SKILL.md` entrypoints and capability contracts remain the currently
  consumed portable method boundary.

### approved intent

- make Godskills universal across coding agents, general agents, local models,
  hosted models, MCP hosts, Godagents, and later Lunari.
- remove slash commands and catalog memorization from normal user interaction.
- preserve strong native model behavior and spend context only when an
  intervention earns its cost.
- support independently useful routing, guardrail, method, review, and
  verification layers.
- learn from matched outcomes, raw successes, failures, and model-specific
  behavior without permitting self-authorized promotion.
- define a portable `.godskill` package and provider-neutral protocol after
  real layered and composed behavior establishes the necessary interfaces.

### assumptions

- the existing repository remains private and first-party during this arc.
- Node.js 24 ESM, canonical JSON, SHA-256 identities, `node:test`, and immutable
  receipts remain the local implementation substrate.
- current certified receipts are historical evidence and are never rewritten.
- compatibility with the current `SKILL.md` consumer remains required until a
  separately certified adapter replaces it.
- Godagents may consume the protocol, but actor identity, genesis, cortex,
  Realm Contracts, continuity, and execution governance remain owned by the
  Godagents repository.

### unknowns that do not block the first milestone

- which non-OpenAI models and reasoning tiers will be available for later
  cross-model trials;
- whether package signatures will use an existing signing service or a local
  first-party key boundary;
- whether the protocol and SDK ultimately remain here or graduate to a separate
  repository;
- what public distribution, marketplace, or third-party governance model may
  eventually exist.

## scope

### in scope

- layered capability artifacts and their compiler;
- activation policy and evidence evolution;
- shadow activation and causal evaluation;
- model-qualified profiles and deterministic invalidation;
- typed capability inputs, outputs, effects, and composition;
- one coherent compiled mission method rather than prompt concatenation;
- `.godskill` packaging, verification, and protocol messages;
- counterfactual replay, raw-success harvesting, and failure-derived gaps;
- activation observability and context economics;
- thin provider and host adapters;
- adversarial, cross-model, and field certification.

### outside this repository

- Godagent identity, constitutions, genesis, persistent runtime, cortex
  replacement, delegation authority, and Realm execution;
- Lunari product integration until the universal path is certified;
- credentials, production deployment, billing, public marketplace operation,
  and third-party account mutation;
- executing third-party skill code during ingestion or evaluation;
- automatically converting model output into trusted evidence, policy, or
  promotion authority.

## requirements

### capability representation

- **GS-ARC-001:** every migrated capability has one immutable layer manifest
  that binds its route card, guardrails, method, reviewer, verifier, contract,
  source entrypoint, and schemas by digest.
- **GS-ARC-002:** `native` transports none of those selected layer bodies.
- **GS-ARC-003:** `guardrail` transports only contract-derived constraints and
  never method or reviewer prose.
- **GS-ARC-004:** `method` transports the exact selected bounded method and
  contract only after explicit intent or trusted matched evidence qualifies it.
- **GS-ARC-005:** `review` transports no selected body before the first artifact
  exists, then loads the exact reviewer layer in a distinct evidenced phase.
- **GS-ARC-006:** the verifier layer contains deterministic acceptance and
  rejection contracts and cannot represent a test as executed without an exact
  observation receipt.
- **GS-ARC-007:** current `SKILL.md` consumers remain compatible throughout the
  additive migration.

### evidence and activation

- **GS-ARC-008:** activation profiles are keyed by capability, task class,
  model family, reasoning tier, consequence class, capability version, and
  evaluation environment identity.
- **GS-ARC-009:** structural validity, routing accuracy, source count,
  popularity, or self-report cannot establish model-quality superiority.
- **GS-ARC-010:** shadow mode records the activation that would have occurred
  while preserving an uninfluenced native attempt.
- **GS-ARC-011:** causal trials can distinguish raw, guardrail, method, reviewer,
  and combined effects rather than attributing one stack-level result to every
  layer.
- **GS-ARC-012:** profile evidence becomes ineligible when any bound capability,
  model, policy, task definition, or material environment identity changes.
- **GS-ARC-013:** promotion and demotion require a pinned policy, exact matched
  evidence, critical-regression accounting, and explicit authority.
- **GS-ARC-014:** raw successes and repeated failures may create candidate
  mechanisms or gap reports, never trusted skills directly.

### composition

- **GS-ARC-015:** each capability declares typed inputs, outputs, effects,
  preconditions, failure states, and termination states.
- **GS-ARC-016:** composition accepts at most the host and release ceilings and
  refuses incompatible types, effects, authority, or lifecycle ownership.
- **GS-ARC-017:** a selected composition compiles into one phase-owned mission
  method. it does not concatenate independent skill bodies.
- **GS-ARC-018:** composition records why each capability is necessary, which
  phase it owns, what it consumes, what it emits, and where control transfers.
- **GS-ARC-019:** a composition conflict yields a bounded unresolved decision or
  no qualified composition, never silent priority by ordering.

### packaging and protocol

- **GS-ARC-020:** a `.godskill` package is inert data with a canonical manifest,
  layer references, schemas, policy compatibility, provenance, evidence
  references, and signatures or local attestations.
- **GS-ARC-021:** package verification occurs before routing or disclosure and
  detects path escape, substitution, truncation, duplicate identity, stale
  evidence, incompatible protocol version, and unsupported effects.
- **GS-ARC-022:** protocol messages separate mission, discovery, selection,
  activation, authority intersection, disclosure, observation, verdict, and
  evidence update.
- **GS-ARC-023:** the protocol is provider-neutral and does not require
  `AGENTS.md`, `CLAUDE.md`, slash commands, or one model vendor's tool schema.
- **GS-ARC-024:** adapters translate host state into the protocol but cannot
  weaken package verification, widen authority, or author activation outcomes.

### economics, observation, and recovery

- **GS-ARC-025:** every disclosed layer reports exact bytes and, when a host
  provides them, tokens, latency, and monetary cost.
- **GS-ARC-026:** expected intervention value is evaluated against quality gain,
  regressions, context cost, latency, and restriction of native search.
- **GS-ARC-027:** observability stores identities, metrics, verdicts, and proof
  references without storing raw proprietary mission content by default.
- **GS-ARC-028:** every consequential transition is replayable from immutable
  inputs and rejects stale, forged, or cross-mission receipts.
- **GS-ARC-029:** an agent may eject a degrading selected method and return to
  native reasoning only through a recorded transition that preserves the
  original attempt and reason.
- **GS-ARC-030:** failure of optional observability does not fabricate success or
  corrupt the core activation result. required receipt persistence fails closed.

### boundaries and certification

- **GS-ARC-031:** no capability, layer, composition, adapter, or protocol message
  grants authority. every effect is intersected with the host ceiling.
- **GS-ARC-032:** third-party repositories remain inert evidence until exact
  provenance, semantic review, trust reconciliation, and independent
  implementation requirements are satisfied.
- **GS-ARC-033:** certification distinguishes structural, fixture, artifact,
  model, cross-model, field, and universal evidence levels.
- **GS-ARC-034:** claims expose their exact evidence level and proof limits.
- **GS-ARC-035:** Lunari integration cannot begin until package verification,
  activation, review, recovery, and cross-host compatibility have passed the
  preceding gates.

## architecture

### 1. capability layer compiler

the existing entrypoint, capability contract, portable manifest row, and
release evidence remain authored inputs. a deterministic compiler emits an
immutable layered bundle beneath:

```text
artifacts/capability-layers/<capability-id>/
  manifest.v1.json
  route-card.v1.json
  guardrails.v1.json
  method.v1.md
  reviewer.v1.md
  verifier.v1.json
  input.schema.json
  output.schema.json
```

generated layers are not new instruction authorities. every sentence or field
must map to the reviewed source contract, the sovereign method, or an explicit
first-party policy decision. the manifest binds source and output bytes.

the compiler is idempotent. two builds from the same inputs produce identical
bytes and digests. existing `skills/<id>/SKILL.md` paths continue to work while
layer-aware hosts use the new manifest.

### 2. activation kernel v2

activation v2 preserves the four v1 modes and adds model, version, environment,
and evidence-freshness qualification. selection never implies activation.

```text
selection identity
  + task and consequence class
  + model and reasoning profile
  + authority projection
  + real review availability
  + explicit method intent
  + trusted matched evidence
  -> one activation decision
```

the least intrusive qualified mode wins. uncertainty cannot promote method.
an invalid or stale profile falls back to consequence-appropriate guardrails or
native execution.

### 3. shadow and causal evidence arena

shadow mode produces a body-free predicted activation beside a raw attempt.
after an artifact exists, exact reviewer and verifier layers may evaluate it in
a separately recorded phase. matched trials compare isolated interventions.

the arena records direct artifact outcomes, human preference where applicable,
deterministic checks, critical regressions, bytes, tokens when supplied,
latency, and environment identity. synthetic fixtures validate mechanics but
cannot independently promote model behavior.

### 4. evidence ledger and lifecycle controller

the ledger is append-only. an evidence row identifies the capability and layer
versions, task class, model, effort, environment, activation mode, artifact,
verdict, cost, reviewer authority, and proof level.

the lifecycle controller derives current eligibility from pinned rows. it does
not mutate historical outcomes. a version or environment change invalidates
eligibility by mismatch rather than deleting evidence. promotion and demotion
produce new signed or locally attested decisions.

### 5. capability type system and composition compiler

typed contracts describe what a capability needs, emits, may affect, and where
it can terminate. the composition compiler builds a directed acyclic phase
graph from selected compatible capabilities.

```text
mission
  -> required output types
  -> candidate capability graph
  -> authority and effect intersection
  -> compatibility and ownership check
  -> minimal phase graph
  -> one compiled mission method
```

each phase has one owner. supporting capabilities contribute only the layer
needed in that phase. cycles, duplicate ownership, unbound inputs, effect
conflicts, and context overflow fail closed.

### 6. `.godskill` package builder and verifier

the package is a deterministic archive or directory representation of one
layered capability and its public verification material. package content is
inert. installation never executes package code.

the first local version uses digest-pinned first-party attestations. external
signature infrastructure is deferred until the package shape survives canary
and adapter trials. the verifier owns containment, canonical identity,
dependency compatibility, and trust disposition.

### 7. provider-neutral protocol core

the protocol defines data contracts, not a runtime personality. the initial
message family is:

```text
MissionEnvelope
CapabilityQuery
SelectionDecision
ActivationDecision
AuthorityIntersection
DisclosureEnvelope
ArtifactObservation
ReviewObservation
AcceptanceVerdict
EvidenceProposal
LifecycleDecision
```

each message has one owner, schema version, canonical digest, parent identities,
and explicit status. hosts may transport these messages by local functions,
files, MCP, HTTP, or another authenticated boundary without changing their
meaning.

### 8. observatory and replay engine

the observatory is a read model over receipts and evidence. it visualizes which
capability was selected, which layer was disclosed, why, its exact cost, its
artifact result, and its lifecycle state.

the replay engine reconstructs a mission experiment from immutable envelopes
and artifacts. it never reuses a previous verdict after a bound input changes.
raw mission content is referenced by digest unless the user explicitly
authorizes local retention.

### 9. adapter SDK

thin adapters perform only host translation:

- identify model family and reasoning tier;
- project the host's real authority, effects, context, and review capability;
- disclose only compiler-authorized layers;
- return observations and receipts;
- preserve host-specific secrets outside protocol payloads.

Codex, Claude Code, a local-model runner, MCP, and Godagents are initial adapter
targets. Godagents remains the owner of persistent actor execution. this
repository certifies only the capability-side contract.

## data flow

```text
user outcome
  -> host mission envelope
  -> commandless intent compiler
  -> capability selection
  -> activation kernel
      -> native: no body
      -> guardrail: constraints only
      -> method: method plus contract
      -> review: deferred reviewer identity
  -> host or Godagent constructs artifact
  -> verifier and optional real reviewer observe artifact
  -> acceptance verdict
  -> append-only evidence proposal
  -> authorized lifecycle decision
  -> observatory and replay index
```

no backward arrow grants authority or edits historical evidence. model output
may propose an evidence row or candidate refinement, but only a trusted policy
boundary admits it.

## trust boundaries

1. **user and host authority:** the only source of permission for effects.
2. **package verifier:** decides whether capability bytes are authentic and
   compatible, not whether the capability is useful.
3. **selection compiler:** decides relevance under the host ceiling.
4. **activation kernel:** decides disclosure timing and amount from trusted
   evidence, never authority.
5. **agent or model:** produces proposals and artifacts but cannot certify its
   own quality or mutate activation policy.
6. **review and verification:** generate observations at an explicit proof
   level; neither silently changes the artifact.
7. **lifecycle controller:** promotes, demotes, or quarantines through pinned
   policy and authorized evidence.
8. **adapter:** transports identities and bodies but cannot reinterpret them.

## decision ownership

- the user or adopting host owns effect authority, external actions, credentials,
  spending, and product integration approval.
- the Godskills maintainer owns capability source, compiler policy, protocol
  versioning, package trust roots, and release certification in this repository.
- an independent reviewer owns trial verdicts whenever the promotion policy
  requires human or model review. the capability under trial cannot review or
  promote itself.
- the lifecycle policy owner may promote, demote, quarantine, or invalidate a
  profile only through an evidenced decision receipt.
- adapters own faithful host translation, but not selection, activation,
  package trust, or authority expansion.
- agents and models may propose compositions, evidence, refinements, and gap
  reports. proposals remain inert until the owning boundary accepts them.

schema freeze, public distribution, signing-root changes, default activation,
and Lunari adoption each require their own explicit decision. approval of this
architecture does not pre-approve those transitions.

## failure and recovery behavior

- missing or mismatched layer bytes reject the bundle before disclosure.
- uncertain classification cannot enter `method`.
- an unavailable promised review phase converts to the policy fallback before
  execution; it is never recorded as completed.
- a failed reviewer or verifier produces a failed observation, not a missing or
  successful one.
- incompatible capability types or competing phase ownership stop composition
  with explicit conflict evidence.
- context overflow triggers a smaller qualified composition or no qualified
  composition. it never truncates a method silently.
- interrupted trials resume from immutable stage receipts and cannot duplicate
  evidence rows.
- changed capability, model, environment, policy, or task identities require a
  new trial lineage.
- an unavailable optional observatory queues or omits its read model. failure to
  persist a required core receipt stops the transition.
- a degrading method can be ejected only through a recorded return-to-native
  transition that preserves both lineages for evaluation.

## observability and privacy

core receipts include:

- mission and parent digests;
- selected capability and layer versions;
- activation mode and reason codes;
- authority and effect ceiling digests;
- disclosed byte counts and host-reported token or cost metrics;
- artifact and observation digests;
- verifier and reviewer status;
- lifecycle status and proof level.

raw prompts, proprietary source, credentials, private memory, and complete
artifacts are excluded by default. local users may opt into separately governed
retention for replay.

## alternatives considered

### option A: evidence-first vertical arc ... selected

build a complete layered, activated, observed, and packaged path on three
canaries before generalization.

- easier: early usable artifacts, causal failure attribution, reversible
  migration, interfaces derived from reality;
- harder: universal package and adapter breadth arrive later;
- irreversible cost: low, because all changes are additive and canary-scoped.

### option B: protocol-first

specify package, transport, signatures, registry, and SDK before migrating a
capability.

- easier: early conceptual uniformity and clean external documentation;
- harder: interfaces may encode imagined needs and force later compatibility
  baggage;
- irreversible cost: medium, especially if external consumers adopt v1 early.

### option C: parallel moonshot

develop layers, trials, composition, package, observatory, and adapters at the
same time.

- easier: maximum subsystem throughput when every assumption is correct;
- harder: shared schemas churn, causal failures blur, and context and review
  costs rise sharply;
- irreversible cost: high if several components publish incompatible evidence
  or protocol assumptions.

option A wins because current evidence already showed that more injected method
can reduce product quality. the architecture itself must earn expansion through
working vertical evidence.

## migration and reversal

the migration is additive:

1. preserve current entrypoints, contracts, manifests, receipts, and router;
2. generate layered artifacts for canaries without changing default consumers;
3. certify exact equivalence and intentional layer differences;
4. enable layer-aware shadow use through an explicit experimental profile;
5. qualify activation and composition through matched trials;
6. migrate remaining capabilities in bounded families;
7. introduce the package and protocol adapter beside legacy transport;
8. retire legacy-only consumption only after a separately approved compatibility
   gate.

rollback disables the experimental profile and returns all consumers to the
current `SKILL.md` boundary. no historical receipt is deleted or rewritten.

## development arc

the phases are cumulative certification gates, not a calendar. failure at an
exit gate returns work to the earliest owning phase. later-phase code cannot be
used to bypass an unresolved earlier proof limit.

```text
layer ABI
  -> adaptive evidence
  -> typed composition
  -> package and protocol
  -> learning and observability
  -> universal adapters
  -> field certification
  -> Lunari readiness
```

### phase 1: layered capability ABI

compile and certify route, guardrail, method, reviewer, verifier, and typed
schema layers for Muse, Forge, and Aegis. preserve legacy behavior.

- **entry gate:** the current router, entrypoints, source contracts, release
  digests, and 632-test baseline are pinned without modifying historical
  evidence.
- **artifacts:** deterministic compiler, closed layer schemas, three canary
  bundles, aggregate build receipt, disclosure fixtures, and byte-cost report.
- **exit gate:** every first-milestone acceptance condition below passes, the
  historical suite remains green, and an independent trust and compatibility
  review has no unresolved critical finding.
- **rollback:** disable or remove the additive layer-aware fixture and generated
  canary bundles. legacy `SKILL.md` consumption remains the unchanged default.
- **proof limit:** this certifies artifact identity and disclosure boundaries,
  not that any layer improves model output.

### phase 2: adaptive evidence engine

add shadow activation, causal trial records, model-qualified profiles,
deterministic invalidation, and governed promotion and demotion.

- **entry gate:** phase 1 bundles are certified and each trial has a real
  artifact boundary, available reviewer or deterministic verifier, pinned task
  definition, and preregistered comparison policy.
- **artifacts:** shadow decision schema, isolated-layer trial envelopes,
  append-only evidence ledger, profile derivation, invalidation rules,
  promotion and demotion receipts, and critical-regression accounting.
- **exit gate:** fixtures and real canary trials distinguish raw, guardrail,
  method, reviewer, and combined effects; mismatched identities invalidate
  eligibility; and no profile can promote itself or survive stale evidence.
- **rollback:** activation v1 remains available, v2 profiles are ignored, and
  all retained trial rows remain historical evidence rather than policy.
- **proof limit:** every result is qualified to its exact model, task class,
  effort, capability version, policy, and environment. no universal behavior
  claim follows from a canary win.

### phase 3: typed composition

define capability types, compatibility, phase ownership, conflict handling,
and one bounded compiled mission method.

- **entry gate:** canary layer contracts and activation identities are stable,
  and at least one real mission requires multiple capabilities with separable
  phase ownership.
- **artifacts:** capability type schema, effect and authority vocabulary,
  compatibility rules, composition graph, conflict report, budget estimator,
  and deterministic mission-method compiler.
- **exit gate:** one compatible multi-capability mission compiles and executes
  through explicit handoffs; negative fixtures reject cycles, missing inputs,
  duplicate owners, effect conflicts, authority overflow, and context overflow;
  and no emitted method is body concatenation.
- **rollback:** hosts continue selecting one capability at a time. failed or
  unqualified compositions produce no disclosed method.
- **proof limit:** composition proves coherent orchestration for tested type and
  effect families only. it does not establish general planning superiority.

### phase 4: portable package and protocol

freeze `.godskill` v1 from proven layer and composition requirements. implement
the inert builder, verifier, and provider-neutral message schemas.

- **entry gate:** layer and composition interfaces have survived real trials,
  no unresolved canary defect requires a breaking field, and the maintainer
  explicitly approves the v1 freeze candidate.
- **artifacts:** canonical `.godskill` layout, deterministic builder, local
  attestation format, containment and integrity verifier, message schemas,
  state machine, compatibility table, and reference transport fixtures.
- **exit gate:** byte-identical builds verify on two independent fixture hosts;
  path escape, substitution, truncation, duplicate identity, stale evidence,
  unsupported effects, and incompatible versions fail closed; and a complete
  mission-to-verdict exchange round-trips without vendor-specific semantics.
- **rollback:** retain the repository-local layer ABI and mark the proposed
  package or protocol version unsupported. no legacy consumer is migrated.
- **proof limit:** local attestations establish first-party integrity, not a
  public trust network, marketplace safety, or third-party code safety.

### phase 5: learning and observability

add replay, raw-success candidate extraction, repeated-failure gap reports,
context economics, and the local activation observatory.

- **entry gate:** protocol receipts and lifecycle identities are stable enough
  to replay without inferred fields, and privacy defaults have an identified
  owner and threat model.
- **artifacts:** deterministic replay engine, counterfactual comparison view,
  raw-success candidate extractor, failure-cluster reporter, context and cost
  ledger, observatory read model, retention controls, and redaction tests.
- **exit gate:** unchanged inputs replay to the same derived decision; changed
  inputs reject stale verdict reuse; exact disclosure cost is attributable by
  layer; raw mission content is absent by default; and learned candidates
  cannot become trusted skills or evidence automatically.
- **rollback:** disable derived views and candidate generation while preserving
  core immutable receipts. activation does not depend on the observatory.
- **proof limit:** observability reveals measured correlations and replayable
  decisions. it does not prove causation outside controlled trials.

### phase 6: universal adapters

prove Codex, Claude Code, local-model, MCP, and Godagents translations against
the same protocol and package fixtures.

- **entry gate:** `.godskill` v1 and the protocol core are frozen for the trial,
  a conformance harness exists, and each host exposes its real authority,
  context, model identity, and review limitations.
- **artifacts:** minimal adapter SDK, capability matrix, conformance fixtures,
  Codex adapter, Claude Code adapter, local-model reference adapter, MCP adapter,
  and a Godagents capability-side adapter contract.
- **exit gate:** at least four independent host families produce semantically
  equivalent decisions and receipts from the same fixtures; unsupported host
  features fail explicitly; and no adapter widens authority, weakens package
  verification, or stores secrets in protocol payloads.
- **rollback:** each adapter can be disabled independently without changing the
  core package, protocol, evidence, or another host's behavior.
- **proof limit:** conformance proves translation compatibility, not equivalent
  model intelligence, tool quality, or host security.

### phase 7: field certification

run cross-model blind trials, adversarial activation and supply-chain arenas,
cost analysis, compatibility replay, and lifecycle promotion gates.

- **entry gate:** adapters pass conformance, trial budgets and stopping rules
  are fixed, model and environment identities are observable, and reviewers do
  not know which condition produced an artifact when blinding is applicable.
- **artifacts:** cross-model trial corpus, blind preference receipts,
  adversarial Aegis arena, supply-chain mutation suite, compatibility replay
  matrix, cost-benefit report, quarantines, and release-candidate dossier.
- **exit gate:** no unresolved critical trust or authority failure remains;
  claimed interventions beat or safely complement raw baselines under their
  pinned policy; regressions and costs are reported; and every promoted profile
  has exact matched evidence and a reversal path.
- **rollback:** demote or quarantine failing profiles, packages, or adapters and
  return affected missions to the last qualified mode without rewriting trial
  history.
- **proof limit:** certification is bounded to tested releases, hosts, models,
  tasks, policies, and environments. the word `universal` describes protocol
  applicability, never an unevidenced universal quality claim.

### phase 8: Lunari readiness

publish the exact certified interface that Lunari may consume. product
integration remains a separate approved project in the owning repository.

- **entry gate:** package verification, activation, review, recovery,
  cross-host compatibility, and relevant field profiles are certified, and
  Lunari's owning session explicitly accepts an integration design task.
- **artifacts:** versioned Lunari-facing interface, authority and privacy map,
  dependency and threat analysis, compatibility fixtures, adoption plan,
  rollback plan, and proof-limit dossier.
- **exit gate:** the consuming repository independently verifies the interface
  against its own constitution, continuity, action, privacy, and failure
  boundaries before any runtime enablement.
- **rollback:** no Lunari change occurs in this arc. a later integration must be
  independently reversible to its prior capability path.
- **proof limit:** readiness certifies a safe, explicit interface proposal. it
  does not certify a Lunari implementation or authorize Luna to act.

## first milestone handoff: layered capability ABI v1

### observable result

one deterministic compiler produces complete digest-bound layer bundles for
Muse, Forge, and Aegis. a layer-aware fixture can request each activation mode
and prove the exact selected bytes without changing the current router,
entrypoints, contracts, or default Codex installation.

### acceptance conditions

1. identical inputs rebuild byte-identical bundles and one aggregate receipt.
2. every output field maps to an exact authored input or named first-party
   policy decision.
3. route cards contain no method or reviewer prose.
4. guardrails contain only contract-derived success, failure, effect, and
   termination constraints.
5. methods preserve the sovereign capability behavior without quarry or
   provenance bulk.
6. reviewers are artifact-dependent and cannot be loaded in a pre-artifact
   review activation fixture.
7. verifiers distinguish declared checks from executed observations.
8. input and output schemas are closed, versioned, and composition-ready.
9. all layer paths remain contained beneath the repository and all bytes are
   digest-bound.
10. legacy `SKILL.md` consumers and all historical tests remain unchanged and
    passing.
11. canary fixtures prove `native`, `guardrail`, `method`, and `review`
    disclosure boundaries with real read spies.
12. the report states byte and estimated token deltas without claiming quality
    improvement before matched trials.

### explicit non-goals

- migrating all 44 capabilities in the first milestone;
- activating layer-aware behavior globally;
- implementing the Godagents review executor;
- defining public signing or marketplace infrastructure;
- promoting Muse v4;
- claiming that smaller layers are higher quality merely because they use fewer
  tokens.

## validation strategy

- red-green tests for each layer boundary and malformed input;
- deterministic double builds and exact receipt comparison;
- property checks for path containment, closed schemas, ordering, and duplicate
  identity;
- mutation fixtures that leak method prose into route or guardrail layers;
- real filesystem read spies for every activation mode;
- unchanged full-suite verification for historical behavior;
- one independent review of trust, provenance, compatibility, and proof
  language before canary certification;
- later matched raw-versus-layer trials before any model-quality promotion.

## strongest counterargument

the arc could become a large meta-system whose manifests, profiles, receipts,
and protocol messages cost more context and engineering effort than the skills
save.

the falsification signal is failure to demonstrate lower disclosed bytes or
better artifact outcomes under matched conditions without increased critical
regressions. if the canary vertical path cannot show a useful intervention at a
bounded cost, the project stops at the current simple router and adaptive v1.
the package and protocol phases do not proceed merely because their designs are
interesting.

## revisit triggers

reconsider the selected architecture when:

- canary layers cannot preserve essential capability behavior;
- reviewers require full method context before an artifact exists;
- typed composition repeatedly rejects valid real missions or produces larger
  context than selected entrypoints;
- cross-model behavior cannot be keyed without unstable provider-specific
  identifiers;
- package verification requires a trust service unavailable to local users;
- a real external consumer needs a stable protocol before the vertical path is
  complete;
- measured overhead exceeds the value of adaptive intervention.

## completion boundary

this architecture is complete when each phase has an explicit entry gate,
observable artifact, acceptance evidence, rollback, and proof limit, and when
the first milestone can be planned without rediscovering system boundaries.
it does not itself authorize implementation, global activation, Godagents
runtime changes, or Lunari integration.
