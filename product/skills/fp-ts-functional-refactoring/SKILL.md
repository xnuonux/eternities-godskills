---
name: fp-ts-functional-refactoring
description: Use when TypeScript behavior can be refactored into explicit typed data, validation, and effect boundaries while preserving runtime ordering and cancellation.
---

# fp-ts functional refactoring

Use this entrypoint when a TypeScript codebase already has behavior worth preserving and a functional representation can make data flow or failure handling clearer. It is a refactoring method, not a reason to introduce a library or erase a framework lifecycle.

## Characterize the boundary

Read the current tests, runtime version, package versions, error conventions, side effects, cancellation behavior, and sequencing requirements. Draw the current path from input to success, failure, cleanup, and external effect. Mark behavior that is observable through timing, logging, retries, resource ownership, or error identity.

Choose the smallest boundary for the first change. Domain parsing and validation often fit a pure transformation; I/O, clocks, randomness, cancellation, and framework callbacks should remain at an explicit edge. Use existing versions and project conventions. If the requested design needs a new dependency or a version change, surface that as a separate decision instead of smuggling it into the refactor.

## Refactor one seam at a time

1. Model valid domain values and expected failures explicitly. A discriminated union, Option, Either, or TaskEither is useful only when its cases match the real contract.
2. Compose pure parsing, validation, and transformation before invoking effects. Keep effectful work visible at the boundary and preserve its order.
3. Adapt the old boundary to the new representation rather than rewriting every caller at once. Keep error mapping and cancellation semantics deliberate.
4. Refactor one seam, run characterization and type checks, then compare success, error, cleanup, retries, and observable ordering. Continue only when the seam is understood.
5. Remove abstractions that make a lifecycle, stack trace, or ownership rule harder to see. Explicit imperative code is preferable when it explains the contract more faithfully.

## Verification and finish

The receipt should name the old and new boundary, type-level constraints, behavior cases, effect order, cancellation path, and dependency assumptions. Test real behavior rather than only checking constructors or mocked combinators. Include an error case, an interrupted or cancelled case when applicable, and a side-effect count or ordering assertion.

Finish when the characterized behavior and declared effect ordering remain stable, the type checker passes for the supported runtime, and the new representation makes invalid states or error paths inspectable. Type safety is not runtime proof, and a passing unit fixture does not certify every framework integration.

## Common failure modes

- Replacing a framework callback with a lazy abstraction that runs at a different time.
- Conflating absence, validation failure, and transport failure.
- Hiding cancellation behind an uninterruptible promise.
- Introducing a new fp-ts version or helper package without a dependency decision.
- Testing only the happy path and declaring the refactor semantics-preserving.
