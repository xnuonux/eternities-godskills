# Hermes method cards

## Browser and automation close-out

Represent each workflow as an input, context, action, expected observation, failure branch, and close-out. Discover references in the current context before acting; a selector or handle from another page is not evidence. Make waits conditional on observable state, retain downloaded or captured artifacts locally when authorized, and define cleanup for every session, temporary file, and remote fixture.

## Protocol and CLI integration

Write the interface boundary before the adapter: schemas, version, read and write operations, authentication ownership, timeouts, retries, idempotency, error mapping, and receipt. Keep credentials out of logs and fixtures. Test malformed input, unavailable dependency, partial response, duplicate request, timeout, and rejected mutation. A generated manifest or client is ready for review only after its output and failure contract are inspected.

## Remote-test coordination

Create a matrix of fixture, prerequisite, permitted effect, skip reason, expected evidence, and cleanup. Mark unavailable environment or remote state as skipped or unresolved. Do not infer a successful remote mutation from a local plan, mocked response, or stale receipt.

## Optional adapters and truthful degradation

Decide optionality at the environment and consumer boundary: a notification may
be dispensable in a preview while a legally required audit, payment or durable
write is not. Do not infer optionality just because a dependency is absent.
Define explicit real, unavailable, degraded and fixture/mock states, and verify
that callers observe them. A no-op may suppress an authorized optional effect;
it must not report that the effect happened or replace required data with fiction.

Test the real adapter, missing configuration, runtime failure, partial success,
fallback and recovery. Make degraded mode visible without exposing credentials.
Prevent fallback after partial success from causing a duplicate write, and do
not automatically replay a suppressed effect when the backend returns. Require
the ordinary reconciliation and idempotency checks for any recovery action.
Return performed and omitted effects separately. A service starting successfully
does not prove its outbound integrations worked.
