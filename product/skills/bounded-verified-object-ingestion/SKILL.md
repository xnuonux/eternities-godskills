---
name: bounded-verified-object-ingestion
description: Use when a declared object set must be ingested with exact membership, identity and digest checks, quarantine, replayability, and recoverable writes.
---

# Bounded verified object ingestion

Use this entrypoint when the input is a manifest, catalog, or other explicit object set and the result must be auditable. It supports real authorized ingestion, not arbitrary discovery disguised as reconciliation.

## Freeze membership and identity

Start with the manifest's scope, object identifier, expected size, content digest, type or schema, source location, and destination contract. Canonicalize identifiers before comparing them. Record the manifest digest and acquisition revision so a later run can distinguish a changed source from a changed validator.

Validate objects before mutating the destination. Check that the object is in the manifest, its bytes or declared canonical representation match the digest, its size and type are acceptable, and its required fields satisfy the destination schema. Keep identity validation separate from semantic quality review: a byte match does not prove that the content is useful or safe.

## Stage, classify, and commit

1. Freeze the source listing or verify the manifest's generation rule. If membership changes during the run, stop or create a new explicit revision.
2. Classify every item exactly once as accepted, rejected, quarantined, missing, or conflicted. A duplicate identifier with different bytes is a conflict, not an overwrite opportunity.
3. Write accepted content to a staging boundary, then validate the staged artifact. Prefer an atomic move or transaction where the destination supports it.
4. Keep malformed, ambiguous, oversized, or digest-mismatched objects in a quarantine record with a reason and source locator. Do not silently coerce them into the accepted set.
5. Append a replay ledger containing manifest revision, item identity, prior status, new status, destination digest, and rollback reference. A rerun with the same manifest and bytes should be a no-op or an explicitly recorded replay.
6. Reconcile counts and digests after commit. If a post-write invariant fails, preserve the original and use the declared rollback path.

Source deletion, storage migration, and external publication are separate operations. Perform them only when the task scope names them; ingestion alone does not imply permission to erase or deploy.

## Evidence and finish

The receipt should answer: which manifest was used, which objects were seen, why each was accepted or refused, what was quarantined, what destination bytes were written, and how a rollback or replay would behave. Use a deterministic fixture to prove duplicate, conflict, missing, malformed, and changed-membership cases. A successful fixture does not certify arbitrary source data.

Finish when every manifest item has one reconciled status, accepted content is digest-verifiable, conflicts cannot overwrite existing objects, and replay or rollback evidence is available.

## Common failure modes

- Enumerating the destination and treating that as the source manifest.
- Hashing a transformed representation while claiming to verify source bytes.
- Treating a duplicate name as the same object without checking content.
- Committing before quarantine decisions are durable.
- Reporting a count match while omitting missing or rejected items.
