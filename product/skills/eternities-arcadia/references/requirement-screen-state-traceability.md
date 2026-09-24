# UI requirement-to-screen/state traceability

Use this Arcadia player-experience method when an approved player-facing requirement spans screens, interaction states, or platform variants. The outcome is a versioned, bidirectional map of the declared journey and its planned acceptance checks—not a claim that a build is usable or fun. Architect owns requirement-contract completeness and change propagation; Arcadia owns the player journey.

## Bind the game context first

Every map names its schema version, map ID and revision, owning route, target game and build identity (or an explicit `not-yet-built` state), audience/platform/input scope, and the **parent direction contract ID, revision, and content digest**. The parent supplies the player promise, session shape, multiplayer model, anti-goals, and other settled direction decisions by exact reference. Record which values are inherited, and any artifact-local override with its owner, reason, and evidence. Never silently duplicate, replace, or assume values from a newer parent revision. A changed parent digest makes the map stale until the owner reviews the affected links.

Also record the requirement source/revision and controlling source when records disagree; source evidence; assumptions and unresolved decisions; acceptance-check inventory; performed local effects; requested handoffs with owner, expected outcome and acceptance conditions; and the human-verdict status. A design map can truthfully say `pending human review`. A green structural check cannot set that status to approved. Preserve dates and exact run/build identities whenever evidence can become stale.

## Give the map stable identities

Assign local IDs to requirements (`REQ`), screens (`SCR`), states (`STA`), flows (`FLOW`), transitions (`TRN`), acceptance checks (`AC`), and exceptions (`EX`). Keep an ID attached to the same design object across revisions; never recycle a retired ID. A material change gets a new ID and a recorded supersession link. Approved, draft, retired, and disputed requirements remain distinct. Drafts may be mapped for exploration, but they do not count as approved coverage.

Bind **each approved requirement ID** to its own controlling source identity, source revision, and stable evidence locator or content digest. If several records contribute to one requirement, list each source and the named owner who resolved any conflict. A map-level document title alone is not a per-requirement binding. When a cited source revision or digest changes, mark the affected requirement links, paths, and acceptance checks stale until the requirement owner compares the old and new sources and records a decision. Preserve the prior binding and decision trail; do not silently roll it forward.

For every in-scope approved requirement, list a screen, state path, and observable acceptance check. Each listed screen and state points back to that requirement. Every screen/state points to an approved requirement or an explicit exception with owner, reason, and narrow scope. Check both directions: a nearby paragraph or one-way link is not coverage. A shared surface, navigation state, or platform-specific variant may use a named exception; `common UI` is not a blanket waiver. A platform variant retains its own identity and remains linked to the player need wherever that need applies.

## Check declared paths and critical states

For each flow, name entry states, intended states, and directed transitions with their triggers and platform/input conditions. A state is structurally reachable only when the declared graph contains a path from an entry. Reachability in the map says nothing about runtime reachability in a build.

For each critical flow, decide explicitly about loading, empty, error (including validation failure where relevant), and recovery. Supply state IDs for required kinds. If a kind truly cannot occur, record `not applicable` with a reason, responsible owner, and alternate acceptance check; absence is not an exception. Include retry, cancel, return, or interruption paths when the player promise requires them. Do not invent a state or waive a failure merely to make a checker pass.

## Separate checks from human experience

Each requirement has an acceptance-check ID, target state(s), platform/input scope, owner, method, and observable expected result. Mark it planned until exercised. A performed check records its actual result, build/context, and durable evidence reference; failed and blocked results remain visible. `Screen exists` is not a player-facing acceptance result.

Keep accessibility and localization review records separate. Each names its scope, target build/map revision, reviewer, date, status, and evidence when reviewed. Accessibility questions include relevant focus/order, labels, non-color meaning, motion, and input alternatives. Localization questions include in-context expansion, truncation, direction, fallback, and locale-sensitive text. A pending lane stays pending; structural completeness does not certify either lane.

## Finish and hand off

Before handoff, compare approved requirements to reachable screen/state paths and checks, then compare every screen/state back to a requirement or justified exception. Record gaps, stale parent references, assumptions, unresolved owner decisions, performed effects, and the exact requested next specialist outcome. Route changes to requirement meaning back to the requirements owner; do not silently update the map alone. The named human owner decides whether the direction, interaction and acceptance evidence is sufficient for the next build or review.

A local lint or table check can catch missing IDs, broken links, and declared-graph gaps. It does **not** inspect a game build, prove navigation, render quality, accessibility or localization conformance, usability, playability, fairness, or a real playtest. Keep structural findings and the human-verdict status separate. A map with no playable build remains a design artifact, not release evidence.
