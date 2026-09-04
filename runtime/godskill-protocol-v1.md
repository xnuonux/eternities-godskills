# provider-neutral Godskills protocol v1

the protocol is a data contract between an agent host, a capability router, a
verified Godskill package, and an evidence ledger. it carries identity and
proof boundaries without carrying a runtime personality, model prompt, vendor
tool schema, or implicit command language.

## message sequence

the canonical prefix is:

```text
MissionEnvelope
  -> CapabilityQuery
  -> SelectionDecision
  -> ActivationDecision
  -> AuthorityIntersection
  -> DisclosureEnvelope
  -> ArtifactObservation
  -> ReviewObservation
  -> AcceptanceVerdict
  -> EvidenceProposal
  -> LifecycleDecision
```

each message has a closed envelope, one owner, schema version, mission id,
parent message ids, explicit status, and a SHA-256 digest over its unsigned
canonical body. a verifier accepts a partial prefix as incomplete evidence, but
never treats it as a complete lifecycle decision.

## message responsibilities

- `MissionEnvelope` references the objective, authority, and target by digest.
- `CapabilityQuery` declares bounded requested effects and acceptable package
  protocols.
- `SelectionDecision` records one capability or a bounded composition, without
  implying activation.
- `ActivationDecision` records the least-intrusive native, guardrail, method, or
  review mode and cannot expand authority.
- `AuthorityIntersection` narrows requested effects against a host ceiling.
- `DisclosureEnvelope` records the exact package layer and bytes eligible for
  disclosure.
- `ArtifactObservation` records an artifact digest and optional token,
  latency, and cost measurements without storing raw mission content by
  default.
- `ReviewObservation` records who reviewed the exact artifact and at what
  evidence level.
- `AcceptanceVerdict` records whether the artifact is accepted, rejected, or
  uncertain, without turning a verdict into authority.
- `EvidenceProposal` binds the verdict to a candidate evidence record and
  states whether it is eligible for an external lifecycle decision.
- `LifecycleDecision` records retain, promote, demote, or defer under an
  explicit authority digest.

## host adapters

hosts may transport these messages through local functions, files, MCP, HTTP,
or another authenticated boundary. an adapter may translate host state into
the protocol, but it cannot weaken package verification, change parent
identities, widen effect sets, invent an activation outcome, or execute package
content. provider names, model routing, prompt templates, and host-specific
permissions remain adapter state and are not required by this protocol.

## proof limits

protocol verification proves message shape, digest integrity, parent lineage,
cross-message consistency, and explicit authority narrowing. it does not prove
model quality, a real-world effect, external authorization, package safety
beyond the package verifier, or production compatibility. those claims require
separate observations and certification at the relevant boundary.
