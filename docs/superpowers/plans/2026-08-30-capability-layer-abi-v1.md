# Capability Layer ABI v1 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one deterministic, digest-bound capability layer compiler for
Muse, Forge, and Aegis while preserving every current `SKILL.md` consumer and
default activation path.

**Architecture:** A first-party canary policy names exact source paths and typed
input/output slots. A pure compiler turns those inputs into route, guardrail,
method, reviewer, verifier, and schema bytes, then binds them in one immutable
manifest. A separate builder writes the checked artifacts, aggregate receipt,
and byte-cost report; a disclosure helper proves each activation mode reads only
its authorized layer.

**Tech Stack:** Node.js 24 ESM, `node:test`, canonical UTF-8 JSON and Markdown,
SHA-256 identities, existing atomic JSON writer, repository-relative paths.

**Spec:** `docs/superpowers/specs/2026-08-30-godskills-evolution-arc-design.md`

## Scope boundary

this plan implements phase 1 only. adaptive evidence v2, typed composition,
`.godskill` packaging, protocol messages, observability, provider adapters,
field certification, Godagents runtime changes, and Lunari integration remain
outside this milestone.

## Global Constraints

- Preserve current entrypoints, contracts, manifests, receipts, router behavior,
  and the 632-test baseline.
- Limit generated capability bundles to `eternities-aegis`,
  `eternities-forge`, and `eternities-muse`.
- Generated layers are not new instruction authorities. Every output value must
  map to exact source content or the named first-party canary policy.
- `native` discloses no selected layer body.
- `guardrail` discloses only contract-derived success, failure, effect, and
  termination constraints.
- `method` discloses the exact entrypoint, capability contract, and operating
  contract as one bounded generated document.
- `review` discloses no reviewer body before an artifact exists.
- A verifier declaration must never claim that a check ran or passed.
- Every generated path must remain beneath
  `artifacts/capability-layers/<capability-id>/`.
- Existing `skills/<id>/SKILL.md` paths remain unchanged and authoritative for
  legacy consumers.
- Byte and token estimates are measurements, not model-quality evidence.
- No implementation in this plan changes global Codex activation, Godagents,
  external systems, or Lunari.

## File map

### authored inputs and implementation

- Create `policies/capability-layer-abi.v1.json`: exact canary source map,
  semantic slot types, shared reviewer rules, verifier rules, and proof limits.
- Create `src/capability-layer-abi.mjs`: canonicalization, compilation,
  validation, disclosure planning, and contained layer reads.
- Create `scripts/build-capability-layer-abi.mjs`: repository I/O, checked
  artifact emission, aggregate receipt, and deterministic report generation.
- Create `tests/capability-layer-abi.test.mjs`: policy, compiler, tamper,
  containment, deterministic rebuild, and read-spy coverage.
- Modify `package.json`: add only `build:capability-layer-abi`.
- Create `runtime/capability-layer-abi.md`: consumption and compatibility
  contract for layer-aware hosts.
- Create `docs/capability-layer-abi-v1-certification.md`: independently
  reviewed phase-1 disposition and exact integration boundary.

### generated outputs

for each canary, create these files beneath
`artifacts/capability-layers/<capability-id>/`:

```text
manifest.v1.json
route-card.v1.json
guardrails.v1.json
method.v1.md
reviewer.v1.md
verifier.v1.json
input.schema.json
output.schema.json
```

- Create `receipts/capability-layer-abi-v1.json`: aggregate source, artifact,
  invariant, and proof-limit receipt.
- Create `docs/capability-layer-abi-v1-report.md`: exact bytes and estimated
  tokens by canary and activation mode.

---

### Task 1: Freeze the canary policy and source contract

**Files:**
- Create: `policies/capability-layer-abi.v1.json`
- Create: `tests/capability-layer-abi.test.mjs`

**Interfaces:**
- Consumes: the existing canary `SKILL.md`, `capability-contract.json`,
  `routing-card.json`, and `operating-contract.md` files.
