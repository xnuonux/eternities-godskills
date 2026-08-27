# Agent-Native Skill Router Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portable, deterministic router that lets an agent select the smallest sufficient Eternities capability from an ordinary user outcome without requiring a skill name or slash command.

**Architecture:** A runtime adapter interprets natural language into a validated neutral request envelope. The portable core then performs deterministic cold-index retrieval, policy filtering, least-effect single-skill or bounded composition selection, selective instruction loading, and reproducible receipt generation. Slash commands remain inert `legacyAliases` and never influence canonical routing.

**Tech Stack:** Node.js 24 ESM, built-in `node:test`, JSON/JSONL/Markdown, SHA-256, no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-26-eternities-godskills-design.md`

## Global Constraints

- The canonical interface is an ordinary natural-language outcome. No promoted capability may require a skill name or slash command.
- Runtime adapters interpret language; the portable core routes only validated neutral request envelopes.
- `legacyAliases` are compatibility metadata. Canonical retrieval, filtering, ranking, and composition must not read them.
- Automatic skill selection never expands authority. Effects, risk, preconditions, and authority are validated independently.
- Selection order is complete coverage, narrowest fit, least effects, lowest context cost, lowest dependency cost, strongest evidence, then stable id.
- A single capability wins over composition whenever it fully qualifies.
- Composition contains at most three cards and requires explicit pairwise compatibility.
- Cold retrieval returns at most 32 complete capability cards to the router.
- Full source bodies, the 4,741-card quarry, and full skill instructions never enter ordinary routing context.
- Canonical artifacts contain no generated timestamps and rebuild byte-for-byte identically.
- Existing release receipts remain immutable historical evidence. Router certification creates new receipts.
- No publishing, pushing, global activation, model routing, or external-account mutation occurs in this plan.

---

## File structure

- `src/routing-contracts.mjs` owns portable request, card, and receipt validation.
- `src/router.mjs` owns deterministic filtering, ranking, composition, and receipt construction.
- `src/routing-index.mjs` owns cold family maps, inverted capability indexes, and bounded retrieval.
- `scripts/build-routing-index.mjs` builds deterministic routing artifacts from promoted card files.
- `scripts/route.mjs` exposes a generic file-based transport over the portable router.
- `runtime/agent-router.md` defines the compact adapter doctrine loaded by a compatible agent.
- `runtime/portable-adapter.v1.json` identifies canonical artifacts and adapter obligations.
- `skills/*/references/routing-card.json` exposes one compact machine-readable card per promoted capability.
- `artifacts/routing/` contains generated family, card, and manifest evidence.
- `receipts/agent-native-router-v1.json` certifies the commandless routing milestone.

### Task 1: Portable request, capability-card, and route-receipt contracts

**Files:**
- Create: `src/routing-contracts.mjs`
- Create: `tests/routing-contracts.test.mjs`

**Interfaces:**
- Consumes: plain JavaScript objects parsed from canonical JSON.
- Produces: `validateRequestEnvelope(value)`, `validateRoutingCard(value)`, `validateRouteReceipt(value)`, `effectCost(effects)`, `riskAtMost(actual, maximum)`, `evidenceAtLeast(actual, minimum)`, and frozen exported vocabularies.

- [ ] **Step 1: Write the failing contract tests**

Create fixtures with these exact shapes:

```js
const envelope = {
  schemaVersion: 1,
  requestId: "request-commandless-feature",
  outcome: "deliver a consequential feature with tests, review, and proof",
  candidateFamilies: ["implementation-engineering"],
  requiredCapabilities: ["implementation", "review", "tests", "verification"],
  forbiddenCapabilities: [],
  permittedEffects: ["local-read", "local-write"],
  availableAuthority: ["local-read", "local-write", "repository-write"],
  availablePreconditions: ["repository-present", "settled-outcome"],
  maximumRisk: "moderate",
  minimumEvidenceConfidence: "medium",
  contextBudget: 4000,
  maxCompositionSize: 3,
  unresolvedDecisions: [],
};

const card = {
  schemaVersion: 1,
  id: "eternities-forge",
  family: "implementation-engineering",
  intent: "deliver a consequential multi-stage software change",
  successCondition: "implementation, review, and verification are evidenced",
  provides: ["implementation", "integration", "review", "tests", "verification"],
  requires: [],
  intentExamples: {
    direct: ["deliver a consequential feature across several engineering phases"],
    paraphrased: ["carry this approved change through implementation, review, and proof"],
    contextual: ["the design is settled and now needs a verified repository delivery"],
  },
  negativeIntents: ["routine one-file edit"],
  effects: ["local-read", "local-write"],
  riskClass: "moderate",
  authorityRequirements: ["local-read", "local-write", "repository-write"],
  preconditions: ["repository-present", "settled-outcome"],
  compatibleWith: ["eternities-aegis", "eternities-architect", "eternities-oracle"],
  conflictsWith: [],
  contextCost: 998,
  dependencyCost: 8,
  evidenceConfidence: "verified",
  entrypoint: "skills/eternities-forge/SKILL.md",
  legacyAliases: [],
};

const receipt = {
  schemaVersion: 1,
  requestId: "request-commandless-feature",
  requestDigest: "a".repeat(64),
  status: "selected",
  selectionKind: "single",
  requestFeatures: {
    candidateFamilies: ["implementation-engineering"],
    requiredCapabilities: ["implementation", "review", "tests", "verification"],
    permittedEffects: ["local-read", "local-write"],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "medium",
    contextBudget: 4000,
  },
  candidateIds: ["eternities-forge"],
  selectedIds: ["eternities-forge"],
  selectedEntrypoints: ["skills/eternities-forge/SKILL.md"],
  selectionConfidence: "verified",
  rejected: [],
  unresolvedDecisions: [],
  decisionPolicy:
    "coverage>card-count>extra-capabilities>effects>context>dependencies>evidence>id",
};
```

Assert acceptance of all three fixtures and rejection of duplicate strings, unknown effects, unknown risk or evidence levels, negative budgets, missing authority arrays, path escape in `entrypoint`, an empty `requiredCapabilities`, mismatched selected-id and entrypoint counts, a nonempty selection under `no-qualified-route`, and a non-64-character request digest. Assert `effectCost(["local-read", "local-write"])` is lower than `effectCost(["external-write"])`, `riskAtMost("high", "moderate")` is false, and `evidenceAtLeast("low", "medium")` is false.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/routing-contracts.test.mjs`

Expected: fail with `ERR_MODULE_NOT_FOUND` for `src/routing-contracts.mjs`.

- [ ] **Step 3: Implement exact vocabularies and validators**

Use these canonical orders and required exports:

```js
export const ROUTING_EFFECTS = Object.freeze([
  "none",
  "local-read",
  "external-read",
  "local-write",
  "external-write",
]);
export const EFFECT_COSTS = Object.freeze({
  none: 0,
  "local-read": 1,
  "external-read": 2,
  "local-write": 3,
  "external-write": 5,
});
export const RISK_LEVELS = Object.freeze(["low", "moderate", "high", "critical"]);
export const EVIDENCE_LEVELS = Object.freeze(["verified", "high", "medium", "low"]);
export const ROUTE_STATUSES = Object.freeze([
  "selected",
  "needs-decision",
  "no-qualified-route",
]);

export function effectCost(effects) {
  return [...new Set(effects)].reduce(
    (total, effect) => total + EFFECT_COSTS[effect],
    0,
  );
}

export function riskAtMost(actual, maximum) {
  return RISK_LEVELS.indexOf(actual) <= RISK_LEVELS.indexOf(maximum);
}

export function evidenceAtLeast(actual, minimum) {
  return EVIDENCE_LEVELS.indexOf(actual) <= EVIDENCE_LEVELS.indexOf(minimum);
}
```

Define private `object`, `versionOne`, `nonEmptyString`, `uniqueStrings`, `enumValue`, `boundedInteger`, and `relativeSkillEntrypoint` helpers. They validate without mutating input. `validateRequestEnvelope()` requires every field shown in the fixture, bounds `maxCompositionSize` from one through three, and requires positive `contextBudget`. `validateRoutingCard()` requires every card field shown in the fixture and a positive `contextCost`. `validateRouteReceipt()` requires the exact receipt fields shown above, checks the request digest, reconciles selection ids with entrypoints, requires `selectionConfidence` for selected routes, and requires empty selections plus null confidence for non-selected statuses.

`entrypoint` must be a normalized relative path, may use `/`, and must reject an absolute path, `..`, an empty segment, and a non-`SKILL.md` basename. Every card requires non-empty `intentExamples.direct`, `intentExamples.paraphrased`, and `intentExamples.contextual` arrays. Set-like arrays must be lexically sorted and duplicate-free in canonical request, card, and receipt artifacts; malformed canonical input fails instead of being silently rewritten.

- [ ] **Step 4: Run the focused tests**

Run: `node --test tests/routing-contracts.test.mjs tests/schema.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit the portable contracts**

```powershell
git add src/routing-contracts.mjs tests/routing-contracts.test.mjs
git commit -m "feat: define portable routing contracts"
```

### Task 2: Deterministic least-effect routing and bounded composition

**Files:**
- Create: `src/router.mjs`
- Create: `tests/router.test.mjs`

**Interfaces:**
- Consumes: one validated request envelope and at most 32 validated routing cards.
- Produces: `routeCapabilities({ envelope, cards }) -> RouteReceipt` and `compareSelections(left, right) -> number`.

- [ ] **Step 1: Write failing single-route policy tests**

Create three cards from the Task 1 fixture: `eternities-forge`, a broader card that adds `external-write` and 2,000 context tokens, and a narrow card missing `review`. Assert the result selects only `eternities-forge`, records the broader card as rejected for its effect, retains all three stable ids in `candidateIds`, and remains deeply equal after every `legacyAliases` array is removed.

Add tests asserting:

```js
assert.equal(receipt.status, "selected");
assert.deepEqual(receipt.selectedIds, ["eternities-forge"]);
assert.equal(receipt.selectionKind, "single");
assert.deepEqual(receipt.unresolvedDecisions, []);
assert.ok(receipt.rejected.some(({ reasons }) => reasons.includes("effect-not-permitted")));
```

Also assert that non-empty `unresolvedDecisions` returns `needs-decision` without selecting anything, missing authority rejects a card, excessive risk rejects a card, evidence below the request minimum rejects a card, forbidden capabilities reject a card, and no qualifying card returns `no-qualified-route` rather than selecting the nearest card.

- [ ] **Step 2: Write failing composition tests**

Use one `implementation` card and one `verification` card that list each other in `compatibleWith`. Assert their two-card composition is selected only when no single card covers all requirements. Add a one-card full-coverage candidate and assert it supersedes the composition. Add tests for asymmetric compatibility, explicit conflicts, context-budget overflow, and a request whose `maxCompositionSize` is two while coverage would require three cards.

- [ ] **Step 3: Run the focused tests and observe failure**

Run: `node --test tests/router.test.mjs`

Expected: fail with `ERR_MODULE_NOT_FOUND` for `src/router.mjs`.

- [ ] **Step 4: Implement deterministic filtering and selection**

Implement these exact stages:

```js
export function routeCapabilities({ envelope, cards }) {
  const request = validateRequestEnvelope(envelope);
  const candidates = cards.map(validateRoutingCard);
  if (candidates.length > 32) throw new Error("router accepts at most 32 cards");
  if (request.unresolvedDecisions.length > 0) return needsDecisionReceipt(request);
  const { qualified, rejected } = filterCards(request, candidates);
  const singles = qualified
    .filter((card) => covers(card.provides, request.requiredCapabilities))
    .map((card) => selection([card], request));
  const selections = singles.length > 0
    ? singles
    : compatibleCompositions(qualified, request).map((cards) => selection(cards, request));
  if (selections.length === 0) return noRouteReceipt(request, rejected);
  selections.sort(compareSelections);
  return selectedReceipt(request, selections[0], rejected);
}
```

`filterCards()` must record stable sorted reason codes from this closed set: `family-mismatch`, `forbidden-capability`, `effect-not-permitted`, `risk-exceeds-maximum`, `evidence-below-minimum`, `authority-missing`, `precondition-missing`, and `context-budget-exceeded`. It must never inspect `intentExamples`, `negativeIntents`, or `legacyAliases`; those fields support adapter interpretation and human audit, not core policy.

Define private `covers`, `filterCards`, `compatibleCompositions`, `selection`, `needsDecisionReceipt`, `noRouteReceipt`, and `selectedReceipt` helpers in `src/router.mjs`. Every receipt includes a SHA-256 of canonical request JSON, sorted candidate ids, sorted rejection rows, selected ids paired with entrypoints, the lowest evidence confidence among selected cards, the compact request features from Task 1, and the exact decision-policy string from the receipt fixture.

`compareSelections()` compares, in order: uncovered requirement count, selected card count, extra provided capability count, total effect cost, total context cost, total dependency cost, evidence penalty, then joined sorted ids. Evidence penalties are `verified=0`, `high=1`, `medium=2`, and `low=3` per card.

Enumerate combinations in stable id order for sizes two through `maxCompositionSize`. A composition qualifies only when every pair lists the other in `compatibleWith`, neither card lists the other in `conflictsWith`, the combined effects and context remain permitted, and the union of `provides` covers every requirement.

- [ ] **Step 5: Run focused routing tests**

Run: `node --test tests/router.test.mjs tests/routing-contracts.test.mjs tests/composition.test.mjs`

Expected: all tests pass.

- [ ] **Step 6: Commit the deterministic router**

```powershell
git add src/router.mjs tests/router.test.mjs
git commit -m "feat: route smallest sufficient capability set"
```

### Task 3: Cold family map and bounded capability retrieval

**Files:**
- Create: `src/routing-index.mjs`
- Create: `scripts/build-routing-index.mjs`
- Create: `tests/routing-index.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: validated `routing-card.json` files under `skills/*/references`.
- Produces: `buildRoutingIndex(cards)`, `shortlistRoutingCards(index, envelope, { limit = 32 })`, and deterministic `family-map.json`, `cards.jsonl`, and `manifest.json`.

- [ ] **Step 1: Write failing index and progressive-disclosure tests**

Generate 5,000 synthetic cards across 100 families and assert:

```js
const index = buildRoutingIndex(cards);
const shortlist = shortlistRoutingCards(index, envelope, { limit: 32 });
assert.ok(shortlist.length <= 32);
assert.ok(shortlist.some(({ id }) => id === "eternities-forge"));
assert.equal(JSON.stringify(index).includes("full skill body"), false);
```

Test exact family and capability inverted indexes, stable id ordering, duplicate id rejection, unknown family behavior, limit bounds from 1 through 32, and deterministic tie-breaking. Test the artifact builder twice in a temporary directory and assert byte equality for all three outputs and equality of their SHA-256 values.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/routing-index.test.mjs`

