# Exa and Jev cold skill acquisition

Status: acquired, parent-validated, warehouse-indexed, and registered as a
cold Godskills intake. Nothing in this batch is activated, promoted, or
quality-certified.

Exa discovery produced a 185-repository frontier. Jev supplied advisory
skill/catalog/software/abstain proposals; it did not grant trust or decide
activation. Deterministic metadata and Git operations then applied a 50,000
KiB repository-size bound, shallow-clone safety settings, a 60-second clone
timeout, no retries, no submodules, no tags, disabled repository hooks, and a
40-success ceiling. No upstream setup, installer, hook, test, model call, or
skill body was executed.

## Verified result

- 40 repositories were cloned and independently revalidated against exact
  origin, HEAD, clean status, shallow state, and repository-local safety
  configuration.
- 39 repositories contain 2,643 tracked `SKILL.md` entrypoints with 2,558
  unique SHA-256 bodies. `frankxai/awesome-music-agent-skills` is retained as
  a catalog repository with no direct `SKILL.md` entrypoint in this snapshot.
- Every source record was independently checked against its current file byte
  length, SHA-256, and Git blob hash.
- 145 candidates were not acquired: 130 explicit deferrals and 15 failed
  decisions. Twenty operation-error rows are preserved, comprising those 15
  bounded clone failures/timeouts plus five metadata failures. There are zero
  source errors, verification errors, or path collisions.
- The shared warehouse index advanced additively from 1,519 rows at SHA-256
  `b86eaac286ff3e25f0c82291071f35c5ed0c0cba020445c2b817c50c5a2bd19a`
  to 1,559 rows at SHA-256
  `184adad737119b71a9866c9bc4c9d5607331c78f622f372d252565b1c25f2d74`.
  A byte-identical rollback copy and an integration receipt were written
  before and after the transaction.

## Godskills registration

`data/quarry-intake-2026-09-21-exa/sources.jsonl` registers the exact cold
source records. Its SHA-256 is
`85b09d2799e66ce5ad2f9abd1b1a78e903632d0c9c34ee0735d46e580c102536`.
The compact manifest binds that file to the original source envelope and the
warehouse integration receipt. Registration makes the sources visible to
deterministic reconciliation; it does not make them trusted instructions.

Operational evidence remains at
`D:\03-ARSENAL\warehouse\_operations\exa-skill-acquisition-2026-09-20`.
Repository bodies remain inert at
`D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20`.

## Next boundary

Use exact-body deduplication before semantic review. Jev may propose bounded
classification or near-duplicate candidates, but independent evidence must
decide whether a method is distinct, useful, license-compatible, and worthy of
first-party synthesis. No raw upstream skill should enter active routing merely
because it was acquired or labeled.