- Produces: `policy.canaries[]` entries with exact `capabilityId`, source paths,
  input slots, and output slots; shared `reviewerPolicy`, `verifierPolicy`, and
  `proofLimits` fields consumed by `compileCapabilityLayerBundle`.

- [ ] **Step 1: Write the policy-shape test before the policy exists**

create the initial test with these exact assertions:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const json = async (relative) => JSON.parse(
  await readFile(new URL(relative, root), "utf8"),
);

test("capability layer policy freezes three sorted first-party canaries", async () => {
  const policy = await json("policies/capability-layer-abi.v1.json");
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.id, "capability-layer-abi-v1");
  assert.deepEqual(policy.canaries.map(({ capabilityId }) => capabilityId), [
    "eternities-aegis",
    "eternities-forge",
    "eternities-muse",
  ]);
  assert.equal(policy.reviewerPolicy.artifactRequired, true);
  assert.equal(policy.reviewerPolicy.selfCertificationAllowed, false);
  assert.equal(policy.verifierPolicy.initialStatus, "declared-not-executed");
  assert.equal(policy.capabilityGrantsAuthority, false);
});
```

- [ ] **Step 2: Run the focused test and observe the missing policy**

run:

```powershell
node --test tests/capability-layer-abi.test.mjs
```

expected: failure names
`policies/capability-layer-abi.v1.json` as missing.

- [ ] **Step 3: Add the exact shared policy fields**

start `policies/capability-layer-abi.v1.json` with:

```json
{
  "schemaVersion": 1,
  "id": "capability-layer-abi-v1",
  "status": "experimental-canary",
  "capabilityGrantsAuthority": false,
  "methodMode": "entrypoint-contract-operating-contract-v1",
  "reviewerPolicy": {
    "artifactRequired": true,
    "selfCertificationAllowed": false,
    "sourceFields": [
      "successCondition",
      "outputs",
      "failureModes",
      "terminationConditions"
    ],
    "proofLimits": [
      "artifact-review-only",
      "no-self-certification",
      "no-runtime-observation-without-an-observation-receipt"
    ]
  },
  "verifierPolicy": {
    "initialStatus": "declared-not-executed",
    "executedChecks": 0,
    "observations": [],
    "sourceFields": [
      "successCondition",
      "outputs",
      "failureModes",
      "terminationConditions"
    ]
  },
  "proofLimits": [
    "structural-layer-integrity-only",
    "no-model-quality-claim",
    "no-global-activation",
    "no-external-authority"
  ],
  "canaries": []
}
```

- [ ] **Step 4: Add exact canary source and slot entries**

use lexically sorted canaries. each source object has exactly `entrypoint`,
`contract`, `routingCard`, and `operatingContract`. use these slot maps:

```json
[
  {
    "capabilityId": "eternities-aegis",
    "sources": {
      "entrypoint": "skills/eternities-aegis/SKILL.md",
      "contract": "skills/eternities-aegis/references/capability-contract.json",
      "routingCard": "skills/eternities-aegis/references/routing-card.json",
      "operatingContract": "skills/eternities-aegis/references/operating-contract.md"
    },
    "inputSlots": [
      {"id":"authorization-boundary","sourceIndex":0,"typeId":"eternities.authority-envelope","jsonKind":"object"},
      {"id":"system-evidence","sourceIndex":1,"typeId":"eternities.evidence-set","jsonKind":"array"},
      {"id":"trust-context","sourceIndex":2,"typeId":"eternities.trust-map","jsonKind":"object"}
    ],
    "outputSlots": [
      {"id":"authorization-decision","sourceIndex":0,"typeId":"eternities.authority-decision","jsonKind":"object"},
      {"id":"trust-boundary-map","sourceIndex":1,"typeId":"eternities.trust-map","jsonKind":"object"},
      {"id":"finding-ledger","sourceIndex":2,"typeId":"eternities.finding-ledger","jsonKind":"object"},
      {"id":"mitigation-plan","sourceIndex":3,"typeId":"eternities.mitigation-plan","jsonKind":"object"},
      {"id":"residual-risk-ledger","sourceIndex":4,"typeId":"eternities.risk-ledger","jsonKind":"object"}
    ]
  },
  {
    "capabilityId": "eternities-forge",
    "sources": {
      "entrypoint": "skills/eternities-forge/SKILL.md",
      "contract": "skills/eternities-forge/references/capability-contract.json",
      "routingCard": "skills/eternities-forge/references/routing-card.json",
      "operatingContract": "skills/eternities-forge/references/operating-contract.md"
    },
    "inputSlots": [
      {"id":"settled-outcome","sourceIndex":0,"typeId":"eternities.mission-spec","jsonKind":"object"},
      {"id":"repository-state","sourceIndex":1,"typeId":"eternities.repository-state","jsonKind":"object"},
      {"id":"acceptance-risk-boundary","sourceIndex":2,"typeId":"eternities.acceptance-contract","jsonKind":"object"}
    ],
    "outputSlots": [
      {"id":"implementation","sourceIndex":0,"typeId":"eternities.implementation-artifact","jsonKind":"object"},
      {"id":"claim-evidence-ledger","sourceIndex":1,"typeId":"eternities.evidence-ledger","jsonKind":"object"},
      {"id":"review-disposition","sourceIndex":2,"typeId":"eternities.review-decision","jsonKind":"object"},
      {"id":"integration-state","sourceIndex":3,"typeId":"eternities.integration-state","jsonKind":"object"}
    ]
  },
  {
    "capabilityId": "eternities-muse",
    "sources": {
      "entrypoint": "skills/eternities-muse/SKILL.md",
      "contract": "skills/eternities-muse/references/capability-contract.json",
      "routingCard": "skills/eternities-muse/references/routing-card.json",
      "operatingContract": "skills/eternities-muse/references/operating-contract.md"
    },
    "inputSlots": [
      {"id":"visual-source-set","sourceIndex":0,"typeId":"eternities.artifact-set","jsonKind":"array"},
      {"id":"design-constraints","sourceIndex":1,"typeId":"eternities.constraint-set","jsonKind":"array"},
      {"id":"available-specialists","sourceIndex":2,"typeId":"eternities.capability-set","jsonKind":"array"}
    ],
    "outputSlots": [
      {"id":"visual-direction","sourceIndex":0,"typeId":"eternities.decision-record","jsonKind":"object"},
      {"id":"visual-system","sourceIndex":1,"typeId":"eternities.design-system","jsonKind":"object"},
      {"id":"specialist-handoff","sourceIndex":2,"typeId":"eternities.handoff-contract","jsonKind":"object"},
      {"id":"acceptance-boundary","sourceIndex":3,"typeId":"eternities.acceptance-contract","jsonKind":"object"}
    ]
  }
]
```

- [ ] **Step 5: Extend the test to bind policy indexes to exact source text**

append a test that loads each contract and asserts every slot index is in range,
every slot id and `typeId` is unique, every `jsonKind` is `object` or `array`,
the contract name equals `capabilityId`, and the routing-card id equals
`capabilityId`.

```js
for (const canary of policy.canaries) {
  const contract = await json(canary.sources.contract);
  const route = await json(canary.sources.routingCard);
  assert.equal(contract.name, canary.capabilityId);
  assert.equal(route.id, canary.capabilityId);
  for (const [slots, source] of [
    [canary.inputSlots, contract.inputs],
    [canary.outputSlots, contract.outputs],
  ]) {
    assert.equal(new Set(slots.map(({ id }) => id)).size, slots.length);
    assert.equal(new Set(slots.map(({ typeId }) => typeId)).size, slots.length);
    for (const slot of slots) {
      assert.ok(source[slot.sourceIndex]);
      assert.ok(["object", "array"].includes(slot.jsonKind));
    }
  }
}
```

- [ ] **Step 6: Run the focused policy tests**

run `node --test tests/capability-layer-abi.test.mjs`.

expected: all policy and exact-source assertions pass.

- [ ] **Step 7: Commit the frozen canary policy**

```powershell
git add policies/capability-layer-abi.v1.json tests/capability-layer-abi.test.mjs
git commit -m "test: freeze capability layer canaries"
```

### Task 2: Compile and validate immutable layer bundles

**Files:**
- Create: `src/capability-layer-abi.mjs`
- Modify: `tests/capability-layer-abi.test.mjs`

**Interfaces:**
- Consumes: `compileCapabilityLayerBundle({ policy, policySource, canary,
  sources })`, where `policySource` and each of the four `sources` entries are
  exact `{ path, bytes }` records.
- Produces: `{ capabilityId, files, manifest }`, where `files` is a frozen
  filename-to-UTF-8-string object containing all eight required files.
- Produces: `verifyCapabilityLayerBundle({ bundle, policy, canary })`, returning
  a frozen invariant summary or throwing on the first invalid boundary.
- Produces: `readCapabilityLayers({ bundleDirectory, manifest,
  activationDecision, artifactAvailable, read })`, returning exact disclosed
  `{ path, sha256, bytes }` records and a `deferredReview` boolean.

- [ ] **Step 1: Add failing compiler-import and deterministic-byte tests**

```js
const compiler = async () => import("../src/capability-layer-abi.mjs");

