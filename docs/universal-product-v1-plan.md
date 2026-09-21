# Universal Godskills product, v1

User authorization: 2026-09-21. Deliver an agent-neutral skill pack and refresh the local Codex installation after verification. This is a finite release of a continuously improving library, not proof that every profession or future task is covered.

## Product contract

- `product/` is self-contained. Markdown works without Node, network, APIs, a warehouse, Keel, Godagents, or personal paths. Optional offline tooling uses Node built-ins only.
- `product/skills/<id>/SKILL.md` is the portable entrypoint. Each directory includes `skill.json`: `id`, `category`, `summary`, `triggers` (string array), `antiTriggers` (string array), `taskTypes` (string array), `related` (existing skill IDs), `resources` (relative file paths), `maturity` (`instruction-reviewed`), and `provenance` (array of `{kind,source,note}` objects). Optional `specializes` is an existing broad ID. Category is a readable kebab-case domain.
- IDs remain stable. A compact generated catalog contains summaries, relations, entrypoint hashes, and resource hashes. Content identity excludes machine paths and timestamps. Search is deterministic offline term matching with synonym expansion, explanations, and stable tie-breaking; it is not advertised as vector inference. Discovery does not grant permission, execute a skill, or promise outcome quality.
- Skills supply task-specific methods, examples, pitfalls, useful artifacts, and appropriate validation. Avoid generic bureaucracy, mandatory planning for trivial work, artificial local-only limitations, or perpetual loops. Tools and real-world effects follow the user's scope and host permissions. High-risk professional advice retains appropriate boundaries.
- Preserve the historic `skills/`, frozen receipts, activation ABI, and Godagents pinned files. This is a versioned successor, not a silent recertification of old bytes.
- All rewritten methods are independently authored. Provenance retains source relationships; do not claim rewriting removes third-party license obligations. Acquired source packs remain inert, not automatically installed.

## Work lanes

1. Parent: product architecture, test-first offline discovery/validation/install, new corpus disposition, evidence corrections, integration and installation.
2. Luna A: refine the 22 broad skill entrypoints and references into `product/skills/<broad-id>/`; integrate the 26 current extensions into appropriate methods. No runtime or installer changes.
3. Luna B: refine the 22 operational skills, two new draft candidates, and bounded new specialties covering source-supported gaps into distinct `product/skills/<operational-id>/`. No broad directories or runtime changes.
4. Jev: advisory classification of ambiguous category boundaries only, never arithmetic, acceptance, permission, or certification.
5. Parent domain expansion: four independently authored methods in education, finance, contract review, and agricultural observation/trials. Preserve useful source patterns, reject unsupported domain prescriptions and command-only wrappers, and retain exact source-review locators.

## Release gates

1. Every product skill parses, has a useful trigger, portable relative resources, a resolved relationship graph, and honest maturity. No mandatory external personal path or absent companion skill.
2. Offline discovery includes broad and operational skills and explains matches. Golden tasks, negative tasks, task-specific ranking, stable serialization, and bounded output have executable tests.
3. A copied product works outside this repository with a minimal environment. No package installation or external services are needed.
4. Installer verifies manifest bytes, protects unrelated skills, rejects unsafe paths/symlinks, backs up exact overwritten directories, supports rollback, and verifies installed bytes.
5. Actual agent exercises are recorded separately from authored fixtures. No synthetic fixture is presented as superiority or agent performance evidence.
6. Run new product tests and current full regression suite; investigate pre-existing failures without rewriting historical certifications. Reconcile upstream before integrating; merge only fully verified work.
7. Install the verified new pack into the authorized local agents directory, retain rollback and installation receipt, and explain catalog refresh behavior for already-open tasks.

## Corpus honesty

Recent Exa intake: 2,643 source records / 2,558 unique declared bodies. Historical reconciliation contains unresolved identity/hash conflicts and missing body declarations. Acquisition, classification, distillation, and outcome qualification are distinct. Publish a coverage/disposition ledger; do not label all acquired material refined because it has a category. Resolve or quarantine uncertain identities before using them as exact provenance.