Expected: fail with `ERR_MODULE_NOT_FOUND` for `src/routing-index.mjs`.

- [ ] **Step 3: Implement the cold index**

Use this output shape:

```js
{
  schemaVersion: 1,
  cardCount: cards.length,
  familyMap: [
    {
      id: "implementation-engineering",
      cardCount: 1,
      provides: ["implementation", "integration", "review", "tests", "verification"],
      cardIds: ["eternities-forge"],
    },
  ],
  capabilityIndex: {
    implementation: ["eternities-forge"],
  },
  cardsById: {
    "eternities-forge": card,
  },
}
```

`shortlistRoutingCards()` first unions exact `candidateFamilies` and exact `requiredCapabilities`, then intersects when both sources provide candidates, then ranks complete coverage before partial coverage, lower context cost, stronger evidence, and stable id. The returned list contains complete compact cards only; it never reads `SKILL.md` or source bodies.

The builder recursively reads only paths matching `skills/*/references/routing-card.json`, rejects symbolic path escape, writes canonical LF JSON, omits timestamps, and records input card hashes plus output hashes in `manifest.json`.

- [ ] **Step 4: Add package commands**

Add exactly:

```json
"build:routing": "node scripts/build-routing-index.mjs",
"route": "node scripts/route.mjs"
```