test("the canary compiler emits eight deterministic bound files", async () => {
  const { compileCapabilityLayerBundle } = await compiler();
  const input = await loadCanaryInput("eternities-aegis");
  const left = compileCapabilityLayerBundle(input);
  const right = compileCapabilityLayerBundle(input);
  assert.deepEqual(left.files, right.files);
  assert.deepEqual(Object.keys(left.files).sort(), [
    "guardrails.v1.json", "input.schema.json", "manifest.v1.json",
    "method.v1.md", "output.schema.json", "reviewer.v1.md",
    "route-card.v1.json", "verifier.v1.json",
  ]);
  assert.match(left.manifest.bundleDigest, /^[a-f0-9]{64}$/);
});
```

`loadCanaryInput` must read only the policy entry and its four named files and
return `{ policy, policySource: { path, bytes }, canary, sources }`.

- [ ] **Step 2: Run the focused test and observe the missing compiler**

run `node --test tests/capability-layer-abi.test.mjs`.

expected: failure identifies `src/capability-layer-abi.mjs` as unavailable.

- [ ] **Step 3: Implement canonical primitives and closed validation**

create the module with these exported names and invariants:

```js
import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonicalText, sha256 } from "./io.mjs";
import { assertInside } from "./paths.mjs";

export const LAYER_FILES = Object.freeze([
  "manifest.v1.json",
  "route-card.v1.json",
  "guardrails.v1.json",
  "method.v1.md",
  "reviewer.v1.md",
  "verifier.v1.json",
  "input.schema.json",
  "output.schema.json",
]);

