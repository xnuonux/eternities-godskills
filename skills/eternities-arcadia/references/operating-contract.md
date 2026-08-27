# Arcadia operating contract

Use this reference when game work is consequential, spans routes, changes persistence or network authority, affects access or monetization, depends on variable simulation, or approaches release.

## universal state contract

Every Arcadia artifact records: schema version, game and build identity, owning route, player promise, target audience and platform, session shape, multiplayer model, anti-goals, source evidence, assumptions, unresolved decisions, acceptance checks, performed effects, requested handoffs, and human-verdict status. Preserve dates and exact run identities where evidence can become stale.

Claims are one of observed source fact, user-confirmed constraint, derived value, measured runtime result, heuristic, artistic hypothesis, commercial assumption, recommendation, human judgment, or unresolved conflict. Do not let a later artifact silently replace its inputs.

## route contracts

### game direction

Inputs: game intent, player promise, audience, platform, session length, business model, networking intent, available evidence, and anti-goals.

Resolve one physical player action and the repeatable loop around it. Define failure, progression, differentiation, pacing and balance hypotheses, narrative truth and revelation boundaries, and ethical economy constraints. Make rewrite-class decisions explicit before code. Any score or curve exposes its inputs and genre assumptions.

Output: direction contract with player promise, action, loop, session, failure, progression, anti-goals, platform and networking decisions, narrative and economy boundaries, measurable unknowns, prototype target, and acceptance questions.

### runtime systems

Inputs: settled direction contract, repository state, engine and version, target devices, simulation requirements, input schemes, save requirements, network model, entity budget, and authority boundaries.

Define fixed simulation time and rendering behavior; map devices into game intents; design inspectable non-player state; version and migrate persistence; assign server and client authority; specify reconnect and degraded-device behavior; and establish measurable performance budgets. Use exact local or current official API evidence when implementation depends on changing versions.

Output: runtime contract, implementation slices, state and migration schemas, authority map, timing model, failure and degradation paths, probe plan, and verified local changes.

### player experience

Inputs: playable build, player promise, target devices and environments, control schemes, art and audio direction, accessibility requirements, performance budget, and human observations.

Map every effect to information the player needs. Reconcile input latency and interruption rules, movement and animation legibility, audio hierarchy, visual feedback, coherent art constraints, and access settings. Preserve equivalent cues across sound, color, motion, shape, text, and controls. Effects must degrade without destroying playability.

Output: experience contract, feedback map, access matrix, content and style boundaries, device budgets, measured issues, human play questions, and verified changes.

### proof and release

Inputs: fresh build, direction contract, current source hash, deterministic test results, runtime probes, representative device evidence, accessibility checks, human play sessions, and authority for any release effect.

First prove freshness and reachability. For deterministic claims, enforce repeatable hard gates. For variable systems, report distributions from repeated runs rather than selected outcomes. For experiential claims, preserve observations and ask a named human to judge. A green static or headless suite cannot certify fun or production readiness alone.

Output: verdict packet containing build identity, brief comparison, hard gates, runtime numbers, distributions, device matrix, access checks, uncovered claims, play observations, human verdict, and authorized release status.

## handoff contracts

Every handoff names the owning route, completed artifact, exact evidence inventory, decisions already made, unresolved facts, requested specialist outcome, available and missing authority, expected effects, and acceptance conditions.

- research handoff: current platform, engine, package, store, legal, ratings, privacy, accessibility, or licensing questions;
- authority handoff: proposed effect, target, consequence, reversibility, secrets, rights, and user authorization;
- implementation handoff: settled behavior, interfaces, migrations, budgets, test cases, and rollback;
- media handoff: exact experience goal, art or audio constraints, access alternatives, performance budget, rights requirements, and visual or listening acceptance;
- human verdict handoff: playable build, controls, scenario, time required, evidence packet, and the exact questions only a player can answer.

Naming a specialist does not authorize it. Its own trigger and authority checks still apply.

## failure behavior

- unresolved core action, loop, platform, or live-network decision: stop the affected implementation;
- stale or missing API and policy evidence: preserve the design and request an authoritative refresh;
- corrupt or incompatible persistence: preserve the original, fail safely, and test a forward migration before mutation;
- network ambiguity: keep authoritative ownership explicit and do not accept client claims;
- performance uncertainty: profile causes on representative hardware before optimizing;
- inaccessible critical cue: block acceptance until an equivalent channel exists;
- generated-content rights or safety uncertainty: exclude that operation and use a non-generative fallback;
- missing human play evidence: report machine gates only and withhold fun or release judgment;
- missing external authority: stop installation, signing, upload, publication, account mutation, or financial commitment.

## acceptance checklist

- one route owns each current operation and every cross-route transition is explicit;
- player promise, action, loop, anti-goals, platform, networking model, and human-verdict status are visible;
- runtime state, time, input, save, network, performance, and degradation contracts agree;
- feedback is legible, accessible, coherent, and within target-device budgets;
- evidence is fresh, reachable, repeatable where deterministic, and distributed where variable;
- human judgment is not replaced by telemetry, code review, or agent reasoning;
- local and external effects remain separate;
- termination leaves no recursive Arcadia call, background loop, implied publication, or commercial commitment.