Keep every existing package command unchanged.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/routing-index.test.mjs tests/router.test.mjs`

Expected: all tests pass.

- [ ] **Step 6: Commit the cold index**

```powershell
git add src/routing-index.mjs scripts/build-routing-index.mjs tests/routing-index.test.mjs package.json
git commit -m "feat: build bounded capability routing index"
```

### Task 4: Routing cards for every currently promoted Eternities capability

**Files:**
- Create: `skills/eternities-aegis/references/routing-card.json`
- Create: `skills/eternities-architect/references/routing-card.json`
- Create: `skills/eternities-forge/references/routing-card.json`
- Create: `skills/eternities-mnemosyne/references/routing-card.json`
- Create: `skills/eternities-muse/references/routing-card.json`
- Create: `skills/eternities-oracle/references/routing-card.json`
- Create: `skills/sovereign-skill-refinery/references/routing-card.json`
- Create: `tests/promoted-routing-cards.test.mjs`

**Interfaces:**
- Consumes: seven promoted entrypoints, their evaluation cases, promotion receipts, and five existing capability contracts.
- Produces: seven command-independent routing cards whose ids exactly match their skill directory names.

- [ ] **Step 1: Write the failing promoted-card reconciliation tests**

Discover every `receipts/promotions/*.json` with `decision.status === "promoted"`. Assert exactly one card exists for each receipt, every card entrypoint exists and ends in its directory's `SKILL.md`, `contextCost` equals the promotion receipt's measured token count, no direct, paraphrased, or contextual intent example starts with `/`, and clearing `legacyAliases` preserves the card's route-relevant projection.

Assert the seven exact ids:

```js
assert.deepEqual(cardIds, [
  "eternities-aegis",
  "eternities-architect",
  "eternities-forge",
  "eternities-mnemosyne",
  "eternities-muse",
  "eternities-oracle",
  "sovereign-skill-refinery",
]);
```

- [ ] **Step 2: Run the focused test and observe failure**

Run: `node --test tests/promoted-routing-cards.test.mjs`

Expected: fail because the seven routing cards do not exist.

- [ ] **Step 3: Author the seven routing cards from neutral contracts**

Use these exact routing-specific values. Copy each card's `intent`, `successCondition`, direct intent examples, and negative intent examples from its neutral capability contract or, for Oracle and the refinery, from the existing entrypoint and evaluation suite. Independently author one semantically equivalent paraphrased example and one contextual example for every direct example. Do not copy source-quarry prose.

| id | family | provides | effects | risk | context | dependency |
|---|---|---|---|---|---:|---:|
| `eternities-aegis` | `governance-security` | `authorization,findings,mitigation,residual-risk,threat-model,trust-boundaries` | `local-read,local-write` | `high` | 1002 | 3 |
| `eternities-architect` | `architecture-specification` | `architecture,decision,handoff,interfaces,requirements` | `local-read,local-write` | `moderate` | 929 | 3 |
| `eternities-forge` | `implementation-engineering` | `implementation,integration,review,tests,verification` | `local-read,local-write` | `moderate` | 998 | 8 |
| `eternities-mnemosyne` | `knowledge-memory-context` | `context-budget,continuity,memory-design,provenance,retrieval-audit` | `local-read,local-write` | `moderate` | 1099 | 3 |
| `eternities-muse` | `visual-interface-narrative-media` | `accessibility,art-direction,motion-story,visual-acceptance,visual-forensics` | `local-read,local-write` | `moderate` | 1294 | 6 |
| `eternities-oracle` | `repository-research` | `local-evidence,official-evidence,provenance,research,synthesis` | `external-read,local-read` | `low` | 885 | 2 |
| `sovereign-skill-refinery` | `skill-refinery` | `capability-contract,evaluation,promotion-decision,provenance,source-synthesis` | `local-read,local-write` | `moderate` | 820 | 2 |

Use authority requirements equal to each effect plus `authorized-security-scope` for Aegis and `repository-write` for Forge. Use `settled-outcome` and `repository-present` as Forge preconditions, `authorized-target` as the Aegis precondition, and an empty precondition list for the other five.

Compatibility must be symmetric. Oracle is compatible with all six peers. Architect is additionally compatible with Aegis, Forge, Mnemosyne, and Muse. Forge is additionally compatible with Aegis, Mnemosyne, and Muse. Aegis is compatible only with Oracle, Architect, and Forge. Mnemosyne is compatible only with Oracle, Architect, and Forge. Muse is compatible only with Oracle, Architect, and Forge. The refinery is compatible only with Oracle. Every `conflictsWith` and `legacyAliases` array starts empty.

- [ ] **Step 4: Add unnamed outcome and alias-independence assertions**

For each card, construct a request whose `outcome` contains no card id, skill name, slash command, or `eternities` token. Require the card's family and a discriminating subset of `provides`, route it against all seven cards, and assert the expected card id. Repeat after replacing every card's `legacyAliases` with `[]`.

- [ ] **Step 5: Run focused tests and build the index twice**

Run:

```powershell
node --test tests/promoted-routing-cards.test.mjs tests/router.test.mjs
npm run build:routing
npm run build:routing
```

Expected: all tests pass and both builds report identical hashes.

- [ ] **Step 6: Commit the promoted cards and artifacts**

```powershell
git add skills/*/references/routing-card.json tests/promoted-routing-cards.test.mjs artifacts/routing
git commit -m "feat: expose promoted commandless capability cards"
```

### Task 5: Generic adapter doctrine and file-based routing transport

**Files:**
- Create: `runtime/agent-router.md`
- Create: `runtime/portable-adapter.v1.json`
- Create: `scripts/route.mjs`
- Create: `tests/route-cli.test.mjs`

**Interfaces:**
- Consumes: a request-envelope JSON path and `artifacts/routing/cards.jsonl`.
- Produces: a route receipt on stdout or at an explicitly supplied output path. The command never executes a selected skill.

- [ ] **Step 1: Write failing transport tests**

Import `routeRequest({ requestPath, cardsPath, outputPath })` from `scripts/route.mjs`. Assert stdout-mode returns a validated receipt without writing a file, output-mode writes canonical JSON, repeated runs are byte-identical, unknown flags fail, and neither mode reads selected `SKILL.md` bodies.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/route-cli.test.mjs`