export function canonicalJson(value) {
  const stable = (item) => Array.isArray(item)
    ? item.map(stable)
    : item && typeof item === "object"
      ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, stable(item[key])]))
      : item;
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys are not closed`);
  }
}
```

validate non-empty ids, schema version 1, sorted canary identity, exact source
keys, source path containment, source JSON identity, source index ranges,
unique slot ids, unique semantic type ids, and `object` or `array` JSON kinds.

- [ ] **Step 4: Implement the seven non-manifest layer renderers**

the compiler must build these exact shapes:

```js
const guardrails = {
  schemaVersion: 1,
  capabilityId,
  successCondition: contract.successCondition,
  effects: contract.effects,
  negativeTriggers: contract.negativeTriggers,
  failureModes: contract.failureModes,
  terminationConditions: contract.terminationConditions,
};

const verifier = {
  schemaVersion: 1,
  capabilityId,
  status: policy.verifierPolicy.initialStatus,
  executedChecks: policy.verifierPolicy.executedChecks,
  observations: policy.verifierPolicy.observations,
  checks: [
    { id: "success-condition", sourceField: "successCondition", statement: contract.successCondition },
    ...contract.outputs.map((statement, index) => ({
      id: `required-output-${String(index + 1).padStart(2, "0")}`,
      sourceField: `outputs[${index}]`,
      statement,
    })),
    ...contract.failureModes.map((statement, index) => ({
      id: `rejection-${String(index + 1).padStart(2, "0")}`,
      sourceField: `failureModes[${index}]`,
      statement,
    })),
    ...contract.terminationConditions.map((statement, index) => ({
      id: `termination-${String(index + 1).padStart(2, "0")}`,
      sourceField: `terminationConditions[${index}]`,
      statement,
    })),
  ],
};
```

