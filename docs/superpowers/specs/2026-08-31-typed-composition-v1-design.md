# Eternities typed composition v1 design

## decision

add an additive, host-pinnable typed-composition boundary above the certified
capability-layer ABI and adaptive-activation executable. it compiles one small
directed mission graph into one body-free execution method, then proves the
graph with trusted injected capability executors.

the historical router, mission skill stack, activation compiler, generated
capability layers, skill entrypoints, global installations, and Godagents host
remain unchanged.

## problem

the current router may select up to three compatible capabilities, but that is
not yet evidence that those capabilities form one executable method. the
existing mission stack names selected entrypoints without proving:

- which capability owns each mission phase;
- which exact output satisfies each downstream input;
- whether slot types and JSON kinds agree;
- whether every required input has exactly one source;
- whether the graph is acyclic and phase-monotonic;
- whether compatibility, effects, authority, and context remain inside the
  host ceiling;
- whether execution preserves the compiled handoff rather than improvising a
  new composition.

prompt concatenation is not a solution. it spends context before need, blurs
ownership, and makes conflicts invisible.

## trust roots

one canonical composition policy is loaded beneath an externally supplied
SHA-256. it pins:

- the exact capability-layer ABI receipt digest;
- the exact adaptive-activation executable receipt digest;
- the supported capability ids;
- the closed phase, effect, authority, precondition, and JSON-kind vocabularies;
- capability-to-phase ownership rules;
- explicit incompatible effect pairs;
- node, link, input, output, disclosure-byte, and compiled-method ceilings.

the loader reads the pinned capability-layer receipt, each selected canary
manifest, and only the route-card, guardrail, input-schema, and output-schema
metadata needed for composition. it verifies canonical bytes, path containment,
byte counts, SHA-256 values, bundle digests, identities, and cross-file links.
method and reviewer bodies are not read by registry construction.

the resulting registry has module-private provenance. callers cannot construct
a lookalike registry from self-digested data.

## plan contract

one canonical plan binds:

- mission, policy, capability-layer, and activation trust-root identities;
- exact available authority, permitted effects, and context-byte ceiling;
- typed mission inputs;
- one to three unique capability nodes;
- one unique owner for every occupied phase;
- the exact activation-decision digest for every node;
- artifact links from a mission input or node output to a node input;
- selected terminal mission outputs;
- one digest over the complete plan.

an artifact id may feed several consumers, but it has exactly one producer.
every required node input has exactly one incoming link. node outputs are
addressed by capability-defined slot identity, not by prose.

## type and compatibility law

input and output slots are extracted from the already certified closed schemas.
v1 compatibility is exact:

- `x-eternities-type` must match byte-for-byte;
- JSON kind must match exactly as `object` or `array`;
- no coercion, alias, optional truncation, or inferred adapter exists;
- every selected capability pair must be mutually compatible in their exact
  route cards and neither may name the other as a conflict;
- a dependency edge must move forward in the policy phase order;
- the node graph must be acyclic;
- a phase has one accountable capability owner.

## activation and disclosure law

the compiler consumes one structurally verified adaptive-activation result. its
trust-root digest must equal the composition policy pin. selected capability
ids and decision digests must match the nodes exactly. every decision must
carry the same authority projection as the plan and retain
`authorityExpanded: false`.

the compiled node refers only to the layer permitted by its activation mode:

- `native`: no skill body;
- `guardrail`: exact guardrail digest and byte count;
- `method`: exact method digest and byte count;
- `review`: exact reviewer digest and byte count, marked post-artifact.

the compiler never returns those bytes. it returns paths, hashes, byte counts,
timing, schemas, and activation identities so a host can disclose the exact
layer at the earned phase.

## effects, authority, and budget

each route-card effect and authority requirement must belong to the policy
vocabulary. selected effects must fit both the plan and activation projection.
selected authority requirements must fit both authority sets. any configured
incompatible effect pair rejects the whole composition.

estimated disclosure bytes include each node's input schema, output schema,
and the activation-selected layer. native therefore still pays for its typed
contracts but no skill body. reviewer bytes are counted even though disclosure
is deferred. the estimate must fit the plan ceiling, the activation context
ceiling converted conservatively to four bytes per token, and the policy
ceiling. the canonical compiled method itself has a separate byte ceiling.

## compiled mission method

the compiler emits one immutable value containing:

- exact trust roots and source plan digest;
- topologically ordered phase nodes;
- typed links and terminal outputs;
- per-node bundle, route-card, input-schema, output-schema, activation, and
  selected-layer references;
- aggregate effects, authority requirements, risk classes, and context cost;
- compatibility and graph evidence;
- `methodBodiesEmbedded: 0`, `sourceBodiesTransported: 0`, and
  `authorityExpanded: false`;
- one method digest.

it contains no route-card body, guardrail body, method prose, reviewer prose,
quarry body, model response, credential, or executable capability.

## reference execution

the provider-neutral reference runner accepts the compiled method, exact
mission-input values, and one trusted function per selected capability. for
each node in compiled order it:

1. assembles one closed input envelope from exact mission or prior-node values;
2. validates slot identity and JSON kind;
3. invokes only that node's declared capability executor;
4. validates one closed output envelope with every required slot;
5. stores each output under the compiled artifact ownership map;
6. projects only the declared mission outputs.

the execution receipt binds method, mission input, node input, node output,
handoff, and mission output digests. the runner grants no effects, performs no
filesystem or network action itself, and treats executor output as artifact
data rather than authority.

v1 execution is an in-memory conformance reference. durable journals,
provider adapters, crash recovery, and Godagents adoption are separate gates.

activation results are structurally and digest verified against the exact
executable receipt's policy and evidence roots. v1 does not authenticate the
process that originated an otherwise valid result; signed or host-branded
activation provenance is a later trust gate.

## deterministic canary

the positive canary uses `eternities-muse` in `design` followed by
`eternities-forge` in `implementation`. mission inputs supply visual sources,
constraints, available specialists, the settled outcome, and repository state.
Muse's exact `eternities.acceptance-contract` output is the sole source for
Forge's exact acceptance-risk input.

both nodes use the real pinned adaptive-activation result in consequential
guardrail mode. deterministic injected executors prove that Forge receives the
exact Muse value and that terminal outputs derive from the exact compiled graph.
this is orchestration evidence, not a model-quality trial.

## rejection matrix

the retained negative matrix must reject before execution:

- changed policy, layer-receipt, activation-root, manifest, layer, or decision
  identity;
- unknown or repeated capability;
- incompatible capability pair;
- duplicate phase owner;
- missing or multiply bound input;
- duplicate artifact owner;
- unknown slot, exact-type mismatch, or JSON-kind mismatch;
- backward edge or graph cycle;
- effect conflict or effect overflow;
- authority overflow;
- context or compiled-method overflow;
- changed method digest, missing executor, malformed input, malformed output,
  or undeclared execution output.

## certification

the release builder emits deterministic registry, vocabulary, compatibility,
plan, activation, method, execution, conflict, and budget evidence plus one
append-only receipt. it binds exact implementation and test manifests, the two
parent trust roots, focused and full test counts, review disposition, proof
limits, and every generated byte.

## proof limits

v1 proves typed orchestration for the certified Muse and Forge canaries with a
negative Aegis compatibility boundary. it does not prove general planning or
model quality, execute a real skill or provider, persist runtime state, survive
process death, grant effects or authority, change default activation, package a
portable `.godskill`, integrate Godagents or Lunari, or protect against a
hostile same-user operating-system actor.
