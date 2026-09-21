---
name: bounded-service-shutdown
description: Use when an authorized service or worker must stop admitting work, drain tracked activity, release resources, and report a deadline-bounded exit.
---

# Bounded service shutdown

Use this entrypoint to implement or review a shutdown lifecycle that can distinguish an orderly drain from a forced stop. The method applies to a service, worker, job runner, or embedded process whose active work and cleanup obligations can be observed.

## Model the lifecycle

Define explicit states such as running, quiescing, draining, closing, stopped, and forced. Identify every admission path, listener, queue, background task, timer, connection pool, and cleanup hook. The active-work count must have a clear increment point and a matching settlement point; a journal entry or queue length is not automatically proof that a worker has finished.

Use a monotonic deadline derived from the host's actual grace window. Record whether the deadline covers admission stop, drain, and cleanup separately. If the platform window is unknown, produce a missing-evidence result instead of choosing a convenient timeout.

## Implement the path

1. Make the transition idempotent. A duplicate signal or shutdown request returns the existing outcome and cannot start a second drain.
2. Lower readiness or otherwise stop new admission before waiting for old work. Close or reject every ingress path, not just the first listener.
3. Track in-flight work through completion, cancellation, and error settlement. New work after quiescence must be visible as rejected, not silently counted as drained.
4. Await the drain with an event or condition tied to the count and the monotonic deadline. Avoid a fixed sleep that can pass while work remains.
5. Close resources in dependency order and classify each cleanup result. A forced deadline must leave a typed receipt listing unfinished work and cleanup.
6. Keep late completion handling separate from the already-published exit status. It may be recorded diagnostically without rewriting the shutdown decision.

If an authorized deployment adapter is part of the task, keep it behind the lifecycle contract so the service can be tested without controlling a live orchestrator. The adapter may use the host's normal signal or termination mechanism only after the scope names that effect.

## Verify and finish

Exercise clean drain, duplicate requests, a task that settles just before the deadline, a stuck task, cleanup failure, a new request during quiescence, and a late worker completion. Use a controllable clock or event-driven test harness. Check that readiness changes before the first drain wait, the active count reaches zero only after settlement, and the result is stable under repeated shutdown calls.

Finish when the implementation has a bounded clean path and an explicit forced path, each resource has a disposition, and the receipt says whether the evidence covers the whole ingress surface. Do not treat one listener close as proof that every transport drained.

## Common failure modes

- Setting readiness false after beginning the drain.
- Counting queued work as complete before its handler settles.
- Letting a second signal bypass the existing deadline.
- Hiding cleanup failures behind a generic “stopped” message.
- Using wall-clock time that jumps during the grace window.
