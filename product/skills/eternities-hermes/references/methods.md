# Hermes method cards

## Browser and automation close-out

Represent each workflow as an input, context, action, expected observation, failure branch, and close-out. Discover references in the current context before acting; a selector or handle from another page is not evidence. Make waits conditional on observable state, retain downloaded or captured artifacts locally when authorized, and define cleanup for every session, temporary file, and remote fixture.

## Protocol and CLI integration

Write the interface boundary before the adapter: schemas, version, read and write operations, authentication ownership, timeouts, retries, idempotency, error mapping, and receipt. Keep credentials out of logs and fixtures. Test malformed input, unavailable dependency, partial response, duplicate request, timeout, and rejected mutation. A generated manifest or client is ready for review only after its output and failure contract are inspected.

## Remote-test coordination

Create a matrix of fixture, prerequisite, permitted effect, skip reason, expected evidence, and cleanup. Mark unavailable environment or remote state as skipped or unresolved. Do not infer a successful remote mutation from a local plan, mocked response, or stale receipt.