Expected: fail because `scripts/route.mjs` does not exist.

- [ ] **Step 3: Implement the generic transport**

Support exactly:

```text
node scripts/route.mjs --request <request-envelope.json> \
  [--cards artifacts/routing/cards.jsonl] [--output <receipt.json>]
```

The command reads the family map and compact cards, calls `shortlistRoutingCards()` with limit 32, calls `routeCapabilities()`, validates the receipt, and writes only when `--output` is present. It must not accept `--apply`, execute entrypoints, modify profiles, or inspect source bodies.

- [ ] **Step 4: Write the compact portable adapter doctrine**

`runtime/agent-router.md` must contain this exact operating sequence in agent-neutral language:

```markdown
1. understand the user's desired outcome, constraints, effects, authority, and unresolved decisions.
2. express them as a neutral request envelope without requiring a skill name.
3. retrieve at most 32 compact cards from the family map and capability index.
4. apply the portable router and accept only its validated receipt.
5. if selected, load only the selected entrypoint and route-required references.
6. if `needs-decision`, ask about the missing outcome, effect, or authority, never which skill to choose.
7. if `no-qualified-route`, use bounded native reasoning or report a catalog gap.
8. never treat a legacy alias as routing authority or expand permission through skill selection.
```

`runtime/portable-adapter.v1.json` declares schema version 1, the three routing artifact paths, the doctrine path, maximum shortlist 32, maximum composition 3, and adapter obligations `interpret-natural-language`, `preserve-effects`, `preserve-authority`, `load-selected-only`, `surface-unresolved-decisions`, and `emit-route-receipt`.