`route-card.v1.json` is the canonical JSON form of the exact routing-card
source. `method.v1.md` concatenates, in order, a generated-source notice, the
canonical entrypoint, a `## bound capability contract` fenced JSON block, and
the canonical operating contract. `reviewer.v1.md` renders only the shared
artifact-required policy plus exact success, output, failure, termination, and
proof-limit values. it contains no route examples or method steps.

generate each input/output schema as JSON Schema draft 2020-12 with exact keys
`$schema`, `$id`, `title`, `type`, `additionalProperties`, `required`, and
`properties`. the envelope requires `schemaVersion`, `capabilityId`,
`missionId`, and `slots`. `slots` is a closed object whose required properties
come from the policy. each slot property has its source description,
`x-eternities-type`, and exact `type` from `jsonKind`.

- [ ] **Step 5: Bind source and layer bytes in the manifest**

the manifest body must have this shape before `bundleDigest` is added:

```js
const body = {
  schemaVersion: 1,
  id: `${capabilityId}-layer-bundle-v1`,
  capabilityId,
  status: "experimental-canary",
  policy: {
    path: policySource.path,
    sha256: sha256(policySource.bytes),
    bytes: policySource.bytes.length,
  },
  sources: Object.fromEntries(Object.entries(sources).map(([name, source]) => [
    name,
    { path: source.path, sha256: sha256(source.bytes), bytes: source.bytes.length },
  ])),
  layers,
  compatibility: {
    legacyEntrypoint: canary.sources.entrypoint,
    legacyEntrypointUnchanged: true,
  },
  capabilityGrantsAuthority: false,
  proofLimits: policy.proofLimits,
};
const manifest = { ...body, bundleDigest: sha256(canonicalJson(body)) };
```

each `layers` row contains exactly `path`, `mediaType`, `sha256`, `bytes`, and
`disclosureModes`. layer paths are basenames and cannot escape the bundle.

- [ ] **Step 6: Add boundary, provenance, and false-proof tests**

assert all three canaries satisfy:

```js
assert.deepEqual(Object.keys(guardrails).sort(), [
  "capabilityId", "effects", "failureModes", "negativeTriggers",
  "schemaVersion", "successCondition", "terminationConditions",
].sort());
assert.equal(verifier.status, "declared-not-executed");
assert.equal(verifier.executedChecks, 0);
assert.deepEqual(verifier.observations, []);
assert.doesNotMatch(bundle.files["route-card.v1.json"], /bind the charge|Aegis loop|visual law/i);
assert.match(bundle.files["method.v1.md"], new RegExp(contract.id));
assert.equal(inputSchema.additionalProperties, false);
assert.equal(inputSchema.properties.slots.additionalProperties, false);
```

also mutate one source byte, one source id, one layer digest, one path to
`../escape`, one duplicate slot id, and one verifier status. each mutation must
throw with a boundary-specific error.

- [ ] **Step 7: Implement and test disclosure reads**

use this fixed mode table after validating an existing activation decision:

