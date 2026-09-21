---
name: api-rate-limit-recovery
description: Use when an authorized client must recover from documented rate limits while preserving idempotency, cancellation, bounded backoff, and a clear terminal outcome.
---

# API rate-limit recovery

Use this entrypoint to make retry behavior a bounded part of a client contract. It is for implementing or reviewing a recovery path, not for working around a quota or disguising a rejected request.

## Establish the contract

Record the retryable status codes and provider-specific response fields, the accepted forms of Retry-After or equivalent delay hints, the operation's idempotency class, and the maximum attempt count and elapsed-time budget. Keep transport failures, application failures, cancellation, and rate limiting as separate causes. State whether a request key, deduplication record, or transactional operation makes a retry safe.

Before changing code, identify where concurrency is admitted and where a result becomes externally visible. A retry policy that is safe for a read may duplicate a charge, message, or mutation when reused for a non-idempotent operation.

## Implement the bounded path

1. Classify only documented rate-limit responses as rate-limit events. Preserve the original response and correlation data in the trace.
2. For a valid delay hint, apply the declared unit and a hard cap. For a missing hint, use a capped backoff policy with bounded jitter. A negative, non-finite, or malformed hint is a typed policy failure unless the contract explicitly defines a safe fallback.
3. Reuse the same idempotency key for every attempt. Never create a fresh key merely because the first attempt was delayed. If the operation is not idempotent and has no deduplication boundary, stop before retrying.
4. Check cancellation and the monotonic deadline before waiting and before dispatch. Do not let a sleep or a queued retry outlive the caller's budget.
5. Bound concurrency per the actual identity that is limited. Coordinate workers so a burst does not turn one server rejection into a synchronized retry storm.
6. Return success, cancellation, exhausted, malformed-guidance, and duplicate-prevention outcomes as distinguishable results.

## Evidence and finish

Produce a retry trace containing attempt number, response class, delay source, capped delay, remaining budget, and a redacted idempotency-key reference. Exercise a successful retry, repeated rejection, malformed guidance, cancellation during the wait, deadline exhaustion, and concurrent duplicate submission. If a live endpoint is authorized, use its declared test contract; otherwise a deterministic transport stub is enough to verify client behavior, not provider performance.

Finish when the implementation has no path beyond the attempt or time ceiling, preserves deduplication across retries, and leaves an inspectable terminal receipt. Do not call a green fixture proof that a remote service will honor an undocumented behavior.

## Common failure modes

- Retrying every 5xx or timeout without classifying whether the operation was committed.
- Treating a server delay as an unbounded sleep.
- Resetting the deadline on each attempt.
- Testing only success and never proving cancellation or malformed hints.
- Sharing one global limiter when the provider limits by credential, route, tenant, or resource.
