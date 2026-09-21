# Herald method cards

## monorepo-release-graph-cache-correctness

Derive the workspace graph from actual manifests, build scripts, generated artifacts, and release contracts. For each output, record source inputs, transitive dependencies, environment or toolchain inputs, cache key fields, invalidation rule, release order, and failure owner. Exercise unchanged dependency, changed direct dependency, changed transitive dependency, generated-file change, and cache miss cases. Compare artifact hashes and dependency order, not just task completion.

## node-package-release-reproducibility

Freeze package source, manifest, export map, build command, runtime, dependency mode, and clean fixture. Build twice when determinism is claimed; enumerate tarball paths, bytes, metadata, bundled and omitted dependencies, entrypoint behavior, and install or import behavior in the fixture. Record timestamps or generated fields that prevent byte identity and state whether they are intentional. The receipt proves the declared fixture and package surface; it does not prove publication or every consumer environment.
