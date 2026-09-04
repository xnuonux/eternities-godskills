# provider-neutral protocol v1 implementation plan

## goal

Add the first provider-neutral Godskills message core required by the approved
evolution arc. The core will validate and digest a closed family of data
messages from mission through lifecycle decision without choosing a provider,
loading a skill body, invoking a tool, granting authority, or mutating an
external system.

## constraints and acceptance gates

- implement the exact eleven message types named by the evolution arc:
  `MissionEnvelope`, `CapabilityQuery`, `SelectionDecision`,
  `ActivationDecision`, `AuthorityIntersection`, `DisclosureEnvelope`,
  `ArtifactObservation`, `ReviewObservation`, `AcceptanceVerdict`,
  `EvidenceProposal`, and `LifecycleDecision`.
- every message has a closed top-level envelope, one owner, schema version,
  canonical digest, mission identity, parent identities, and explicit status.
- mission content is digest-referenced by default. raw mission content is not
  accepted in the protocol body.
- message-specific bodies are closed, bounded, canonical, and provider-neutral.
- supported effects are a finite vocabulary. authority intersection can only
  narrow requested effects and must set `authorityExpanded` to false.
- chain verification requires one topologically ordered mission-to-lifecycle
  path, exact parent message types, one mission identity, and cross-message
  identity/effect/disclosure consistency.
- stale, forged, reordered, duplicated, cyclic, unsupported, or authority
  widening messages fail closed.
- protocol verification is data-only. it must not import package source, load a
  skill body, invoke a model, or perform a host or external write.
- keep the package verifier and all historical receipts byte-for-byte stable.

## files and interfaces

1. `schemas/godskill-protocol-v1.schema.json`
   - define the closed common envelope, message body variants, finite enums,
     digest formats, and no-raw-content boundary.

2. `runtime/godskill-protocol-v1.md`
   - document the message sequence, host adapter boundary, authority
     intersection, and proof limits.

3. `src/godskill-protocol.mjs`
   - export protocol constants, `buildProtocolMessage`,
     `verifyProtocolMessage`, and `verifyProtocolChain`.
   - canonicalize and validate all message bodies before deriving the digest.
   - verify parent type transitions and cross-message identity/effect rules.
   - return frozen data summaries only.

4. `tests/godskill-protocol.test.mjs`
   - begin with a failing import test before production code.
   - cover deterministic message construction, every message type, closed body
     keys, canonical digests, parent identity rules, full-chain verification,
     effect narrowing, disclosure binding, and lifecycle evidence binding.
   - cover malformed, stale, reordered, duplicate, cyclic, cross-mission,
     unsupported, authority-expanding, raw-content, and provider-specific
     message rejection.
   - assert verification performs no source imports or executable loading.

5. `scripts/build-godskill-protocol-v1.mjs`
   - build one deterministic synthetic data-only chain from fixed digest
     references, verify it, and emit the protocol receipt.

6. `receipts/godskill-protocol-v1.json`
   - bind protocol schema, runtime contract, chain fixture, chain digest, and
     focused/full-suite verification counts.

7. `docs/godskill-protocol-v1-certification.md`
   - record exact hashes, message count, chain checks, and proof limits.

8. `README.md`
   - add a concise protocol status section without implying host activation.

## implementation sequence

1. Confirm the new worktree is clean and rooted at canonical Godskills
   `b010e8c`.
2. Add and self-review this plan.
3. Add the focused import/contract test and run it red because the protocol
   module does not yet exist.
4. Define the common envelope, body validators, effect vocabulary, parent graph,
   canonical digest function, and message builder.
5. Implement chain verification and cross-message consistency checks; extend
   mutation tests and run the focused suite.
6. Add the schema and runtime contract, then build and verify the fixed fixture
   and receipt.
7. Run focused checks, syntax checks, the existing package and layer gates, and
   a fresh full repository suite.
8. Review the staged diff inline for authority widening, raw-content leakage,
   provider coupling, digest circularity, parent ambiguity, and historical
   artifact drift.
9. If all gates are green, commit, fast-forward canonical main, push, and
   notify Godagents of the new protocol head so its compensation evidence can
   bind to both current Godskills package and protocol coordinates.

## completion evidence

Completion requires a deterministic chain fixture, all focused protocol tests
passing apart from any explicitly documented platform skip, a fresh full-suite
pass with zero failures, identical receipt rebuild output, a clean pushed main,
and a certificate that states the protocol is data-only and inactive.
