# Release-unit manifest contract

Each included component binds an id, version, verification evidence, rollback reference, and dependency list. Release readiness requires every item to be verified and rollback-safe, with every prerequisite represented in the same manifest or an exact external evidence reference.

Missing verification, rollback, version, identity, or dependency closure keeps the local packet unready. Passing this gate does not authorize tagging, publishing, deployment, or any external effect.

The executable reference is `src/lunari-first-party-contracts.mjs`.
