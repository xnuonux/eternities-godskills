# provider-neutral Godskills adapter conformance v1

this harness defines the smallest translation boundary a host adapter must
project into the provider-neutral Godskills protocol. it is a fixture and
verification contract, not a Codex, Claude Code, local-model, MCP, or
Godagents integration.

## host translation sequence

```text
receive bounded host metadata and digest-only mission references
validate the host family, model profile, context ceiling, review capability,
  supported package protocol, protocol version, and secret isolation
intersect requested effects with the host's available effects
return an explicit unsupported result when package, protocol, or secret
  preconditions are absent
construct the same guarded semantic decision for each conformant host
normalize away host-specific metadata
compare normalized decision digests across the fixture family
```

host-specific metadata may vary in version, model label, context budget, and
review availability. those fields never enter the normalized semantic
decision. a host cannot claim conformance by silently changing the requested
mission, package, capability, activation mode, disclosure layer, or authority
effects.

## supported and unsupported results

a conformant projection is explicit about `protocol-equivalent` or
`effect-narrowed` and carries a guarded semantic decision. an unsupported
projection carries no decision and names the exact missing precondition, such
as `package-protocol-unsupported`, `protocol-version-unsupported`, or
`secrets-not-isolated`. unsupported is not silently converted into native
execution or an invented fallback.

requested effects are intersected with host availability. the result can
narrow authority, never widen it. review availability is reported in host
metadata only; this harness never represents an unavailable review as
completed.

## privacy and rollback

only bounded identifiers, digests, enumerations, booleans, and numeric ceilings
cross the conformance boundary. the objective digest remains bound to the
fixture and each semantic decision without disclosing the objective itself.
prompts, mission text, artifact and response
bodies, credentials, private keys, and free-form notes are rejected. host
adapters keep provider credentials and raw provider traffic outside protocol
payloads.

the fixture is inert and can be disabled independently. disabling it leaves
the package verifier, protocol core, observatory, and legacy activation path
unchanged. no adapter is installed or selected by this release.

## proof limits

the fixture proves only that five declared metadata projections can produce
one digest-equivalent bounded semantic decision under the tested inputs. it
does not prove real Codex, Claude Code, local-model, MCP, or Godagents
transport behavior, model equivalence, provider quality, host security,
credential handling, external authorization, production adoption, or Lunari
readiness.