- [ ] **Step 5: Run focused transport tests**

Run: `node --test tests/route-cli.test.mjs tests/routing-index.test.mjs tests/router.test.mjs`

Expected: all tests pass.

- [ ] **Step 6: Commit the portable adapter surface**

```powershell
git add runtime scripts/route.mjs tests/route-cli.test.mjs
git commit -m "feat: expose portable agent routing transport"
```

### Task 6: Teach the corpus refinery to neutralize command-shaped source interfaces

**Files:**
- Create: `artifacts/checkpoints/corpus-refinery-foundation/`
- Modify: `tests/corpus-refinery-certification.test.mjs`
- Modify: `receipts/corpus-refinery-foundation.json`
- Modify: `src/reviews.mjs`
- Modify: `src/review-packets.mjs`
- Modify: `tests/reviews.test.mjs`
- Modify: `tests/review-packets.test.mjs`
- Modify: `reviews/waves/agency-client-services/wave-001.json`
- Modify: `reviews/waves/agency-client-services/wave-002.json`
- Modify: `reviews/waves/marketing-growth/wave-001.json`
- Modify: `reviews/waves/social-media-community/wave-001.json`
- Modify: `reviews/waves/game-design-development/wave-001.json`

**Interfaces:**
- Consumes: inert source bodies and existing exact review receipts.
- Produces: review evidence containing command-independent `neutralIntentExamples` and non-authoritative `legacyAliases`, while preserving the immutable foundation snapshot.

