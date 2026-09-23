# Hermes method cards

## Browser and automation close-out

Represent each workflow as an input, context, action, expected observation, failure branch, and close-out. Discover references in the current context before acting; a selector or handle from another page is not evidence. Make waits conditional on observable state, retain downloaded or captured artifacts locally when authorized, and define cleanup for every session, temporary file, and remote fixture.

## Protocol and CLI integration

Write the interface boundary before the adapter: schemas, version, read and write operations, authentication ownership, timeouts, retries, idempotency, error mapping, and receipt. Keep credentials out of logs and fixtures. Test malformed input, unavailable dependency, partial response, duplicate request, timeout, and rejected mutation. A generated manifest or client is ready for review only after its output and failure contract are inspected.

## Incremental byte-to-record stream intake

Use when an authorized client must consume useful records before a response ends. First verify that the selected runtime and API version actually expose byte chunks. Declare the charset, the record framing rule (for example newline-delimited JSON or a length prefix), maximum buffered bytes and record size, consumer backpressure behavior, cancellation and timeout rules, and whether retrying the request is safe. An ordinary complete-body JSON response does not need this route. WebSocket, SSE, audio, and database streams need their own protocol semantics rather than this generic byte-framing rule.

Treat a transport chunk as arbitrary bytes, not as a character or record boundary. Keep one incremental decoder and framing state across callbacks. Emit only complete records; retain incomplete character bytes and a bounded partial frame. If the producer outruns the consumer, apply the declared backpressure or fail at the limit instead of accumulating without bound. At end-of-stream, flush the decoder and validate the remainder: a truncated or malformed final record is an error, not a successful partial completion. On cancellation, timeout, or callback failure, release resources and preserve the terminal cause and count of records already emitted. Reconcile uncertain request effects before retrying a non-idempotent operation.

Return a receipt with runtime/API version, schema and framing, buffer limits, complete-record count, partial-record disposition, and one terminal state: `complete`, `cancelled`, `transport-error`, `decode-error`, `frame-error`, or `limit-exceeded`. Test a multibyte UTF-8 character split at every byte boundary, one record split across chunks, several records in one chunk, a truncated final record, malformed bytes, slow consumer, limit breach, cancellation, and failure after partial emission. For example, an NDJSON response may emit two valid lines even when a third line is cut off, but its terminal state is `frame-error`, never `complete`. A fixture proves only its declared parser contract; verify the real platform before claiming compatibility.

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
