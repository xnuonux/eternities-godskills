---
name: infrastructure-plan-apply-isolation
description: Use when Terraform or similar infrastructure changes need isolated plan evidence, selective mock coverage, and an explicit boundary before any state-changing apply.
---

# Infrastructure plan/apply isolation

Use this entrypoint to make infrastructure changes reviewable before they can alter shared state. It supports real, authorized implementation and verification, but keeps a static plan, a mocked unit check, and an applied change distinct. A passing plan is evidence about a proposed graph; it is not proof that provider behavior, permissions, remote state, or cleanup will succeed.

## Establish the change boundary

Record the tool and provider versions, working directory, module inputs, workspace or account, state backend identity, lock behavior, and the exact resource scope. State whether the current action is `plan`, a test-only run, or `apply`. Identify credentials by configured source rather than copying secrets into logs. If the repository supports several Terraform versions, detect the active version first and read the matching test and mock semantics; do not assume an API from a newer release.

Separate three evidence lanes:

- **Static and unit lane:** validate variables, defaults, types, preconditions, conditional resources, tags, naming, outputs, and expected validation failures. Use mocks only for assertions the supported test framework can actually make in plan mode.
- **Plan lane:** run the narrowest plan that includes the intended module and inputs. Capture the planned additions, changes, destroys, unknown values, provider configuration, and any warnings. A plan with unexpected replacement, broad drift, or unresolved sensitive values is a stop signal.
- **Apply lane:** use only when the user has authorized the state-changing operation. Reconfirm target workspace, state key, account, cost or quota envelope, dependencies, and rollback or cleanup path immediately before apply. Do not infer apply permission from permission to prepare a plan.

## Design the isolation

Keep fast tests independent of credentials and remote state. Use mock providers or data only where they preserve the behavior under test; if a feature is unsupported in mocks, move that assertion to an isolated plan or integration run rather than weakening it. Test both the intended path and a deliberately invalid path: rejected variable values, mutually exclusive inputs, absent optional resources, changed defaults, and output contracts. For a module that creates dependent resources, assert dependency shape in the plan and apply a small representative graph only if the target environment is explicitly bounded.

For an authorized apply, use a unique and declared state identity, a serialized run, and a narrow resource address when the tool permits it. Preserve the plan artifact, state identity, provider/tool versions, input digest, command mode, approval record, and cleanup result. Destroy or revert only within the same declared scope and in dependency-safe order. If apply fails halfway, preserve the error and actual state before attempting recovery; do not rerun blindly.

## Finish with evidence

Return a decision record containing scope, version matrix, test and plan outcomes, resource diff, sensitive-value handling, state key, operator authorization, cost or quota notes, and unresolved provider differences. Mark each claim as static, mocked, planned, applied, or cleaned up. A fixture or authored plan is not evidence of a real provider action. Never report infrastructure safety, idempotence, or rollback success without the corresponding executed witness.

## Common failure modes

- Treating a mock-provider test as a provider API or permission test.
- Applying a plan after the workspace, inputs, or state identity changed.
- Letting unknown values hide an unexpected replacement or destroy.
- Reusing a shared state key for exploratory work.
- Printing credentials or sensitive planned values in a receipt.
- Retrying a partial apply without inspecting the actual remote state.
