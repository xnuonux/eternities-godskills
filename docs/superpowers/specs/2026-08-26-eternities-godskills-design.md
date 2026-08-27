# eternities skills ... universal agent capability architecture

date: 2026-08-26

status: approved architecture, awaiting implementation-plan review

owner: eternities inc.

## product identity

`eternities-skills` is the universal professional skill pack of Eternities Inc. It is built for any coding agent or general agent that can satisfy the portable agent contract. Godskills and Ultragodskills are capability tiers inside the pack, not the name or limit of the product.

The public repository identity is `eternities-skills`. The current `C:\dev\eternities-godskills` checkout is the bootstrap implementation and remains in place until a receipted local-path and adapter migration can preserve every active link. Repository publication is a separate founder-authorized action.

The product promise is measurable rather than promotional: every released capability is independently authored, provenance-backed, bounded by effects and termination, evaluated against relevant baselines, portable across conforming agents, and accompanied by reproducible receipts. “Superior” means it clears those gates and records the evidence, not that the word appears in its name.

## purpose

build a first-party universal agent capability system from the local repository and skill quarry without weakening strong source behavior, copying vendor identity into the operating layer, or loading thousands of competing descriptions into every agent context.

the program turns a large evidence corpus into a smaller and stronger hierarchy:

1. source evidence
2. capability contracts
3. sovereign skill atoms
4. refined operational skills
5. categorical godskills
6. cross-category ultragodskills
7. one explicit-only pantheon composer

the final number of artifacts is determined by capability evidence and evaluation results, not by a quota. a plausible shape is 500 to 1,500 atoms, 200 to 800 refined skills, 50 to 200 godskills, and 12 to 40 ultragodskills.

## non-negotiable laws

1. sovereignty is substantive ownership, not cosmetic renaming.
2. a promoted artifact must equal or exceed the useful behavior of its selected baselines.
3. no source skill, repository, script, hook, binary, or installer is trusted merely because it is indexed or popular.
4. source evidence remains cold. only the smallest relevant active constellation reaches an agent context through its runtime adapter.
5. source identity, license evidence, commits, and evaluation receipts remain in the private provenance ledger, outside ordinary operational prompts.
6. actual adapted expression retains any required notices. restricted or unclear material is behavior-only evidence unless compatibility is established.
7. a clean-room-style synthesis stage receives neutral capability contracts and tests, not source prose.
8. no godskill is always-on merely because it is powerful.
9. `eternities-pantheon` is explicit-only and cannot invoke itself recursively.
10. no source is deleted after synthesis. replacement requires a verified receipt and remains reversible.

## canonical locations

| artifact | canonical location | role |
|---|---|---|
| bootstrap source | `C:\dev\eternities-godskills` | current implementation until the path migration is certified |
| canonical product identity | `eternities-skills` | universal repository, package, CLI, MCP, and distribution name |
| repository quarry | `D:\03-ARSENAL\warehouse` | canonical third-party and first-party repository evidence |
| cold source index | `C:\Users\Dom\.codex\skills\arsenal-repo-miner\references` | certified lexical and optional hybrid discovery of source candidates |
| current shared-agent adapter | `C:\Users\Dom\.agents\skills` | one runtime projection of concise proven Eternities capabilities |
| project adapter target | `<project>\<agent-discovery-root>` | runtime-selected Godskills relevant to one repository or agent |

the Eternities Skills repository is not a second repository warehouse. it stores only first-party contracts, implementations, tests, receipts, adapters, and minimal required notices.

## agent-neutral identity and runtime adapters

Eternities owns the skills. Codex, Claude Code, Luna, and future compatible agents are consumers, not the identity or canonical format of the capability.

Every promoted artifact has three layers:

1. **portable core** ... `SKILL.md`, neutral capability contract, operating references, evaluation cases, effects, termination, and provenance. Core behavior cannot depend on one vendor, model, application, approval UI, or discovery directory.
2. **capability bindings** ... logical delegate requirements such as authority review, database tuning, browser control, or verification. A runtime may bind those requirements to an exact installed skill or provide equivalent native behavior.
3. **runtime adapter** ... the smallest deterministic projection needed for one agent to discover and invoke the portable core. Adapter receipts record destination, link or copy method, prompt or catalog discovery evidence, supported effects, and any missing bindings.

