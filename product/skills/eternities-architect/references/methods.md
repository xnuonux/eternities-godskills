# Architect method cards

## cross-boundary-semantic-contract-propagation-audit

Freeze one canonical contract: field or event name, type, units, nullability, allowed values, ownership, version, and meaning. Inventory every producer and consumer across schemas, APIs, storage, queues, interfaces, tests, fixtures, analytics, documentation, and migration scripts. Give each edge a locator and classify it as aligned, transformed, stale, absent, ambiguous, or contradicted.

For each transformation, write the mapping and the invariant it must preserve. Check naming, units, defaults, error semantics, ordering, identity, authorization context, and version negotiation. Exercise a representative valid value, boundary value, missing value, invalid value, and old-version value where a fixture exists. Compare the observed implementation with the intended contract rather than treating documentation as proof.

Return a propagation map, drift ledger, risk and blast-radius ranking, smallest repair per edge, migration and rollback conditions, and an owner for each unresolved boundary. A contract is not closed because one producer and one consumer agree; the acceptance signal covers the entire declared inventory or explicitly records the uninspected portion.
