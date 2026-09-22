# Consumer exercise: retry simulation and layered evidence

This is an author-designed, non-independent exercise for parent evaluation. It is not a completed consumer run, benchmark, certification, or acceptance decision. Do not infer expected output from this task; the parent should freeze separate criteria before assigning it.

Build a small deterministic retry-policy simulator and its tests for a fictional checkout API. It should accept a seed and a declared failure model, produce replayable request and retry events, compare at least two policies under the same stream, and expose bounded memory or an explicit aggregation rule. Include ordinary success, timeout, rate-limit, connection-reset, burst, budget-exhaustion, cancellation, and cleanup cases.

Deliver code plus tests that distinguish simulated inputs, mocked external boundaries, and observed runtime results. Use an independent expected-result route for the schedule or retry invariant. Include one narrow end-to-end journey with disposable data and reverse-order cleanup, and make clear which claims a mock can and cannot support. No network, provider, deployment, or production access is part of the exercise.