```js
const DISCLOSURE = Object.freeze({
  native: [],
  guardrail: ["guardrails.v1.json"],
  method: ["method.v1.md"],
  review: ["reviewer.v1.md"],
});
```

before any read, remove `decisionDigest` from the decision, recompute the compact
stable-object SHA-256 used by `adaptive-activation.mjs`, and require an exact
match. require `selectedId === manifest.capabilityId`,
`authorityExpanded === false`, and the existing mode-to-disclosure value. a
`method` decision must contain either `explicit-method-request` or
`matched-method-advantage`. this helper consumes an activation decision; it
does not choose or upgrade activation.

`review` returns no body and `deferredReview: true` when `artifactAvailable` is
false. `readCapabilityLayers` receives a parsed manifest, verifies containment
and exact bytes after every read, and rejects unknown or contradictory
decisions. the read spy must observe these sequences:

```js
assert.deepEqual(reads.native, []);
assert.deepEqual(reads.guardrail, ["guardrails.v1.json"]);
assert.deepEqual(reads.method, ["method.v1.md"]);
assert.deepEqual(reads.reviewBeforeArtifact, []);
assert.deepEqual(reads.reviewAfterArtifact, ["reviewer.v1.md"]);
```

- [ ] **Step 8: Run focused tests and commit the pure compiler**

```powershell
node --test tests/capability-layer-abi.test.mjs
git add src/capability-layer-abi.mjs tests/capability-layer-abi.test.mjs
git commit -m "feat: compile immutable capability layers"
```

### Task 3: Emit reproducible bundles, receipt, and cost report