A compatible agent must be able to read Markdown and JSON, resolve relative references, distinguish instructions from inspected data, honor declared effects and authority, map or decline required capability bindings, preserve termination conditions, and expose verification evidence. An agent that cannot satisfy a required binding fails clearly instead of silently weakening the skill.

The initial `C:\Users\Dom\.agents\skills` projection is a shared-agent filesystem adapter currently verified through Codex. That verification proves one consumer can discover the artifacts; it does not make the artifacts Codex-specific or prove compatibility with every agent.

Constellation manifests select portable skills. Runtime-specific activation manifests project a constellation into Codex, Claude Code, Luna, or another compatible environment. Core skill hashes remain identical across adapters.

## agent-native invocation and deterministic intent routing

The canonical interface is an ordinary user request describing an outcome. A
user does not need to know that a skill exists, remember its name, or type a
slash command. The consuming agent owns capability selection.

Slash commands, command names, and exact trigger phrases found in source skills
are historical interface evidence only. The refinery may retain them as
`legacyAliases` for compatibility and evaluation, but they are never required
for discovery, routing, or successful execution. Source command syntax is
translated into neutral intent, inputs, operations, outputs, effects,
exclusions, and failure behavior before synthesis.

Every routable capability exposes a compact machine-readable card and a deeper
capability contract. Together they declare:

- intended outcomes and success conditions;
- direct, paraphrased, and contextual intent examples;
- negative triggers and task boundaries;
- required and provided capabilities;
- effects, risk class, authority requirements, and preconditions;
- compatible compositions, conflicts, and delegation boundaries;
- evidence confidence, context cost, and dependency cost;
- termination conditions and recovery behavior;
- optional legacy aliases that carry no routing authority.

The universal router follows one deterministic progression:

1. derive a request envelope containing the desired outcome, artifacts,
   constraints, required effects, available authority, and uncertainty;
2. retrieve a small candidate set from cold capability cards without loading
   source bodies or full skill instructions;
3. reject candidates whose exclusions, effects, authority, preconditions, or
   portability requirements conflict with the request;
4. prefer complete requirement coverage, narrower intent fit, lower effects,
   lower context and dependency cost, stronger evidence, and then stable id as
   the final tie-breaker;
5. select one smallest sufficient skill when possible, or the smallest
   non-recursive compatible composition when no single skill covers the
   mission;
6. load only the selected entrypoints and only the route-specific references
   they require;
7. emit a compact route receipt recording request features, candidates,
   exclusions, selection, composition, confidence, and unresolved uncertainty.

Automatic skill selection does not imply unlimited authority. A high-confidence
reversible match may run without asking the user to operate the router. A
material ambiguity involving outcomes, permissions, irreversible effects, or
external consequences asks about that missing decision, not which skill name to
choose. If no candidate qualifies, the agent may use its native reasoning
within its normal authority and record a catalog gap instead of forcing an
unfitted skill.

Routing policy belongs to the portable core. Runtime adapters translate request
and tool surfaces into the neutral request envelope, but they may not silently
change selection order, permission boundaries, or termination conditions.

## relationship to soul anchor

Soul Anchor and Eternities Skills are complementary Eternities products:

- **Soul Anchor** preserves continuity, identity, judgment, provenance, and what an agent has earned across session boundaries.
- **Eternities Skills** provides portable professional capability, routing, execution doctrine, verification, and bounded ways to act.

Soul Anchor is the continuity substrate. Eternities Skills is the capability substrate. Neither owns or embeds the other, and each works independently.

Their optional bridge follows four laws:

1. wake occurs once at a real session or continuity boundary, not on every skill invocation;
2. a skill may emit a structured receipt containing skill id, version, route, effects, evidence, outcome, uncertainty, and durable lessons;
3. only meaningful decisions, recurring failures, confirmed hazards, or major checkpoint state are eligible for Soul Anchor rows;
4. Eternities Skills never writes identity canon or founder-gated rows by implication. The consuming agent or authorized bridge performs that explicit action.

The bridge is additive. An agent without Soul Anchor can still discover, route, invoke, and verify every compatible skill. An agent with Soul Anchor can preserve earned skill outcomes without replaying transcripts or bloating active context.

## universal distribution surfaces

The product ships the same portable cores through several surfaces:

- repository: human-readable source, contracts, Godspec, schemas, tests, and receipts;
- filesystem pack: standard skill directories for agents that discover `SKILL.md`;
- CLI: list, search, inspect, route, verify, doctor, install, and adapter commands;
- MCP: read-only discovery and routing tools, plus explicitly authorized receipt and bridge operations;
- runtime adapters: deterministic projections for Codex, Claude Code, Luna, Cursor-class agents, and generic filesystem hosts;
- generic manifest: a machine-readable catalog for any agent able to read Markdown and JSON without a native adapter.

The CLI and MCP are transport surfaces, not alternative doctrines. They return the same core hashes and contracts as the repository.

## repository ingestion boundary

the github account contained twelve stars after the last known warehouse sync at `2026-08-23T10:40:01Z`.

already represented and not cloned again:

- `microsoft/markitdown`
- `Leonxlnx/taste-skill`

missing and approved for collision-safe shallow ingestion under `D:\03-ARSENAL\warehouse\from-stars\<owner>__<repo>`:

- `framepipe-dev/media-inference-worker`
- `github/github-mcp-server`
- `heygen-com/hyperframes`
- `charlie947/social-media-skills`
- `blader/humanizer`
- `zarazhangrui/frontend-slides`
- `microsoft/playwright-mcp`
- `nextlevelbuilder/ui-ux-pro-max-skill`
- `RongleCat/awesome-grok-bot`
- `graphdeco-inria/gaussian-splatting`

every clone must record the exact remote, head commit, default branch, repository size, archive state, detected license files, and clone result. exact origin identity wins over folder-name similarity. a failed or empty repository remains an explicit receipt row rather than being silently omitted.

## capability ontology

every source candidate is normalized into a capability contract with these fields:

- stable capability id
- category and subcategory
- intent and success condition
- accepted inputs
- produced outputs
- required operations
- tool and permission boundaries
- local-read, local-write, external-read, and external-write effects
- preconditions and dependencies
- failure modes and recovery behavior
- positive triggers
- negative triggers and exclusions
- baseline evaluation cases
- security, privacy, performance, and token risks
- source evidence references
- extraction mode: dependency, adapted expression, independent implementation, pattern only, or rejected

contracts describe behavior. they do not copy source voice, examples, branding, or prose.

## deduplication and clustering

deduplication proceeds in four passes:

1. exact identity ... matching repository, source path, and content digest
2. declared identity ... normalized skill name, aliases, and upstream origin
3. behavioral equivalence ... matching input, operation, output, and failure contract
4. semantic neighborhood ... local embeddings suggest candidates for human or deterministic contract comparison

semantic similarity never merges skills by itself. two similarly worded skills remain separate when permissions, failure semantics, outputs, or quality bars differ.

overlapping contracts become one of:

- canonical atom with aliases
- canonical atom plus specialized variants
- mutually exclusive alternatives
- ordered composition
- rejected duplicate

## hierarchy

### skill atom

a narrow reusable mechanism with one principal operation. atoms are normally cold and are not installed directly unless they are broadly useful and have precise triggers.

### refined skill

a complete first-party workflow for a recurring task. a refined skill may combine several atoms but must retain one clear purpose, one primary success condition, and bounded effects.

### godskill

a categorical superskill that routes and composes refined skills across an end-to-end domain workflow. it owns orchestration and handoff logic but delegates specialized work to smaller artifacts.

### ultragodskill

a cross-category mission system used when several godskills must cooperate. it must state activation cost, context budget, dependencies, and termination conditions.

### pantheon

`eternities-pantheon` selects the smallest compatible godskill set for a genuinely cross-domain mission. it is explicit-only, never used for routine turns, and cannot force invocation before every response.

## initial godskill families

the first ontology seeds are:

- architecture and specification
- implementation and engineering
- debugging and recovery
- verification and evidence
- repository and source research
- knowledge, memory, and context
- agent orchestration and delegation
- governance, permissions, and security
- data, databases, and infrastructure
- web, interface, and accessibility
- visual design, shaders, 3d, and motion
- writing, narrative, canon, and documentation
- audio, voice, music, and media
- automation, integration, mcp, and external systems
- release, deployment, presentation, and publishing
- product, operations, finance, and organizational intelligence

initial cross-family artifacts:

- `eternities-architect`
- `eternities-forge`
- `eternities-oracle`
- `eternities-aegis`
- `eternities-mnemosyne`
- `eternities-muse`
- `eternities-herald`
- `eternities-pantheon`

these names are ontology seeds, not guaranteed promotions. each must pass the same evidence gates as every other artifact.

## active and cold layers

the full sovereign catalog remains searchable but cold.

an active constellation contains only concise descriptions and paths for capabilities relevant to its scope:

- global core ... a very small set that is broadly useful across repositories
- eternities engineering ... architecture, forge, oracle, aegis, verification, and continuity
- visual systems ... muse, frontend, shader, 3d, motion, and accessibility capabilities
- research systems ... oracle, citation, corpus, retrieval, and synthesis capabilities
- project-local constellations ... capabilities selected for one repository or product

constellations are generated from a portable lock manifest. activation uses a runtime adapter to link or deterministically copy identical core artifacts into that agent's supported discovery location. changes are previewed, collision-checked, reversible, and verified through that runtime's fresh discovery surface. one adapter's receipt cannot certify another agent.

The root pack stays cold. An agent receives an index of concise capability cards, then loads only the selected skill entrypoint and only the references required by the chosen route. This progressive-disclosure contract is universal and does not depend on a particular model's context window.

Agents initially load only a compact family map and router contract. Family
cards expose enough information to shortlist capabilities but never contain full
operating doctrine. Full catalog search remains available on demand, and full
skill bodies remain addressable by stable id. This makes a catalog containing
thousands of capabilities usable without placing thousands of descriptions in
the prompt.

## synthesis pipeline

1. inventory and certify the source corpus.
2. parse skill metadata and identify executable or referenced resources.
3. translate source commands and trigger syntax into neutral intent evidence,
   then create command-independent capability contracts.
4. deduplicate exact and behavioral equivalents.
5. cluster related contracts into ontology families.
6. select baselines using fit, completeness, evidence, security, dependencies, and maintenance state.
7. produce an independent first-party implementation from contracts and tests.
8. run source-baseline and sovereign-candidate evaluations.
9. refine until the candidate meets the promotion gate.
10. record provenance, disposition, test results, and remaining uncertainty.
11. promote into the cold sovereign registry.
12. activate globally or per project only when its triggers and scope justify prompt residency.

## superiority gate

a candidate cannot be called refined, godskill, or ultragodskill unless:

- all critical baseline behaviors are represented or explicitly rejected with rationale
- no critical baseline evaluation regresses
- at least one relevant quality dimension improves
- direct-trigger recall passes
- paraphrased-trigger recall passes
- negative-trigger exclusion passes
- sibling-skill conflict tests pass
- instructions contain no unresolved source identity or platform assumptions
- tools and side effects are correctly declared
- token and context cost remain within the artifact's stated budget
- executable resources have focused tests
- source and license disposition is recorded
- rollback is defined

where a baseline cannot be executed or verified, the candidate remains `unverified` and cannot claim superiority.

quality dimensions include task success, correctness, coverage, precision, recovery, security, interoperability, dependency weight, latency, token cost, and clarity.

Cross-agent portability is itself a quality dimension. A candidate regresses if it requires one vendor's hidden prompt behavior, approval UI, tool syntax, or model name without isolating that assumption in an adapter.

## evaluation system

each artifact receives:

- schema validation
- positive trigger cases
- paraphrased trigger cases
- unnamed natural-language outcome cases
- legacy-command independence cases
- exclusion cases
- conflict cases against nearest siblings
- golden functional cases
- failure and recovery cases
- permission-boundary cases
- token-size measurement
- dependency and portability checks

godskills additionally receive composition tests proving that they select the smallest sufficient refined-skill set and terminate without recursive orchestration.

router evaluation additionally proves deterministic candidate filtering,
stable tie-breaking, effect minimization, conflict handling, commandless
selection, bounded composition, and bounded no-match behavior when no
capability qualifies. A source slash command may be accepted by an adapter for
compatibility, but removing every legacy alias must not break canonical routing.

ultragodskills additionally receive mission simulations, context-budget checks, checkpoint behavior, and partial-failure recovery tests.

## provenance and sovereignty

the private provenance ledger records source repositories, commits, exact paths, license evidence, extraction mode, capability-contract digest, implementation digest, and evaluation receipt.

