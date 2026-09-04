# provider-neutral `.godskill` package v1

## purpose

the package is a portable, inert representation of one qualified capability. it
bundles the capability's layered method material, closed contracts, source
provenance, and first-party digest evidence so a host can verify the exact
bytes before deciding whether any material may enter an agent context.

the v1 canary is `eternities-aegis` capability version 4. its directory form is
`artifacts/godskill-packages/eternities-aegis-v1` and its manifest protocol is
`eternities-godskill-package-v1`.

## package boundary

the package contains data only:

- `manifest.v1.json` is the closed identity, content inventory, provenance,
  compatibility, verification boundary, and digest attestation.
- `policy/package.v1.json` is the package trust policy. its file digest is the
  attestation trust root.
- `layers/` contains the already certified capability-layer ABI material.
- `sources/` contains exact first-party contracts and the layer policy source.
- `evidence/` contains the exact promotion evidence that supports the canary
  status.

installation is a file placement operation. it does not import, evaluate, or
execute package content. a verifier must reject path escapes, links, extras,
missing files, duplicate identities, byte substitution, truncation,
noncanonical manifests, stale digests, protocol drift, unsupported effects,
authority expansion, executable activation, and external mutation.

## host protocol

the host treats the package as a sequence of data decisions:

1. discover an inert package candidate.
2. verify the manifest against a separately trusted package digest and policy
   digest.
3. verify the exact recursive inventory, all bytes, source provenance, layer
   bundle, contracts, and promotion evidence.
4. intersect the capability's declared effects with the user's actual authority,
   target, and host policy.
5. decide whether to disclose a selected layer such as a guardrail, method, or
   reviewer artifact.
6. perform any authorized work through the host's own controls and record a
   separate observation or result receipt.

the package cannot grant authority, authorize a tool call, choose a model,
perform a network request, mutate an external system, or silently activate a
method. host adapters may translate local state into this protocol, but they
cannot weaken verification, widen authority, or turn package content into an
implicit command.

## proof limits

the v1 receipt proves exact package construction and verification for the Aegis
canary. it does not prove model quality, universal host compatibility, runtime
activation, external authorization, or any production deployment. those claims
require separate evidence at the host and mission boundaries.
