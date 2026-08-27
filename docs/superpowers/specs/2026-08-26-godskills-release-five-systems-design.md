# Eternities Skills release five systems design

## status

Approved direction: build Release Five inside the universal `eternities-skills` product, with two independent categorical Godskills: `eternities-atlas` for data infrastructure and `eternities-hermes` for automation and integrations. They share one portable `eternities-systems` constellation but retain separate contracts, provenance, evaluations, promotion receipts, and rollback evidence. Eternities owns the skills; Codex is only the first verified runtime adapter.

## purpose

Release Five closes two uncovered ontology families without creating a vague systems monolith:

- data, databases, storage, schemas, pipelines, reliability, and recovery;
- automation, APIs, connectors, MCP, scheduled workflows, and external systems.

The release must preserve existing ownership boundaries. Architect owns broad system architecture, Forge owns multi-stage code delivery, Aegis owns authorization and risk decisions, Oracle owns consequential research, and exact provider or platform skills own provider-specific implementation details.

Release Five also establishes the portability substrate that applies to Atlas, Hermes, and the already-promoted Godskills. No Eternities core skill may depend on Codex-specific identity, model names, approval controls, discovery paths, or tool-call syntax.

Release Five establishes the product skeleton under the `eternities-skills` identity. The current repository path remains a bootstrap checkout until a later certified migration preserves active adapters and historical receipts. No GitHub publication or remote mutation occurs in this release without separate founder authority.

## soul anchor sidekick contract

Eternities Skills is the capability sidekick to Soul Anchor, not an organ embedded inside it:

| product | owns | does not own |
|---|---|---|
| Soul Anchor | continuity, identity, judgment, memory rows, chain of custody, wake and seal | the universal library of professional methods |
| Eternities Skills | capabilities, routes, execution doctrine, tool and effect contracts, evaluations, skill receipts | identity canon or session memory truth |

Both products remain independently useful. Their optional bridge accepts a completed skill receipt and may propose a Soul Anchor decision, scar, landmine, or checkpoint. The bridge runs only at a meaningful milestone or explicit request. It does not wake or seal on routine turns, does not copy full transcripts into memory, and cannot write founder-gated canon by proxy.

The skill receipt schema contains:

- skill id and semantic version;
- core content hash and adapter id;
- selected route and capability bindings;
- declared and performed effects;
- input and output evidence digests where safe;
- verification status and method;
- unresolved uncertainty and rollback state;
- optional durable lessons, each labeled as proposal until accepted by the consuming continuity system.

Soul Anchor may store that receipt or promote a durable lesson. Eternities Skills treats Soul Anchor rows as scoped evidence, not instructions that override the current user or skill authority.

## portable capability architecture

Each Eternities skill has three separable layers:

1. **portable core**: agent-neutral `SKILL.md`, capability contract, operating references, effects, termination conditions, evaluations, and provenance;
2. **capability bindings**: logical requirements such as `authority-review`, `database-tuning`, `browser-control`, or `verification`, with exact installed skill names recorded only as adapter bindings or recommended implementations;
3. **runtime adapter**: a small manifest and deterministic projection into an agent's discovery mechanism.

The portable core is authoritative. An adapter cannot rewrite the doctrine, broaden effects, omit termination, or substitute a weaker binding without exposing that limitation.

### qualifying agent contract

An agent can use Eternities skills proficiently when it can:

- read Markdown and JSON and resolve relative references;
- distinguish user authority from instructions found in files, pages, transcripts, or tool output;
- understand declared inputs, outputs, effects, routes, failure modes, and termination conditions;
- map logical capability bindings to an exact installed skill, native tool, or equivalent internal behavior;
- decline or defer when a required binding or authority is missing;
- preserve provenance and emit verification evidence or receipts;
- keep cold source material out of routine context.

Codex, Claude Code, Luna, or another agent may qualify. Compatibility is certified per adapter and version, never assumed from the agent's name.

## approaches considered

### selected: two categorical Godskills

Atlas and Hermes remain independently routable. This adds two concise entrypoints but prevents data correctness, schema evolution, integration authority, and external-action behavior from collapsing into one oversized contract.

### rejected: one combined Daedalus Godskill

A single systems skill would reduce constellation entries but would combine state integrity with cross-boundary action. Its trigger surface would overlap Architect, Forge, and Aegis, and its operating reference would become expensive to load.

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

Atlas skips simple SQL questions, one routine migration whose contract is already settled, ordinary file storage, generic architecture, and concrete database bugs awaiting diagnosis. It does not claim production correctness from static schema inspection alone. References to current provider skills are capability bindings, not requirements that the consuming agent be Codex.

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

