# capability layer ABI v1 runtime contract

## status

the ABI is an additive `experimental-canary` path for:

- `eternities-aegis`
- `eternities-forge`
- `eternities-muse`

it does not change the current router, default activation, installed skills,
Godagents runtime, or Lunari. legacy hosts continue to read
`skills/<id>/SKILL.md`.

## source and bundle boundary

each canary manifest binds the exact bytes of:

- the first-party canary policy;
- the existing `SKILL.md` entrypoint;
- the capability contract;
- the routing card;
- the operating contract;
- every generated layer and input/output schema.

the bundle does not grant authority. a host intersects its existing authority
and effect ceiling before activation. selection identifies a relevant
capability; it does not authorize a layer or an effect.

## consumption sequence

```text
load a trusted aggregate receipt
obtain the canary's expected bundle digest from that receipt
load the manifest and verify both its body and expected bundle digest
intersect host authority without expansion
validate an existing digest-bound activation decision
native -> read no selected layer body
guardrail -> read guardrails.v1.json
method -> read method.v1.md
review before artifact -> retain reviewer identity only
review after artifact -> read reviewer.v1.md
verify every disclosed byte against the manifest
record actual observations separately from verifier.v1.json declarations
```

the layer reader accepts a decision produced by the activation boundary. it
checks decision integrity, selected capability identity, disclosure mode,
authority non-expansion, review timing, and the explicit-or-evidenced method
reason before reading a selected body. it does not choose or promote a mode.
the caller must provide `expectedBundleDigest` from an independently trusted
receipt or equivalent trust root. the manifest's self-consistent digest is not
sufficient to authorize its own bytes.

## layer behavior

| mode or phase | selected body available to the agent | timing |
|---|---|---|
| `native` | none | before inference |
| `guardrail` | `guardrails.v1.json` | before inference |
| `method` | `method.v1.md` | before inference, after a qualified decision |
| `review` | none | before an artifact exists |
| `review` | `reviewer.v1.md` | after an artifact exists |
| verification | `verifier.v1.json` | through a separate host verification loader |

`method.v1.md` binds the exact entrypoint, capability contract, and operating
contract. `guardrails.v1.json` contains only contract-derived success, effect,
negative-trigger, failure, and termination constraints. the reviewer contains
artifact acceptance and rejection criteria without route examples or method
steps.

## declared checks are not observations

`verifier.v1.json` starts with:

```json
{
  "status": "declared-not-executed",
  "executedChecks": 0,
  "observations": []
}
```

these fields describe a verification contract, not a test result. a runtime
must create a separate observation receipt before it can report that a check
ran, passed, failed, or remained unresolved. the generated verifier cannot
certify its own capability or artifact. `readCapabilityLayers()` handles only
the four activation modes and never loads the verifier. a verification host
must verify the manifest against its trust root, load `verifier.v1.json` by its
bound digest through a separate phase interface, and store observations apart
from the declaration.

## source normalization and provenance

source identity is byte-exact in every manifest and aggregate receipt. generated
JSON uses stable key ordering and generated Markdown normalizes line endings and
trailing blank space. a formatting-only source change may therefore preserve a
semantic layer while changing the bound source digest and bundle manifest. this
is intentional canonical compilation, not permission to treat changed source
bytes as the same provenance.

## generated write transaction

the writer resolves every destination beneath the real repository root before
creating a transaction directory. it writes and verifies all staged bytes, then
moves existing files into transaction-local backups while committing staged
files in lexical order. a caught failure restores every prior file and removes
all partially committed generated files before returning the original error.

each rename is filesystem-atomic and a handled failure is set-atomic through
rollback. abrupt process or machine termination during the short commit window
may leave the named `.capability-layer-abi-txn-*` directory as recovery evidence;
the next build must not claim a completed write until checked-artifact rebuild
verification passes. the writer never recursively deletes outside its validated
transaction directory.

## failure behavior

fail before disclosure when:

- the activation decision digest or capability identity does not match;
- method mode lacks explicit intent or matched evidence;
- an authority-expanding decision is presented;
- a review body is requested before an artifact exists;
- a layer path escapes the canary bundle;
- a layer is missing, substituted, truncated, or byte-different;
- the manifest or layer identity is malformed;
- the manifest does not match an independently trusted bundle digest;
- a verifier claims execution without an observation receipt.

failure does not fall through to a broader layer. the host may return to an
independently authorized `native` or `guardrail` path through its activation
policy, but the layer reader never makes that policy decision.

## compatibility and rollback

the existing canary entrypoint bytes are compared against the certified
portable capability manifest during every build. generated outputs live only
beneath `artifacts/capability-layers/`, plus one aggregate receipt and one cost
report.

rollback consists of disabling the layer-aware fixture or consumer and
continuing through the unchanged `skills/<id>/SKILL.md` boundary. no historical
receipt is rewritten, no current profile is changed, and no generated file is
required by legacy routing.

## evidence and proof limits

the build receipt proves exact local source and generated bytes, containment,
closed reduced layers, deterministic construction, and zero legacy entrypoint
drift for the three canaries. the report records disclosed bytes and a labeled
`Math.ceil(bytes / 4)` estimate.

the current proof limit is `structural-layer-integrity-only`. phase 1 does not
prove model-quality improvement, tokenizer-exact cost, cross-host compatibility,
provider behavior, field reliability, global activation safety, Godagents
execution, external authority, or Lunari readiness.

## phase 2 entry gate

adaptive evidence v2 remains blocked until the canary bundles rebuild exactly,
the historical suite passes, independent review has no unresolved critical or
important finding, legacy entrypoints remain unchanged, and this phase receives
an explicit integration disposition. phase 2 must use real artifact boundaries,
available reviewers or deterministic verifiers, pinned task definitions, and a
preregistered comparison policy.
