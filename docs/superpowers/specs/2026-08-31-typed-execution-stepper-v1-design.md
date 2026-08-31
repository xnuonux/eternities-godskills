# Eternities typed execution stepper v1 design

## decision

add an additive, provider-neutral step protocol beside the certified typed-composition v1 runner. the stepper verifies the same private-provenance registry and method, exposes exactly one current node input at a time, accepts only that node's closed typed output, and deterministically reproduces the historical execution result.

the historical typed-composition source, receipt, generated artifacts, runner, router, activation compiler, capability packages, global installations, and Godagents host remain unchanged.

## problem

the certified v1 runner validates a complete graph but executes every node inside one process-local loop. a durable host can restart the method, but it cannot replay already accepted node outputs through the typed engine without invoking those executors again. wrapping executor functions outside the typed engine is insufficient because an invalid result could be persisted before the exact output contract rejects it.

the missing boundary is therefore not storage. it is a typed commit point after node validation and before the next node becomes runnable.

## protocol

`beginTypedMissionExecution` verifies one exact registry, private method, and complete mission-input set. it returns a frozen body-free handle whose private state remains module-owned.

`nextTypedMissionExecutionStep` returns either:

- one frozen branded `ready` projection for the current topological node, binding mission, method, mission inputs, order, phase, capability, activation decision, exact closed input envelope, and one step digest; or
- one frozen `completed` projection containing the same outputs and receipt as the historical reference runner.

repeated reads before commit return the same current projection. no executor runs inside the stepper.

`commitTypedMissionExecutionStep` accepts only the current branded projection owned by that execution. it validates one exact output envelope against the method's closed output slots and JSON kinds before updating private state. invalid output leaves the current step unchanged. cloned, forged, stale, reordered, or cross-execution projections fail closed.

## deterministic replay

a recovering host reconstructs the same verified registry and method, begins a fresh execution from the same mission inputs, and feeds previously committed output envelopes back through each newly emitted step. each output is revalidated by the typed engine. once the persisted prefix is exhausted, the host executes only the first uncommitted step.

the stepper itself persists nothing and promises no exactly-once external effect. it supplies the validation boundary a durable Godagents journal needs.

## compatibility

the additive module imports the certified typed-composition verifier but does not modify `src/typed-composition.mjs` or any historical typed-composition artifact. its deterministic canary must prove:

- the two emitted steps are Muse then Forge in the certified topological order;
- Forge receives the exact accepted Muse handoff;
- invalid output does not advance state;
- cloned and cross-execution steps reject;
- replaying accepted outputs through a fresh handle yields the exact historical outputs and execution receipt;
- handles and step projections contain no skill, method, or reviewer body;
- no authority, effect, provider, credential, default launch, Realm, continuity, evolution, Lunari, Inspiration, or Soul path is added.

## certification

one append-only receipt pins the historical typed-composition receipt, the additive source closure, design, plan, tests, deterministic step transcript, historical execution parity, focused count, full repository count, and inline adversarial disposition. two independent in-process builds must reproduce every artifact byte.

## proof limits

v1 proves a deterministic typed commit point and replay protocol for the certified capability canaries. it does not persist outputs, reconcile transport state, deduplicate an external executor, survive hostile same-user mutation, execute a live model or skill, authenticate providers, or integrate Godagents. those are separate consumer gates.
