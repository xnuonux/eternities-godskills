# typed composition v1 implementation plan

1. pin canonical Godskills main, the capability-layer ABI receipt, and the
   adaptive-activation executable receipt. preserve their exact bytes.
2. add the canonical composition policy and closed portable schemas for plans,
   compiled methods, and execution receipts.
3. write failing tests for canonical policy and registry loading, provenance,
   path and digest containment, and zero method or reviewer body reads.
4. implement the trusted metadata loader for the three certified capability
   canaries.
5. write failing compiler tests for the positive Muse-to-Forge graph and the
   complete rejection matrix: compatibility, duplicate phase ownership,
   missing inputs, duplicate producers, type and kind mismatch, cycles,
   effects, authority, activation identity, and context.
6. implement exact plan validation, activation binding, typed graph analysis,
   deterministic topological ordering, phase ownership, compatibility checks,
   effect, authority, and precondition intersection, terminal-output
   enforcement, and conservative context estimation.
7. emit one body-free compiled mission method with exact layer references and a
   canonical digest. enforce the compiled-method byte ceiling after assembly.
8. write failing execution tests for exact handoff, missing executors, changed
   method identity, malformed mission values, malformed node output, and
   undeclared outputs.
9. implement the in-memory provider-neutral reference runner and digest-bound
   execution receipt.
10. build the real pinned activation result and deterministic Muse-to-Forge
    canary evidence. emit registry, vocabulary, compatibility, plan, method,
    execution, conflict, and budget artifacts twice and require byte identity.
11. run focused parent compatibility tests, inline adversarial source review,
    the full repository suite, and exact source-manifest reconstruction.
12. issue one append-only typed-composition receipt and certification document,
    rerun release integrity, merge by fast-forward, push canonical main, and
    remove only the verified feature worktree.
13. begin a separate Godagents consumer milestone only after the Godskills
    trust root is frozen. no Godagents adapter may infer fields or refresh this
    trust root implicitly.

## stop conditions

- any parent trust-root or certified canary byte changes;
- any requirement to concatenate selected bodies;
- any inferred type conversion or phase ownership;
- any authority or effect not already present in both plan and activation;
- any generated output that cannot reproduce byte-for-byte;
- any unresolved critical defect.