**Files:**
- Create: `scripts/build-capability-layer-abi.mjs`
- Create: `artifacts/capability-layers/eternities-aegis/*`
- Create: `artifacts/capability-layers/eternities-forge/*`
- Create: `artifacts/capability-layers/eternities-muse/*`
- Create: `receipts/capability-layer-abi-v1.json`
- Create: `docs/capability-layer-abi-v1-report.md`
- Modify: `tests/capability-layer-abi.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `rebuildCapabilityLayerAbi({ root })` with a repository root URL.
- Produces: `{ bundles, receipt, report }` entirely in memory.
- Produces: `writeCapabilityLayerAbi({ root })`, which atomically replaces only
  the exact generated paths after the complete in-memory build verifies.

- [ ] **Step 1: Add a failing checked-artifact rebuild test**

```js
test("checked capability layer artifacts rebuild byte for byte", async () => {
  const { rebuildCapabilityLayerAbi } = await import(
    "../scripts/build-capability-layer-abi.mjs"
  );
  const built = await rebuildCapabilityLayerAbi({ root });
  for (const [relative, expected] of Object.entries(built.files)) {
    assert.equal(await readFile(new URL(relative, root), "utf8"), expected, relative);
  }
  assert.equal(
    await readFile(new URL("receipts/capability-layer-abi-v1.json", root), "utf8"),
    built.receiptText,
  );
  assert.equal(
    await readFile(new URL("docs/capability-layer-abi-v1-report.md", root), "utf8"),
    built.report,
  );
});
```

- [ ] **Step 2: Run the focused test and observe the missing builder**

run `node --test tests/capability-layer-abi.test.mjs`.

expected: failure identifies the missing build module.

- [ ] **Step 3: Implement the in-memory aggregate builder**

the builder must:

```js
export async function rebuildCapabilityLayerAbi({
  root = new URL("../", import.meta.url),
} = {}) {
  const policyPath = "policies/capability-layer-abi.v1.json";
  const policyBytes = await readFile(new URL(policyPath, root));
  const policy = JSON.parse(policyBytes);
  const bundles = [];
  const files = {};
  for (const canary of policy.canaries) {
    const sources = await readCanarySources({ root, canary });
    const bundle = compileCapabilityLayerBundle({
      policy,
      policySource: { path: policyPath, bytes: policyBytes },
      canary,
      sources,
    });
    verifyCapabilityLayerBundle({ bundle, policy, canary });
    bundles.push(bundle);
    for (const [name, text] of Object.entries(bundle.files)) {
      files[`artifacts/capability-layers/${canary.capabilityId}/${name}`] = text;
    }
  }
  const receipt = buildAggregateReceipt({ policyPath, policyBytes, bundles });
  return {
    bundles,
    files,
    receipt,
    receiptText: canonicalJson(receipt),
    report: buildCostReport({ bundles, receipt }),
  };
}
```

the aggregate receipt binds every source digest, every output digest and byte
count, each canary manifest digest, totals, and the exact proof limits. directly
computed structural conditions use boolean gates. full-suite, independent
review, and field-quality conditions appear under `unresolvedGates` and remain
`pending` because a deterministic builder cannot certify events it did not
observe. compute `receiptDigest` over the canonical body without the digest
field. the receipt status remains `experimental-canary` throughout phase 1.

- [ ] **Step 4: Implement exact writes and the CLI guard**

build everything and verify it before writing. create parent directories with
`mkdir({ recursive: true })`, then write each UTF-8 file through one sibling
temporary file and `rename`. do not remove directories or touch unnamed files.
use this helper and await writes in lexical path order:

```js
async function writeTextAtomic(filePath, text) {
  const directory = path.dirname(filePath);
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.tmp`,
  );
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
```

the CLI guard is:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await writeCapabilityLayerAbi();
  process.stdout.write(`${JSON.stringify({
    status: result.receipt.status,
    canaries: result.bundles.length,
    receiptDigest: result.receipt.receiptDigest,
  })}\n`);
}
```

- [ ] **Step 5: Generate a deterministic cost report**

for each canary, report:

```text
native bytes = 0
guardrail bytes = byte length of guardrails.v1.json
method bytes = byte length of method.v1.md
review bytes = 0 before artifact and byte length of reviewer.v1.md after artifact
estimated tokens = ceiling(bytes / 4)
```

the report must state that the estimate is not tokenizer output, smaller
context is not evidence of higher quality, and all behavior remains
experimental and local.

- [ ] **Step 6: Add the package script and build twice**

add exactly:

```json
"build:capability-layer-abi": "node scripts/build-capability-layer-abi.mjs"
```

run the builder twice. capture SHA-256 for every generated file after each run
and assert the two sorted `path digest` sets are identical.

- [ ] **Step 7: Run focused and compatibility tests**

```powershell
node --test tests/capability-layer-abi.test.mjs tests/portable-capability-manifest.test.mjs tests/adaptive-activation.test.mjs tests/router.test.mjs
```

expected: all tests pass, current entrypoint digests remain valid, and adaptive
activation behavior is unchanged.

- [ ] **Step 8: Commit generated evidence and builder together**

```powershell
git add package.json src/capability-layer-abi.mjs scripts/build-capability-layer-abi.mjs tests/capability-layer-abi.test.mjs artifacts/capability-layers receipts/capability-layer-abi-v1.json docs/capability-layer-abi-v1-report.md
git commit -m "feat: emit capability layer ABI canaries"
```

### Task 4: Document, independently review, and certify phase 1

**Files:**
- Create: `runtime/capability-layer-abi.md`
- Create: `docs/capability-layer-abi-v1-certification.md`
- Modify: `tests/capability-layer-abi.test.mjs`

**Interfaces:**
- Consumes: checked bundles, aggregate receipt, focused test output, full suite,
  independent review findings, and repository diff.
- Produces: an explicit independently reviewed phase-1 certification document
  with compatibility, rollback, proof limits, and the exact phase-2 entry gate.

- [ ] **Step 1: Write the runtime contract**

document this exact sequence:

```text
load and verify manifest
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

state that legacy hosts continue reading `skills/<id>/SKILL.md`, rollback means
disabling the layer-aware fixture, and phase 1 establishes no model-quality or
cross-host claim.

- [ ] **Step 2: Add a documentation-boundary test**

