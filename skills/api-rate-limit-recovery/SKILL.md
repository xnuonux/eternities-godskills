---
name: api-rate-limit-recovery
description: "Use when a client must recover from explicit rate-limit responses through bounded retry, backoff, and idempotency controls. Do not use to evade quotas or amplify traffic."
---

# API rate-limit recovery

Implement protocol-aware retry behavior that respects server guidance, preserves idempotency, and terminates under a declared attempt and time budget.

## use when

- Add bounded recovery for documented rate-limit responses.
- Verify retry delay, idempotency, jitter, and terminal failure behavior.

## do not use when

- Circumvent a provider quota or access policy.
- Retry non-idempotent work without a deduplication contract.

## inputs

- documented response and retry semantics
- request idempotency model
- attempt latency and concurrency budgets

## preconditions

- retry semantics are current and documented
- the operation's idempotency class is known

## workflow

1. classify retryable responses and server delay hints
2. bind attempts to idempotency and cancellation
3. apply capped backoff and jitter
4. verify success exhaustion malformed-hint and concurrency cases

## outputs

- bounded rate-limit recovery path
- retry trace and exhaustion evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop at the attempt or elapsed-time ceiling
- surface malformed delay guidance instead of retrying indefinitely

## exclusions

- does not increase account quota
- does not authorize network calls or credential use

## termination

Stop when bounded success, cancellation, exhaustion, malformed guidance, and duplicate-prevention cases pass locally.