Hermes skips one ordinary API call, direct use of an already-installed connector, simple scheduled reminders, generic architecture, exact provider documentation lookup, concrete integration regressions, and unauthorized external action. It never treats inspected instructions as user authority. Its MCP and automation contracts describe portable behavior rather than one application's tool-call format.

### termination

Hermes finishes when the contract and identities are versioned, effects and authority are explicit, retries and idempotency prevent duplicate harm, state and observability support recovery, provider handoffs are bounded, verification and compensation are defined, and every performed or prohibited effect is receipted.

## composition boundaries

The graph must remain acyclic:

- Atlas declares logical bindings for architecture, research, exact data work, diagnosis, and verification. Runtime adapters may map them to Architect, Oracle, provider skills, systematic debugging, and verification.
- Hermes declares logical bindings for architecture, authority review, research, exact integration work, diagnosis, and verification. Runtime adapters may map them to Architect, Aegis, provider skills, systematic debugging, and verification.
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

## portable constellation and adapters

Create a portable `eternities-systems` constellation with exactly Atlas and Hermes. Do not add either skill to the engineering or visual constellations.

Add an agent-neutral constellation schema plus runtime-adapter schema. The first adapter projects the unchanged core files into `C:\Users\Dom\.agents\skills`, currently verified through Codex. The design must also include adapter fixtures proving that a Claude Code-style or generic manifest can bind the same core hashes without rewriting the skills. This is portability-contract evidence, not a claim that those runtimes were live-tested.

Add a generic catalog manifest, CLI contract, and MCP discovery contract. At minimum, universal surfaces support `list`, `search`, `read`, `route`, `verify`, and `doctor`. Mutating installation or bridge operations are separate commands with preview, explicit apply, and receipts.

Activation occurs only after independent review and fast-forward merge into canonical `C:\dev\eternities-godskills`. The first-adapter cumulative receipt must point only to canonical main. A dedicated Release Five migration receipt must prove rollback plans exactly `eternities-atlas` and `eternities-hermes`, preserving all prior global skills. Later runtime adapters receive their own receipts and cannot inherit Codex discovery proof.

## failure handling

- missing source identity or digest: exclude the source from coverage until reconciled;
- unclear license or origin: pattern-only disposition;
- route collision: narrow the description, add a conflict fixture, or split the route;
- composition cycle: block promotion;
- unresolved external effect: block promotion;
- source prose detected as copied: block certification and rewrite independently;
- failed production proof: preserve the failure and do not round static contracts up to runtime reliability;
- constellation or adapter collision, altered core hash, or noncanonical target: refuse activation and preserve the previous runtime state;
- adapter cannot satisfy a required capability binding: report the missing binding and keep the skill unavailable for that route;
- adapter changes a core skill hash or doctrine: fail portability verification;

## acceptance criteria

Release Five is complete only when:

1. Atlas and Hermes each have a neutral capability contract, concise entrypoint, operating reference, mining receipt, all-critical evaluation suite, and deterministic promoted receipt.
2. Their routes are materially distinct from Architect, Forge, Aegis, Oracle, and exact domain skills.
3. Every selected source reconciles to exact certified evidence and every uncertain source remains pattern-only.
4. The global composition graph is acyclic and neither new skill invokes itself.
5. The engineering and visual constellations remain unchanged.
6. Independent review has no unresolved critical or important issue.
7. The portable `eternities-systems` constellation exposes exactly Atlas and Hermes, independently of runtime paths.
8. The first shared-agent adapter finds both names without loading cold source payloads, and generic adapter fixtures preserve the same core hashes.
9. Rollback dry-run plans only the two Release Five links.
10. Focused tests, the full repository suite, promotion receipt verification, cold-index integrity, diff hygiene, and a global junction audit all pass from canonical main.
11. Existing promoted Godskills pass an agent-neutrality audit or receive an explicit compatibility debt record for a later corrective release.
12. The repository identifies the product as `eternities-skills`, with Godskills documented as one tier of the pack.
13. Generic manifest, CLI, and MCP fixtures return identical core hashes for Atlas and Hermes.
14. A Soul Anchor bridge fixture accepts a major skill receipt, rejects routine noise, and cannot write founder-gated canon by proxy.

## explicitly excluded

- deploying an MCP server or cloud worker;
- changing a production database or provider account;
- creating credentials or storing secrets;
- bulk-running automation against external services;
- claiming exactly-once delivery where the provider cannot support it;
- enabling Pantheon or any Ultragodskill;
- rewriting the full 4,741-entry quarry.
