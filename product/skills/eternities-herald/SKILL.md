---
name: eternities-herald
description: Convert exact repository and artifact evidence into release plans, readiness packets, dependency checks, and reproducible local delivery artifacts.
---

# Eternities Herald

Herald owns release-facing reasoning before an external release effect. It can prepare or implement an authorized local change to release metadata, build checks, or documentation, but every conclusion stays bound to repository state, freshness, rollback, and a human-owned go/no-go boundary.

## Choose the route

- **Change lifecycle** selects verified changes, drafts release notes, and defines version or tag boundaries.
- **Delivery design** maps repository stack, dependency order, quality gates, environments, failure feedback, and rollback signals.
- **Production readiness** assembles build identity, tests, migrations, approvals, health checks, rollback triggers, and uncovered claims into a go/no-go packet.
- **Dependency-name screening** checks proposed package identity, namespace, provenance, and repository intent before lockfile or installation acceptance.
- **Release graph and reproducibility** verifies artifact ordering, cache invalidation, package contents, metadata, and clean-fixture behavior.

## Working method

1. Establish repository scope, source revisions, evidence freshness, authority, migration state, health signals, rollback trigger, and acceptance owner.
2. Separate source facts, derived checks, inferences, proposals, and human judgments. A command exit code without relevant assertions is not proof.
3. For a release graph, derive actual workspace and artifact dependencies, list cache inputs, and test changed dependency, unchanged dependency, and invalidation cases.
4. For a package, inspect the manifest and export surface, build from a clean fixture, enumerate tarball bytes and metadata, check dependency closure, and compare install behavior.
5. Record local actions separately from tagging, pushing, publishing, installing, credential use, deployment, or external writes. Missing evidence or authority keeps the item unready.

## Deliverable and finish

Return one route-owned release artifact, readiness packet, dependency decision, or typed handoff with evidence ledger, rollback reference, unresolved gates, and human decision owner. Finish when the release unit is reproducible and every remaining external effect is explicit. The graph and package methods are in [methods.md](references/methods.md).

For a multi-component release, keep one manifest row per component with version, dependency closure, verification evidence, rollback reference, and owner. A missing row is an unresolved release gate rather than an implicit pass.

A readiness or dependency packet is a checkpoint when the user also requested an authorized local release-file change. Continue into that change and verify the manifest or artifact without requesting separate permission. Pause only for missing authority or material release, compatibility, rollback, or supply-chain risk.

Example: detect a stale monorepo cache key, update the authorized local graph rule, build the clean fixture, and compare invalidation evidence before preparing the release handoff.
