# Experiment artifact reuse guard

Implement a small dependency-free Node ES module that decides whether an ML
pipeline can reuse an artifact, resume a checkpoint, or initialize a new run from
weights. No actual training, artifact loading, network calls or filesystem writes
are part of the guard. Do not evaluate or import checkpoint contents.

Export `assessReuse(request, artifact)` from `guard.mjs`. Return a plain object:
`{decision, reasons}`, where decision is one of `reuse`, `resume`, `warm-start`,
`rebuild`, or `block`, and reasons is an array of short, useful strings. Inputs
must not be mutated. The caller passes already-read manifests; do not trust file
names, run labels, or path equality as evidence of compatibility.

Input format:

```json
{
  "request": {
    "operation": "cache | resume | warm-start",
    "identity": {
      "data": "immutable data-content id",
      "split": "immutable membership id",
      "preprocess": "preprocessing id",
      "code": "relevant computation id",
      "architecture": "model-structure id",
      "environment": "execution-environment id"
    },
    "requiredState": ["model", "optimizer", "scheduler", "rng", "sampler", "scaler"],
    "evaluationIds": ["sample ids reserved for evaluation"]
  },
  "artifact": {
    "kind": "cache | checkpoint",
    "status": "complete | partial",
    "verified": true,
    "identity": {},
    "dependsOn": ["data", "split", "preprocess", "code"],
    "state": {"model":true,"optimizer":true,"scheduler":true,"rng":true,"sampler":true,"scaler":true},
    "fitIds": ["sample ids used to fit the artifact"],
    "path": "optional locator, not an identity",
    "label": "optional human name, not an identity"
  }
}
```

All identity strings are opaque content-bound IDs already computed by the caller.
They are not paths. `verified: true` means the caller verified the artifact bytes
against a trusted recorded digest. `fitIds` is the known complete sample membership
used in fitting; an absent field is unknown, an empty array is known-empty.
`evaluationIds` likewise is a complete current holdout declaration, possibly empty.

For caches, `dependsOn` lists the computation's identity dependencies. Supported
keys are the six identity keys above. It must include data, split, preprocess and
code, and can add architecture/environment. For resume, all six identities and
the caller's `requiredState` are relevant. For explicitly requested warm-start,
architecture compatibility and model weights are relevant; differing training
identities describe a new run rather than an exact continuation. Every successful
use must be based on complete, verified, appropriately typed evidence and preserve
the current holdout. Unknown or malformed evidence must not authorize use.

Use `rebuild` for a well-formed cache whose required dependency identity changed;
use `block` when requested use is unsupported, incompatible, unsafe, or lacks the
evidence needed to decide. Never silently change a resume request into warm-start.
A successful answer makes no bitwise reproducibility promise.

Add local checks covering representative valid, invalid, and ambiguous inputs.
Report assumptions and unresolved limits concisely. Do not read another worker's
output or parent scoring material. Record any host-provided skills you loaded.
