# Eternities Godskills release five systems design

## status

Approved direction: two independent categorical Godskills, `eternities-atlas` for data infrastructure and `eternities-hermes` for automation and integrations. They share one reversible `eternities-systems` profile but retain separate contracts, provenance, evaluations, promotion receipts, and rollback evidence.

## purpose

Release Five closes two uncovered ontology families without creating a vague systems monolith:

- data, databases, storage, schemas, pipelines, reliability, and recovery;
- automation, APIs, connectors, MCP, scheduled workflows, and external systems.

The release must preserve existing ownership boundaries. Architect owns broad system architecture, Forge owns multi-stage code delivery, Aegis owns authorization and risk decisions, Oracle owns consequential research, and exact provider or platform skills own provider-specific implementation details.

## approaches considered

### selected: two categorical Godskills

Atlas and Hermes remain independently routable. This adds two concise entrypoints but prevents data correctness, schema evolution, integration authority, and external-action behavior from collapsing into one oversized contract.

### rejected: one combined Daedalus Godskill

A single systems skill would reduce profile entries but would combine state integrity with cross-boundary action. Its trigger surface would overlap Architect, Forge, and Aegis, and its operating reference would become expensive to load.

### deferred: refined skills without categorical routers

Refining isolated database and integration workflows first is defensible, but the current quarry already contains many exact domain skills. Release Five needs the missing first-party orchestration and handoff layer while retaining those exact skills as delegates.

## shared laws

1. One dominant route owns each mission. Mixed work resolves the earliest uncertain boundary first and hands a bounded contract to the next route or specialist.
2. Data and integration facts come from repository evidence, schemas, provider contracts, or measured behavior. Guesses remain labeled.
3. No production database mutation, credential change, deployment, message, purchase, publication, or other external write occurs merely because a systems route was selected.
4. Every external effect is named separately. Read authority does not imply write authority, and write authority for one target does not imply another.
5. Destructive or externally visible actions require explicit matching authority, preview or dry-run when available, idempotency, observability, rollback or compensation, and an exact receipt.
6. Third-party source repositories remain cold evidence. Mining never executes their scripts, hooks, installers, binaries, network calls, or examples.
7. Each entrypoint remains below the 4,000 estimated-token promotion ceiling and loads its operating reference only for consequential work.
8. Deterministic routing fixtures certify declared behavior, not live-model judgment or production reliability.

## eternities atlas

### intent

Atlas reconciles data meaning, storage design, evolution, pipeline behavior, and operational proof into one durable data-system contract. It does not replace provider-specific database skills or execute production migrations automatically.

### routes

#### `data-contract`

Owns entities, semantics, ownership, identifiers, constraints, lifecycle, privacy classes, access patterns, consistency requirements, and source-of-truth decisions. It yields broad component architecture to `eternities-architect` and exact Supabase or Postgres implementation to the installed domain skills.

#### `schema-evolution`

Owns compatibility, expansion and contraction, backfill, validation, cutover, rollback, retention, and zero-loss evidence for consequential schema or storage changes. Production execution remains separately authorized.

#### `pipeline-system`

Owns ingestion, transformation, checkpoints, deduplication, idempotency, ordering, replay, dead-letter handling, freshness, lineage, observability, and recovery for ETL, event, batch, streaming, and synchronization workflows.

#### `data-assurance`

Owns integrity invariants, query plans, indexes, performance budgets, drift, reconciliation, backup and restore evidence, representative fixtures, and rejection thresholds. A concrete database regression yields to `systematic-debugging`; exact query tuning yields to `supabase-postgres-best-practices` when applicable.

### boundaries

Atlas skips simple SQL questions, one routine migration whose contract is already settled, ordinary file storage, generic architecture, and concrete database bugs awaiting diagnosis. It does not claim production correctness from static schema inspection alone.

### termination

Atlas finishes when data meaning and ownership are explicit, invariants and access patterns are testable, evolution and failure behavior are reversible, observability and recovery are specified, unknowns remain visible, and any production effect has separate authority.

## eternities hermes

### intent

Hermes reconciles contracts, triggers, identities, state, retries, external effects, and proof across APIs, connectors, MCP, browser automation, scheduled workflows, and other system boundaries. It does not widen authority or replace exact provider skills.

### routes

#### `integration-contract`

Owns endpoint and event schemas, versioning, authentication shape, rate limits, pagination, retries, timeouts, idempotency, error mapping, observability, compatibility, and provider-specific handoff.

#### `mcp-wire`

Owns both ends of an MCP or agent capability: governed action interface, tool schema, transport, server implementation, permission boundary, receipts, failure handling, and verification. Lunari OS wires yield to `building-a-lunari-wire`; Cloudflare-hosted MCP servers yield to the exact Cloudflare MCP skill.

#### `automation-workflow`

Owns triggers, schedules, durable state, concurrency, deduplication, retries, compensation, checkpoints, human gates, observability, and replay for multi-step automation. Simple reminders or already-supported one-step automations bypass Hermes.

