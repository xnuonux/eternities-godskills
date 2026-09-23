# Daedalus method cards

## behavioral-test-maintainability-review

Start from the behavior contract, not line coverage. Inventory tests by user-visible behavior, boundary, failure mode, isolation, fixture ownership, mutation sensitivity, runtime, and maintenance cost. Remove or repair tests that pass while the behavior is broken, depend on shared order, assert implementation trivia, or hide important setup. Use a small mutation or perturbation probe when it can demonstrate sensitivity, and record the limits of that probe.

## bounded-typed-graphql-contract-and-execution

Freeze schema scope, resolver ownership, input and output types, authorization context, error taxonomy, depth or cost rule, and supported query shapes. Implement the smallest contract, then test valid, malformed, unauthorized, over-budget, partial, and resolver-failure cases. Verify both the schema artifact and an execution fixture; keep a live service claim separate.

## configuration-schema-environment-and-migration-validation

List configuration sources and precedence, then define canonical shape, defaults, secret references, compatibility versions, invalid values, and migration rules. Test each source alone and in conflict, include missing and malformed values, and show that migration is idempotent or safely repeatable. Preserve the old representation and a rollback command or artifact before changing runtime use.

## evidence-first-data-path-performance-reduction

Capture a repeatable workload, functional result, latency distribution, resource measures, environment, and baseline trace. Locate the dominant causal path, change one bounded lever, and rerun the same workload plus correctness and regression checks. Report gain, variance, trade-offs, and unmeasured surfaces; do not optimize from a single timing.

## fp-ts-react-state-validation-and-effects

Model component states and transitions explicitly, keep validation results typed, and isolate effects from pure decisions. Check loading, success, error, cancellation, retry, stale response, unmount, keyboard, focus, and announcement behavior. Test the reducer or algebra directly and the rendered lifecycle through a realistic fixture so types do not conceal an inaccessible runtime.

## incremental-dependency-and-framework-upgrades

Record the dependency graph, runtime matrix, lockfile state, deprecation or compatibility evidence, and rollback point. Upgrade one coherent slice, run focused and broad checks, inspect generated output, and preserve an immediately reversible checkpoint. Separate a known incompatibility from an untested behavior and do not accept a green install as proof of runtime parity.

## offline-pwa-release-readiness

Inventory routes, asset classes, service-worker scope, cache versioning, update path, install behavior, fallback page, data writes, and recovery expectations. Exercise first load, offline revisit, stale cache, new release, interrupted update, missing asset, and restored connectivity. Verify that old and new workers do not strand the user, then report device/browser coverage limits.

## question-driven-telemetry-self-verification

Write the decision question and event contract before instrumentation. Define event start and completion, identity, ordering, retries, privacy, consent, retention, and expected counts. Use a fixture that injects duplicates, drops, late arrivals, malformed payloads, and denied consent; compare observed events with an independently calculated expected ledger before using the metric.

## red-green-refactor-behavior-proof

Choose one settled behavior and write the smallest failing test or direct probe that demonstrates the missing result. Make the minimal change until it passes, then refactor only with the proof still active. Rerun nearby regressions and record the pre-change failure, final evidence, remaining coverage boundary, and rollback point.

## partial-commit-and-compensation-state-matrix

Use only when the requirement intentionally preserves a durable effect while another operation may fail, or when a commit can precede an uncertain acknowledgement. Ordinary all-or-nothing work belongs in one verified transaction only when the relevant effects share a supported transactional boundary; a remote service or other external effect is not made atomic by a database transaction. Where no such boundary exists, preserve the unresolved effect and design reconciliation or authorized compensation rather than asserting rollback. Read-only queries do not need a saga or compensation plan. Name the database engine, driver, ORM and versions, isolation/autocommit mode, ordered operations, external effects, commit points, operation identity, and who may authorize compensation. Do not infer savepoint syntax or transaction behavior from another engine's examples.

Draw a timeline for every operation and observable effect. At each failure point, independently classify state as uncommitted, rolled back, committed, compensated, pending reconciliation, or unknown. Choose the required invariant before code: all-or-nothing, intentional durable checkpoint, or a committed effect with explicit compensation. If requirements conflict, preserve the conflict rather than quietly choosing a transaction layout. A logical delete or later reversing action is not the same as an atomic rollback. If a timeout may have occurred after commit, read authoritative state by operation identity before any retry; make replay idempotent where possible and model a compensation failure separately.

Write an expected final-state matrix before implementation. Inject failure before and after every commit/effect, a crash after commit but before acknowledgement, duplicate and concurrent retries, unavailable authoritative state, and failed compensation. Compare observed states to the independent matrix. Return the timeline, engine/version evidence, matrix, reconciliation and idempotency plan, performed effects, compensation authority, tests, and unresolved states. If order creation commits a payment record before provisioning fails, report the payment as `committed` and provisioning as pending; never claim the whole workflow rolled back. Route schema/migration questions to Atlas, release interruption to release-script-safety, and provider quota retries to api-rate-limit-recovery.
