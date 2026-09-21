# Mnemosyne method cards

## reasoned-persistent-code-dependency-graph

Bind the authorized repository scope, parser or extraction rules, source revision, graph identity, and freshness policy. Extract declared and observed edges—imports, package dependencies, generated inputs, build relations, runtime calls, data or schema references—and attach a reason and locator to each edge. Distinguish direct from inferred edges and unresolved dynamic loading.

Store nodes with stable identity, path or URI, revision, owner when known, and last observed state. Store edges with relation, source, target, reason, evidence, confidence, freshness, and invalidation trigger. Preserve absent, ambiguous, and conflicting edges rather than filling them from naming similarity. An update should be incremental and inspectable: show added, removed, changed, and stale edges.

Validate with a small fixture containing a direct edge, re-export or generated edge, optional dependency, cycle, missing target, and changed source revision. Report graph coverage and parser limits. The graph is a memory aid and dependency artifact; it does not authorize installation, migration, or deletion.
