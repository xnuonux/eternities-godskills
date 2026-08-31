# specialist preference routing v1 implementation plan

**goal:** add a backward-identical, preference-only routing extension and an
exact executable receipt that Godagents can verify before forwarding a
specialist profile.

**architecture:** preferences are optional portable ids handled by a versioned
additive compiler, index, router, runtime, and CLI. the old certified path is
never edited. preferences are validated against the complete index, retained
in the bounded shortlist, and considered only after every historical selection
metric except lexical id. omission delegates to the old runtime and remains
byte-identical.

**spec:**
`docs/superpowers/specs/2026-08-31-specialist-preference-routing-v1-design.md`

## constraints

- preserve all historical source modules, receipts, and checked artifacts
  byte-for-byte;
- do not modify adaptive activation or cross-trial evidence roots;
- do not treat preference as eligibility, prohibition, authority, semantic
  evidence, or a user decision;
- do not change an old request's output or digest;
- implement every behavior change after its focused test fails;
- work inline with no subagents;
- keep each repository independently revertible and certifiable.

## task 1: close the preference request and receipt contract

- add versioned natural-request validation for optional sorted unique
  `preferredCapabilities` with a 32-id ceiling;
- add versioned route-envelope and route-receipt semantic verification;
- retain exact historical shapes when the field is absent;
- add fail-closed tests for duplicates, order, unknown ids, forbidden overlap,
  malformed metadata, and false application claims.

## task 2: preserve preferences through compilation and shortlisting

- compile through the historical compiler after removing only the validated
  preference field, then bind the complete original request in the extended
  receipt digest;
- copy preferences without inference or expansion;
- validate every id against the complete index;
- union preferred ids into the semantic candidate set only for explicit
  policy qualification;
- fail when the union exceeds the 32-card boundary;
- prove omission produces byte-identical compiler and route receipts.

## task 3: apply the final tie breaker

- retain the historical comparator unchanged;
- add a preference-aware comparator after evidence and before lexical id;
- compute the historical baseline selection in the same invocation;
- emit exact preference metadata and reason;
- prove a stronger non-preferred route still wins and a rejected preferred
  route remains rejected.

## task 4: build the executable receipt

- add deterministic equal-tie, no-effect, stronger-nonpreferred, rejected,
  unresolved, and legacy fixtures;
- bind exact parent receipts, executable closure, routing artifacts, sources,
  tests, outputs, and proof limits;
- rebuild twice and compare every output byte;
- preserve package metadata unless a new script can be added without changing
  a parent-bound file.

## task 5: integrate Godagents

- add an optional exact preference-routing pin and verifier;
- forward only eligibility-derived `preferredIds`;
- bind the trust root and preference set into source and cycle identities;
- reject any compiler or route echo drift;
- keep all-rounder and legacy-pin outputs unchanged;
- prove recovery performs no new preference routing.

## task 6: certify and integrate

- run focused tests in both repositories;
- compare every protected parent byte;
- perform an inline adversarial review and retain each reproduced bypass as a
  regression test;
- run deterministic rebuilds and both full suites;
- issue separate exact receipts and honest certification documents;
- fast-forward and push Godskills first, then update, verify, fast-forward, and
  push Godagents;
- remove only clean merged worktrees.