assert the runtime document contains all four modes, the three canary ids,
legacy compatibility, no-authority language, post-artifact review, declared
versus observed verification, rollback, and the `structural-layer-integrity-only`
proof limit.

- [ ] **Step 3: Run the full repository suite**

run `npm test` once after focused tests are green.

expected: zero failures and at least the 632-test historical baseline plus the
new capability-layer tests.

- [ ] **Step 4: Rebuild and verify the exact checked outputs**

run:

```powershell
npm run build:capability-layer-abi
node --test tests/capability-layer-abi.test.mjs
git diff --check
```

then confirm every source and layer SHA-256 in the aggregate receipt matches the
current bytes and no existing `skills/*/SKILL.md` file changed.

- [ ] **Step 5: Request one independent review**

the reviewer must inspect source-to-output traceability, guardrail field
closure, method completeness, reviewer deferral, verifier false-proof risk,
path containment, digest checking, deterministic writes, legacy compatibility,
test honesty, report language, and rollback. resolve every critical or important
finding through a new failing test before repair.

- [ ] **Step 6: Record the phase-1 disposition separately from generated evidence**

create `docs/capability-layer-abi-v1-certification.md`. its disposition may be
`certified-structural-canary` only if:

```text
all 12 acceptance conditions pass
full suite has zero failures
independent review has no unresolved critical or important finding
working tree contains only intended phase-1 changes
legacy entrypoint bytes are unchanged
no activation default changed
```

otherwise record `experimental-blocked` and the exact failed gate. cite the
exact aggregate build receipt digest, full-suite command and counts, review
source and disposition, unchanged-entrypoint evidence, rollback, integration
state, and proof limits.

the generated cost report and aggregate build receipt remain byte-stable and
`experimental-canary`; the independent certification document owns the broader
disposition and never rewrites generated evidence.

- [ ] **Step 7: Commit documentation and review corrections**

```powershell
git add runtime/capability-layer-abi.md tests/capability-layer-abi.test.mjs docs/capability-layer-abi-v1-certification.md
git commit -m "docs: certify capability layer ABI boundaries"
```

- [ ] **Step 8: Verify branch disposition without pushing or merging**

run `git status --short --branch`, `git log --oneline --decorate -6`, and the
full suite one final time if any review repair changed code. leave the feature
branch and worktree available for explicit integration disposition.

## Requirement coverage

| requirement | implementation evidence |
|---|---|
| GS-ARC-001 | Task 2 manifest binds source, contract, every layer, and schemas by digest |
| GS-ARC-002 | Task 2 native disclosure read spy records zero body reads |
| GS-ARC-003 | Task 2 exact guardrail key allowlist and source-field tests |
| GS-ARC-004 | Task 2 validates an explicit-or-evidenced activation decision before reading the exact method and contract bytes |
| GS-ARC-005 | Task 2 review deferral and post-artifact read spy |
| GS-ARC-006 | Task 2 declared-not-executed verifier and mutation tests |
| GS-ARC-007 | Tasks 3 and 4 portable manifest regressions and unchanged entrypoint bytes |
| GS-ARC-025 | Task 3 exact bytes and labeled token estimates |
| GS-ARC-027 | Task 3 receipts contain identities and metrics, not mission content |
| GS-ARC-028 | Tasks 2 and 3 immutable inputs and exact rebuild tests |
| GS-ARC-031 | Tasks 1, 2, and 4 no-authority policy and runtime contract |
| GS-ARC-034 | Tasks 3 and 4 report structural evidence and exact proof limits |

## Completion boundary

phase 1 is complete only when the generated canary bundles rebuild byte for
byte, all 12 acceptance gates pass, the full suite is green, independent review
has no unresolved critical or important finding, existing entrypoint bytes are
unchanged, and the branch has an explicit rollback and integration state. this
plan does not authorize phase 2, global activation, a push, a merge, Godagents
runtime work, or Lunari integration.
