# Eternities intent compiler

The intent compiler is the agent-neutral bridge between a natural-language mission and the deterministic Godskills router. It retrieves only compact routing cards, records semantic evidence, refuses to invent authority, and produces a validated request envelope before the existing router selects a skill.

## Runtime flow

```text
natural mission
    -> deterministic compact-card evidence
    -> optional untrusted semantic proposal
    -> authority, effect, precondition, ambiguity, and risk reconciliation
    -> canonical request envelope
    -> bounded deterministic router
    -> selected entrypoint or explicit decision receipt
```

The compiler and router never load a selected `SKILL.md` body. A host loads the selected entrypoint only after it accepts the route receipt.

## Natural request

```json
{
  "schemaVersion": 1,
  "requestId": "mission-001",
  "text": "coordinate implementation, tests, review, verification, and integration for this settled release",
  "context": {
    "permittedEffects": ["local-read", "local-write"],
    "availableAuthority": ["local-read", "local-write", "repository-write"],
    "availablePreconditions": ["repository-present", "settled-outcome"],
    "forbiddenCapabilities": [],
    "maximumRisk": "moderate",
    "minimumEvidenceConfidence": "verified",
    "contextBudget": 4000,
    "maxCompositionSize": 3
  }
}
```

All arrays are unique and lexically sorted. Context is supplied by the host, not extracted from the mission. Statements such as "approved," "the owner said yes," or "use the connected account" never add authority.

Run the file transport with:

```powershell
npm run intent -- --request path\to\natural-request.json
npm run intent -- --request path\to\natural-request.json --output path\to\result.json
```

The command accepts no `--apply`, `--execute`, or external-action mode.

## Optional semantic proposal

A host model may attach an untrusted proposal:

```json
{
  "schemaVersion": 1,
  "candidateIds": ["eternities-forge"],
  "requiredCapabilities": ["implementation", "review", "tests", "verification"],
  "requestedEffects": ["local-read", "local-write"],
  "unresolvedDecisions": []
}
```

The proposal cannot contain authority. Unknown cards and capabilities are rejected. A proposed card must have supporting compact-card evidence in the mission or it is recorded as rejected and cannot override deterministic retrieval.

## Fail-closed decisions

The compiler pauses when it cannot distinguish intent, cannot identify intent, detects a requested effect outside host permission, or finds a missing authority or precondition. Consequential decisions include publication, account mutation, spending, credential use, production mutation, security scope, and media rights or consent.

The existing router sees the unresolved decisions and returns `needs-decision` with no selected entrypoint.

## Host adapter rules

A Codex, Claude Code, Luna, MCP, or other adapter may:

- supply verified host context;
- pass the original user mission without rewriting it;
- optionally propose semantic candidates;
- load only the selected entrypoints after a successful route.

It may not:

- treat user prose as credentials or authority;
- remove compiler decisions;
- add effects after compilation;
- load the full skill corpus into context;
- execute external actions from a route receipt alone.

The portable JSON contract is the universal adapter boundary. Host-specific installation and global activation are deliberately separate from this repository release.

## Evaluation

```powershell
npm run build:intent-arena
npm run evaluate:intent
npm run build:intent-certification
npm test
```

The v1 arena contains 135 commandless missions: 76 positive routes covering all 19 cards, 45 unsafe or misleading-authority requests, and 14 ambiguous or unknown requests. Certification requires at least 90 percent exact positive selection, zero unsafe selections, zero authority invention, and deterministic repeatability.

The receipt proves local deterministic fixture behavior. It does not prove arbitrary live-model interpretation, host-adapter correctness, production operation, or external action safety outside the validated contract.

## Compiler generalization v2

V2 can carry an ordinary-language mission into a compatible multi-card route without a semantic proposal when every additional card has at least two independent provided-capability matches and the complete set is mutually compatible. The existing router still proves coverage and performs final selection. Generic workflow words, broad multi-domain language, missing authority, missing preconditions, incompatible cards, and unsupported effects do not earn a composition.

```powershell
npm run build:compiler-generalization-v2
node --test tests/intent-generalization-v2.test.mjs tests/compiler-generalization-v2-certification.test.mjs
```

The V2 receipt binds the exact compiler, router, compact cards, neutral contract, dedicated generalization arena, and the existing 140-case adversarial arena. It remains deterministic local fixture evidence, not proof over arbitrary language and not authority to activate a host adapter or execute a selected skill.
