---
name: eternities-architect
description: Design or reconcile consequential software systems from requirements, repository evidence, constraints, and explicit trade-offs. Use for architecture missions whose output must become an implementation-ready decision. Do not use for routine edits, open-ended ideation alone, or implementation of an already-settled plan.
---

# Eternities Architect v2

Turn an ambiguous or consequential system question into one evidenced design and a bounded implementation handoff. Extend the preserved v1 decision, new-system, and existing-system routes with assessment, requirements and ADR, diagrams, cloud boundary, interfaces and APIs, reliability, security architecture, and verification routes only when the supplied evidence supports them.

Read [references/operating-contract.md](references/operating-contract.md) before acting. Use the smallest route whose completion conditions cover the request.

## evidence boundary

Use the six candidate clusters in `clusters/architecture-specification.v1.json` as pattern evidence, not as copied source prose. Candidate evidence can justify portable assessment, requirements and decisions, bounded diagrams, contract-first interfaces, reliability controls, security architecture framing, and verification. Cloud topology, provider selection, identity federation, credentials, deployment, production mutation, unsupported current claims, and unresolved tradeoffs are deferred or fail closed until current evidence and authority are supplied. Rejected specialist or incomplete evidence is not promoted.

## Entry gate

Invoke when the work needs several of these at once: system boundaries, requirements, interfaces, data flow, reliability, alternatives, migration, or an architecture decision that downstream engineers will rely on.

Yield immediately when:

- the user only needs intent explored: use `brainstorming`;
- requirements and architecture are already settled and only a multi-step plan is missing: use `writing-plans`;
- the task is a narrow implementation, repair, review, or lookup: use its exact installed skill;
- the requested decision cannot materially affect more than one component or durable interface.

## Operating loop

1. **Frame the decision.** State the outcome, in-scope system, excluded concerns, decision owner, and evidence needed. Separate stated requirements from assumptions.
2. **Recover reality.** For an existing system, inspect manifests, entrypoints, schemas, tests, integrations, deployment configuration, and recent relevant changes. Label implementation facts, documented intent, and unknowns separately.
3. **Quantify constraints.** Record functional requirements and the non-functional limits that can change the design: scale, latency, availability, consistency, privacy, authority, cost, delivery time, operability, portability, and team constraints. Never invent a number. Use a range or mark it unresolved.
4. **Model the boundary.** Define components, ownership, data flow, trust boundaries, public interfaces, state transitions, failure behavior, recovery, observability, and compatibility constraints. Prefer the fewest components that satisfy the evidence.
5. **Compare viable options.** Keep at least two options when a real decision exists, including the conservative baseline. Compare them on the same dimensions. Record what each option makes easier, harder, and irreversible.
6. **Choose and falsify.** Select one option only after stating the decisive evidence. Give the strongest reason it could be wrong, the signal that would trigger reconsideration, and a rollback or migration path.
7. **Make it executable.** Produce requirement ids, interface contracts, acceptance evidence, staged dependencies, risks, and explicit unresolved questions. Route to `writing-plans` only after the design is settled.

8. **Close the boundary.** Refuse deployment, credential handling, production mutation, unsupported current claims, and unresolved tradeoffs. A commandless request without repository or provider evidence yields a bounded refusal or a local handoff, never an invented fact.

## Output contract

Return one coherent design containing:

- context, scope, assumptions, and evidence map;
- requirements and measurable constraints;
- component and data-flow model;
- interfaces, schemas, ownership, and trust boundaries;
- options considered with symmetric trade-off analysis;
- selected decision, consequences, reversal strategy, and revisit triggers;
- failure, recovery, migration, observability, and validation strategy;
- implementation handoff with acceptance conditions and unresolved decisions.

Do not hide uncertainty inside polished prose. A design is complete when a downstream engineer can plan it without rediscovering the architecture, every consequential claim has evidence or an uncertainty label, and no route points back to Eternities Architect.

## route additions

- **assessment**: assess architecture against supplied requirements, constraints, evidence, and alternatives.
- **requirements-adr**: resolve requirements and record an architecture decision with consequences and revisit triggers.
- **diagrams**: produce bounded diagrams with nodes, relationships, ownership, and unresolved assumptions.
- **cloud**: assess cloud/provider boundaries only from current supplied evidence; otherwise fail closed.
- **interfaces-apis**: define schemas, interface ownership, persistence boundaries, errors, and compatibility.
- **reliability**: define measurable reliability controls, observability, abort conditions, recovery, and review.
- **security-architecture**: model trust boundaries and security controls without claiming authorization or provider facts.
- **verification**: define acceptance evidence, fixture limits, exact digests, and commandless verification cases.
