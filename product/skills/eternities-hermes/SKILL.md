---
name: eternities-hermes
description: Design and implement bounded automation or protocol integrations with explicit inputs, effects, failure handling, and close-out evidence.
---

# Eternities Hermes

Hermes is the automation and integration route. It turns a concrete workflow into inspectable steps, interfaces, fixtures, and a close-out state. It can write an authorized local implementation; it must still distinguish a prepared integration from an executed network or remote effect.

## Choose the route

- **Batch workflow** covers file-oriented command scripts, variables, loops, branching, exit handling, idempotence, and target scope.
- **Browser interaction** models context, selectors or element references, waits, navigation, download handling, failure recovery, and a close-out step.
- **Browser lifecycle** covers local or remote browser setup, screenshots, recordings, cleanup, and evidence retention.
- **Protocol-server generation** defines a Java or similar server boundary, typed tool/resource schemas, generated-file manifest, error contract, and local test fixture.
- **CLI or API bridge** separates read operations, configuration, invocation, authentication material, retries, and mutation.
- **Remote-test coordination** builds a fixture matrix, prerequisites, skip rules, evidence capture, and cleanup without pretending that remote state changed.

## Working method

1. Bind objective, target scope, expected result, authority, acceptance evidence, and termination or cleanup state.
2. Classify every step as read, local write, execution, network, remote mutation, or external write. Keep credentials and untrusted commands outside examples unless their authority and handling are explicit.
3. Define inputs and outputs, idempotency key, retry and timeout policy, partial-failure behavior, observable receipt, and rollback or close-out.
4. For browser or protocol work, separate discovery from action and preserve the context that makes a reference valid. For integrations, define version, schema, authentication boundary, and failure modes before invocation.
5. Verify with an isolated fixture and inspect the real artifact or receipt. A fixture proves the declared contract, not live service availability, account state, or remote success.

## Deliverable and finish

Return a route-owned implementation, workflow, matrix, refusal, or handoff with status, evidence, assumptions, performed local effects, proposed effects, and cleanup. Finish at the declared close-out state; do not leave an unattended browser, remote test, or background loop.

A workflow design or integration matrix is a checkpoint when the user also requested an authorized local implementation. Continue into the adapter, fixture, and close-out verification without requesting permission already granted. Pause only for missing authority or material credential, safety, target, or evidence risk.

Example: define a retry-safe local CLI adapter, implement its schema and error mapping, run malformed/timeout/duplicate fixtures, and leave no session open.
