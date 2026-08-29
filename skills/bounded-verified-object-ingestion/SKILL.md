---
name: bounded-verified-object-ingestion
description: "Use when supplied objects must be ingested through explicit scope, identity, integrity, and rollback checks. Do not use for arbitrary storage mutation or unbounded discovery."
---

# Bounded verified object ingestion

Convert a declared object set into a reconciled local ingestion artifact with exact membership, validation, quarantine, and replay evidence.

## use when

- Ingest a declared object set with exact integrity checks.
- Reconcile accepted quarantined and rejected objects into a replayable ledger.

## do not use when

- Crawl or read files outside the authorized manifest.
- Mutate storage before identity integrity and rollback gates pass.

## inputs

- authorized object manifest and scope
- identity schema and integrity digests
- destination contract and rollback location

## preconditions

- source membership is explicit
- destination and rollback boundaries are writable and distinct

## workflow

1. freeze exact source membership
2. validate identity shape size and digest
3. quarantine malformed or conflicting objects
4. write accepted objects and reconcile a replay ledger

## outputs

- bounded ingested object set
- accepted rejected quarantine and rollback ledger

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: destination-write, manifest-bound-read
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop when source membership drifts
- quarantine collisions instead of overwriting them

## exclusions

- does not enumerate arbitrary paths
- does not delete source objects

## termination

Stop when every manifest object is accepted, quarantined, or rejected exactly once and replay verification is clean.