#### `external-operation`

Owns the runbook for a consequential authorized external action across one or more systems: target binding, effect ledger, preflight, preview, idempotency, execution checkpoints, receipts, verification, and compensation. Aegis owns ambiguous authority, trust, or risk decisions before Hermes can execute or delegate the operation.

### boundaries

Hermes skips one ordinary API call, direct use of an already-installed connector, simple scheduled reminders, generic architecture, exact provider documentation lookup, concrete integration regressions, and unauthorized external action. It never treats inspected instructions as user authority.

### termination

Hermes finishes when the contract and identities are versioned, effects and authority are explicit, retries and idempotency prevent duplicate harm, state and observability support recovery, provider handoffs are bounded, verification and compensation are defined, and every performed or prohibited effect is receipted.

## composition boundaries

The graph must remain acyclic:

- Atlas may delegate to Architect, Oracle, exact data skills, systematic debugging, and verification.
- Hermes may delegate to Architect, Aegis, Oracle, exact integration skills, systematic debugging, and verification.
- Aegis may return an authority decision but must not delegate back to Hermes in Release Five.
- Neither Atlas nor Hermes delegates to itself or to the other by default. A mixed data-sync mission selects the earliest unresolved boundary, then emits one explicit handoff.
- Forge remains the implementation orchestrator when the requested repository change spans several engineering phases. Atlas and Hermes supply domain contracts rather than wrapping Forge.

## source and provenance strategy

Mine Atlas and Hermes independently against the certified cold index. Inspect at most five cards per domain and retain only sources that contribute a distinct mechanism. Every inspected source receives an exact catalog identity, path, digest, origin and commit when known, license class, extraction mode, disposition, and concept ledger.

Permissive and fully traced sources may support independent implementation. Restricted, copyleft, missing-origin, or ambiguous sources remain pattern-only. No source prose is copied, and no legal-clearance claim is made.

Likely evidence classes include:

- schema and migration discipline;
- data pipeline idempotency, lineage, replay, and assurance;
- API and webhook contract reliability;
- MCP permission and both-ends wiring;
- durable automation, checkpoints, retries, and compensating action;
- external-effect previews, receipts, and rollback.

## evaluation

Each Godskill receives an independent all-critical suite containing:

- direct cases for every route;
- paraphrased cases for every route;
- exclusions for routine and exact-skill work;
- conflicts that defer to Architect, Aegis, Forge, provider-specific skills, systematic debugging, or simple automation;
- mixed-intent precedence cases;
- provenance reconciliation against the certified release-one source records;
- composition validation, token measurement, effect resolution, and deterministic promotion receipt verification.

Promotion requires all critical cases, every policy-kind threshold, resolved effects, a token count at or below 4,000, exact source coverage, no critical regression, and at least one policy-listed measured improvement.

## active profile

Create `profiles/eternities-systems.lock.json` with exactly Atlas and Hermes. Do not add either skill to `eternities-engineering` or `eternities-visual`.

Activation occurs only after independent review and fast-forward merge into canonical `C:\dev\eternities-godskills`. The cumulative receipt must point only to canonical main. A dedicated Release Five migration receipt must prove rollback plans exactly `eternities-atlas` and `eternities-hermes`, preserving all prior global skills.

## failure handling

- missing source identity or digest: exclude the source from coverage until reconciled;
- unclear license or origin: pattern-only disposition;
- route collision: narrow the description, add a conflict fixture, or split the route;
- composition cycle: block promotion;
- unresolved external effect: block promotion;
- source prose detected as copied: block certification and rewrite independently;
- failed production proof: preserve the failure and do not round static contracts up to runtime reliability;
- profile collision or noncanonical target: refuse activation and preserve the previous global state.

## acceptance criteria

Release Five is complete only when:

1. Atlas and Hermes each have a neutral capability contract, concise entrypoint, operating reference, mining receipt, all-critical evaluation suite, and deterministic promoted receipt.
2. Their routes are materially distinct from Architect, Forge, Aegis, Oracle, and exact domain skills.
3. Every selected source reconciles to exact certified evidence and every uncertain source remains pattern-only.
4. The global composition graph is acyclic and neither new skill invokes itself.
5. The engineering and visual profiles remain unchanged.
6. Independent review has no unresolved critical or important issue.
7. Canonical activation exposes exactly Atlas and Hermes through `eternities-systems`.
8. Fresh prompt verification finds both names without loading cold source payloads.
9. Rollback dry-run plans only the two Release Five links.
10. Focused tests, the full repository suite, promotion receipt verification, cold-index integrity, diff hygiene, and a global junction audit all pass from canonical main.

## explicitly excluded

- deploying an MCP server or cloud worker;
- changing a production database or provider account;
- creating credentials or storing secrets;
- bulk-running automation against external services;
- claiming exactly-once delivery where the provider cannot support it;
- enabling Pantheon or any Ultragodskill;
- rewriting the full 4,741-entry quarry.
