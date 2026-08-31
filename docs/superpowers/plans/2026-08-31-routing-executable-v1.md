# Routing executable v1 implementation plan

## Goal

Publish one complete, reproducible executable trust root for the exact local
Godskills default and specialist routing programs so a host can launch only
reviewed bytes.

## Task 1: freeze the acceptance surface in tests

- Add `tests/routing-executable-receipt.test.mjs`.
- Require a deterministic receipt builder, complete static closure, exact
  routing artifacts, exact parent links, two real execution modes, strict
  arguments, and mutation refusal.
- Run the test before implementation and record the missing-module failure.

## Task 2: build the executable receipt

- Add `scripts/build-routing-executable-receipt.mjs`.
- Reuse `src/static-module-closure.mjs` for complete local dependency discovery.
- Bind canonical routing artifacts and the five exact parent receipts.
- Validate every path, byte count, digest, parent identity, and logical receipt
  digest before emitting one canonical receipt.

## Task 3: add the self-verifying entrypoint

- Add `scripts/routing.mjs`.
- Parse exactly `--mode`, `--request`, `--output`, and `--receipt`.
- Require absolute, single-line, pairwise-distinct paths.
- Rebuild and compare the executable receipt before reading the request.
- Dispatch only to the existing default or specialist routing transport with
  the fixed canonical cards path.

## Task 4: generate and verify the trust root

- Add `receipts/routing-executable-v1.json` from the checked builder.
- Preserve the receipt-bound historical `package.json` bytes and expose the
  direct builder command in the README.
- Run the focused routing, compiler, specialist, closure, and activation tests.
- Build twice and require exact logical and file digest equality.
- Mutate each dependency class in isolated test fixtures and require refusal.

## Task 5: document and integrate

- Add `docs/routing-executable-v1-certification.md`.
- Update `README.md` with the executable boundary and explicit limits.
- Run the full repository suite.
- Perform inline adversarial review, commit source and release evidence
  separately, fast-forward main, verify origin, push, and remove the worktree.

## Dependent Godagents phase

After the Godskills trust root is canonical, add a new opt-in Godagents pin and
local transport that verifies this exact receipt, launches the secure entrypoint
with a scrubbed environment, enforces timeout and byte ceilings, and persists
content-addressed results for recoverable admission. Preserve every historical
Godagents pin and receipt byte-for-byte.