- [ ] **Step 1: Freeze the certified foundation artifacts before live review digests change**

Copy the current committed `artifacts/corpus` tree byte-for-byte to `artifacts/checkpoints/corpus-refinery-foundation`. Update only the certification test and receipt artifact paths so the existing receipt continues validating the immutable hashes. Assert every copied file hash equals the hash recorded by commit `ee53877` and that the live `artifacts/corpus` path remains the mutable current refinery output.

- [ ] **Step 2: Write failing invocation-neutrality review tests**

Extend the review fixture with:

```js
neutralIntentExamples: [
  "reconcile a client relationship from intake through verified delivery",
  "show the account evidence, gaps, and next bounded action",
],
legacyAliases: ["/agency:client"],
```

Require at least one `neutralIntentExamples` string, permit an empty `legacyAliases` array, reject duplicates, reject an intent example equal to an alias after normalization, reject an intent example beginning with `/`, and include both fields in `reviewDigest`. Assert coverage state does not advance beyond `card-reviewed` because of either field.

- [ ] **Step 3: Add inert invocation candidates to review packets**

`buildReviewPackets()` may expose up to eight lines matching command-shaped source forms such as `/name`, `slash command`, `invoke`, or `command:` under an `invocationCandidates` field labeled `inspected-source-data`. These candidates are evidence for a reviewer and never become aliases automatically. Packet generation remains deterministic and must not execute or interpolate the lines.

