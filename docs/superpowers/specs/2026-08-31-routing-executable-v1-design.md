# Routing executable v1 design

## Status

Approved for implementation on `feat/routing-executable-v1`.

This milestone is additive. Existing router, compiler, specialist-preference,
portable-capability, activation, evaluator, and skill-body receipts remain
immutable.

## Problem

Godagents verifies every returned routing receipt, but its current local route
transport launches `scripts/intent.mjs` or `scripts/intent-preference.mjs`
directly from a repository path. The route result is bounded, but the invoked
program is not represented by one complete executable dependency closure. A
host therefore cannot prove that the exact program it launches is the program
reviewed by Godskills.

The current host subprocess also inherits ambient environment data and has no
uniform executable-level timeout or output-byte contract. Those host defects
will be closed in the dependent Godagents phase, but Godskills must first
publish an exact executable trust root that the host can verify.

## Decision

Add one secure routing entrypoint and one self-reproducing executable receipt.

The entrypoint supports exactly two modes:

- `default`, which invokes the existing certified intent compiler and router;
- `specialist`, which invokes the separately certified preference-aware path.

It accepts only absolute request, output, and receipt paths plus the closed
mode. It fixes the routing-card path to the canonical repository artifact and
does not accept caller-selected cards, modules, providers, models, credentials,
or endpoints. Before reading the request, it rebuilds the executable receipt
from the current repository bytes and requires the supplied receipt to match
exactly.

## Complete executable closure

`scripts/build-routing-executable-receipt.mjs` discovers the complete static
local-module closure from `scripts/routing.mjs`. Because the entrypoint imports
the builder and both existing routing transports, the closure includes the
runtime verification path, default compiler path, specialist path, router,
contracts, index, quarry atlas, canonical I/O, and closure scanner.

The receipt additionally binds the canonical routing cards, family map, and
manifest plus exact parent receipt bytes and logical receipt digests for:

- Godskills System v3;
- agent-native router v8;
- intent compiler v3;
- portable capability manifest v1;
- specialist preference routing v1.

Every path is repository-relative, resolves beneath the canonical root, and
must not be a symlink or non-canonical alias. Every artifact records exact
bytes and SHA-256. JSON parents also require a valid logical receipt digest.

## Runtime boundary

The executable:

1. parses a closed argument set;
2. verifies the candidate receipt against a fresh exact rebuild;
3. chooses one fixed existing transport by the closed mode;
4. reads one request and the canonical routing cards;
5. writes one canonical result atomically;
6. emits no provider call, model call, skill-body read, Realm action,
   continuity write, identity mutation, evolution, Inspiration, or Soul state.

The host remains responsible for a scrubbed child environment, process timeout,
request and result byte ceilings, durable dispatch reconciliation, and process
cleanup. This receipt gives that host an exact executable identity; it does not
claim those host guarantees by itself.

## Acceptance claims

| id | claim |
| --- | --- |
| `REX-001` | one receipt binds the complete static closure of the secure routing entrypoint |
| `REX-002` | default and specialist modes bind their exact existing certified runtimes |
| `REX-003` | cards, family map, manifest, and all five parent receipts are exact inputs |
| `REX-004` | two builds from unchanged bytes reproduce one logical receipt digest and file hash |
| `REX-005` | changed module, routing artifact, parent, or receipt bytes fail before request execution |
| `REX-006` | unknown, duplicate, missing, relative, aliased, and colliding arguments fail closed |
| `REX-007` | both real modes produce valid deterministic routing results through the new entrypoint |
| `REX-008` | the executable contains no network, credential, provider, Realm, continuity, identity, evolution, Inspiration, or Soul authority |
| `REX-009` | existing router, compiler, preference, and activation tests remain unchanged and green |

## Explicit non-goals

- no model or provider call;
- no credential resolution;
- no host subprocess environment guarantee;
- no timeout or output-byte enforcement outside the entrypoint contract;
- no durable host reconciliation or atomic external deduplication;
- no routing-quality claim beyond inherited certified fixtures;
- no live unseen-mission or production-generalization claim;
- no global skill activation;
- no Godagents, Codex, Claude Code, Lunari, Realm, continuity, Inspiration, or
  Soul integration.