operational skill prompts do not carry source marketing, vendor personas, repository lists, or attribution catalogs. required legal notices live in a dedicated notices artifact rather than consuming routine prompt context.

unknown, restricted, noncommercial, copyleft, branding-bound, or mixed-license material defaults to behavior-only evidence. no expressive text or source code is adapted from those candidates unless compatibility is separately established.

independent implementation must be based on neutral requirements and tests. this is an engineering separation mechanism, not a guarantee of legal status. external distribution receives a separate license review.

## failure handling

- source parse failure ... quarantine the source and record the error
- ambiguous identity ... retain both candidates until exact origin is established
- conflicting contracts ... preserve alternatives and require an explicit selection policy
- failed superiority test ... retain the source baseline and keep the candidate experimental
- prompt-budget regression ... demote the artifact to cold or split it
- trigger collision ... narrow contracts or ask for the disputed outcome or
  effect to be confirmed
- router ambiguity ... ask for the missing outcome or authority decision, not a
  skill name
- no qualified route ... use bounded native reasoning or return a catalog-gap
  receipt; never force the nearest skill
- constellation or adapter activation failure ... restore the previous adapter receipt and lock manifest
- unavailable D drive ... cold mining fails clearly; installed proven skills continue operating

## security boundaries

- never execute third-party setup, hooks, binaries, or scripts merely to index a repository
- never import credentials, analytics ids, telemetry, deployment assumptions, or hidden prompts
- never publish, push, deploy, send, purchase, delete, or alter external accounts during mining
- never grant a synthesized skill broader permissions than its capability contract requires
- never infer trust from stars, popularity, or polished documentation

## implementation phases

### phase 0 ... repository delta

ingest the ten missing stars, verify exact origins and commits, classify them, and rebuild the certified source index.

### phase 1 ... corpus normalization

produce stable source records and capability contracts for the existing cold catalog. establish exact duplicate and alias groups.

### phase 2 ... ontology

derive categorical families and behavioral clusters. measure cluster size, overlap, and uncovered capabilities before choosing promotion counts.

### phase 3 ... sovereign atoms and refined skills

implement and evaluate the highest-leverage recurring capabilities first. keep experimental candidates cold.

### phase 4 ... godskills

compose proven refined skills into categorical end-to-end systems. verify routing, handoffs, termination, and prompt cost.

### phase 5 ... ultragodskills and pantheon

compose only where cross-category mission evidence justifies the added orchestration layer.

### phase 6 ... constellations, adapters, and continuous refinery

generate reversible portable constellations, project them through independently certified runtime adapters, verify fresh discovery for each tested agent, and add new source candidates through the same pipeline.

## acceptance criteria

the first program release is complete when:

1. the ten missing repositories are present once in the canonical warehouse with verified receipts.
2. the source index is rebuilt and its hashes and search tests pass.
3. the ontology and contract schemas are versioned and validated.
4. exact duplicates and behavioral candidates are reported without destructive deletion.
5. at least one refined skill and one categorical godskill pass the superiority gate.
6. a portable constellation selects those artifacts without embedding one agent's paths or tool syntax.
7. at least one runtime adapter exposes the unchanged core artifacts in a fresh agent discovery surface without loading the source corpus.
8. removal of that adapter projection cleanly restores the preceding installed state.
9. provenance and notices remain available outside ordinary prompts.
10. the generic manifest, CLI, or MCP can expose the same core skill hashes without rewriting doctrine.
11. the optional Soul Anchor bridge emits structured receipts and remains silent on routine invocations.
12. every promoted capability is selected from an unnamed natural-language
    outcome without requiring a slash command or skill name.
13. deterministic routing chooses the smallest sufficient, least-effect
    capability or compatible composition and emits a reproducible receipt.
14. the complete cold catalog remains searchable while ordinary agent context
    contains only the family map, router contract, selected entrypoints, and
    route-required references.

## explicitly excluded from the first release

- bulk rewriting all 4,676 entries before the ontology is measured
- installing hundreds or thousands of descriptions globally
- deleting source repositories or historical skill evidence
- claiming absolute superiority without executable evidence
- pushing or publishing the new repository
- changing any consumer agent's model routing, approval policy, continuity machinery, or unrelated global configuration