- [ ] **Step 4: Implement review validation and normalization**

Add `neutralIntentExamples` to the required non-empty string arrays and `legacyAliases` to an array validator that allows empty arrays. Preserve original display spelling, reject duplicate normalized values, and sort neither array silently. The normalized review row and digest include both fields exactly.

- [ ] **Step 5: Update the existing 18 reviewed cards**

For each exact reviewed body, author at least two unnamed natural-language intent examples from its neutral capability summary, operations, outputs, and exclusions. Record only command forms visibly present in the exact body as `legacyAliases`; use `[]` when no exact form is present. Do not infer aliases from filenames and do not place an alias inside `neutralIntentExamples`.

- [ ] **Step 6: Run focused review tests and rebuild live coverage twice**

Run:

```powershell
node --test tests/reviews.test.mjs tests/review-packets.test.mjs tests/corpus-refinery-certification.test.mjs
npm run build:coverage
npm run build:coverage
```

Expected: all focused tests pass, the immutable foundation certification remains valid, live review hashes are stable across both builds, and reviewed counts still reconcile exactly.

- [ ] **Step 7: Commit command-neutral refinery evidence**

```powershell
git add artifacts/checkpoints/corpus-refinery-foundation tests/corpus-refinery-certification.test.mjs receipts/corpus-refinery-foundation.json src/reviews.mjs src/review-packets.mjs tests/reviews.test.mjs tests/review-packets.test.mjs reviews artifacts/corpus
git commit -m "feat: neutralize source command interfaces"
```

### Task 7: Agent-native routing certification

