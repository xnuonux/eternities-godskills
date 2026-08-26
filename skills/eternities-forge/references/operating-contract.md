# Eternities Forge operating contract

## Route selection

- `feature`: a settled outcome needs implementation, tests, review, and proof across more than one slice.
- `regression`: root-cause diagnosis, a reproducing test, repair, and regression proof must remain one chain.
- `refactor`: behavior must be preserved while structure changes under a verified baseline.
- `risky-integration`: isolation, cross-boundary changes, rollback, review, and branch integration all matter.

If one installed process skill completes the request, yield to it. Forge is an orchestration layer, not an always-on wrapper.

## Slice contract

Every implementation slice records:

1. intended observable behavior;
2. exact files or boundary in scope;
3. failing test or substitute validation observed before the change;
4. minimal implementation;
5. focused verification result;
6. remaining dependency and rollback point.

Do not batch unrelated behavior into one slice. Do not turn incidental cleanup into an unstated requirement.

## Evidence hierarchy

Prefer, in order: behavior tests, integration tests, deterministic validators, inspected generated output, focused manual reproduction, then static reasoning. Static reasoning alone cannot certify runtime behavior when a practical executable surface exists.

## Review gate

Review considers correctness, security, performance, failure behavior, compatibility, maintainability, test honesty, and diff scope. Severity is based on user impact and likelihood, not reviewer confidence. Disputed findings require code or test evidence.

## Termination and recovery

On failed verification, preserve the failing output and return to the smallest responsible slice. On authority or external-state boundaries, stop before mutation. On integration conflict, preserve both states and hand off exact evidence. Never invoke Forge recursively.