**Files:**
- Create: `tests/agent-native-routing-certification.test.mjs`
- Create: `receipts/agent-native-router-v1.json`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-26-eternities-skills-corpus-refinery.md`

**Interfaces:**
- Consumes: all seven cards, routing artifacts, adapter doctrine, request fixtures, historical promotion receipts, and current repository state.
- Produces: a deterministic milestone receipt and a corpus plan whose later synthesis tasks depend on commandless routing gates.

- [ ] **Step 1: Write end-to-end commandless routing cases**

Create seven direct requests, seven semantically equivalent paraphrased requests, and seven contextual requests whose outcomes contain no `/`, no skill id, and no `eternities` token. All three forms use the same neutral capability requirements and must produce deeply equal selections:

| outcome | required capabilities | expected |
|---|---|---|
| deliver a consequential feature with tests, review, proof, and integration | `implementation,tests,review,verification,integration` | `eternities-forge` |
| decide the interfaces and tradeoffs for a consequential new system | `requirements,architecture,decision,interfaces,handoff` | `eternities-architect` |
| audit an authorized agent tool chain and rank mitigations by residual risk | `authorization,trust-boundaries,findings,mitigation,residual-risk` | `eternities-aegis` |
| recover the smallest reliable cross-session state and audit its provenance | `continuity,provenance,retrieval-audit` | `eternities-mnemosyne` |
| reconcile visual identity, motion, accessibility, and deterministic acceptance | `art-direction,motion-story,accessibility,visual-acceptance` | `eternities-muse` |
| reconcile local repository evidence with current official documentation | `local-evidence,official-evidence,research,synthesis,provenance` | `eternities-oracle` |
| synthesize overlapping workflow sources into an evaluated first-party capability | `source-synthesis,capability-contract,evaluation,promotion-decision` | `sovereign-skill-refinery` |

Repeat all twenty-one after removing `legacyAliases`. Assert receipts are deeply equal with no exceptions because aliases never enter route receipts. The certification receipt must state that deterministic envelope routing is proven while live-model natural-language interpretation remains an adapter-level evaluation rather than an implied proof.

- [ ] **Step 2: Add progressive-disclosure and authority assertions**

Assert a 5,000-card synthetic index produces a shortlist no larger than 32, only selected entrypoint paths appear in a selected receipt, external-write candidates fail without permission, a high-risk Aegis request fails under `maximumRisk: "moderate"`, and unresolved authority returns `needs-decision` rather than guessing.

- [ ] **Step 3: Build router artifacts twice and generate the receipt**

Run `npm run build:routing` twice and record exact input hashes, output hashes, card count, family count, seven commandless cases, alias-removal equality, maximum shortlist, maximum composition, test command, and immutable Git base in `receipts/agent-native-router-v1.json`. Set status to `certified` only after every recorded gate passes.

- [ ] **Step 4: Amend the corpus plan dependency**

Add a global constraint that every new synthesized capability must produce a validated routing card and pass unnamed-outcome plus alias-removal cases before promotion. Add routing-card and router-certification outputs to the future cluster, synthesis, evaluation, and promotion tasks without rewriting completed foundation history.

- [ ] **Step 5: Update product documentation**

Document that agents select skills from ordinary outcomes, the portable core routes structured envelopes deterministically, aliases are compatibility-only, the full corpus stays cold, and automatic selection does not expand authority. Report exact certified card and family counts rather than claiming all 4,741 sources are refined.

- [ ] **Step 6: Run complete fresh verification**

Run:

```powershell
npm test
npm run build:routing
npm run build:coverage
git diff --check
git status --short
```

Expected: zero failed and zero skipped tests, deterministic build hashes, clean whitespace validation, no global adapter mutation, and only planned branch files changed.

- [ ] **Step 7: Commit the certified router milestone**

```powershell
git add tests/agent-native-routing-certification.test.mjs receipts/agent-native-router-v1.json README.md docs/superpowers/plans/2026-08-26-eternities-skills-corpus-refinery.md artifacts/routing artifacts/corpus
git commit -m "docs: certify agent-native skill routing"
```

## Execution order and checkpoints

Tasks 1 through 3 are sequential because the index depends on the routing contracts and selector. Task 4 depends on all three. Task 5 may begin only after Task 3 and must integrate against Task 4 before certification. Task 6 touches the live corpus and remains sequential with the already-started agency review and cluster work. Task 7 is the only completion gate.

After Task 7 passes, resume the corpus-refinery plan at semantic clustering. Every subsequent agency, marketing, social-media, game-design, or other family promotion must consume the certified router contract and emit its own routing card before promotion.
