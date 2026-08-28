# skill supply-chain defense design

## purpose

add a dependency-free first-party trust gate between inert skill acquisition and semantic promotion. the gate must detect strong malicious or deceptive evidence without executing target code, while refusing to equate documented sensitive capability with malware.

## authority and scope

the scanner has local-read effects only. it accepts one canonical skill root, never follows symbolic links, never imports target modules, never invokes package managers or target commands, and never performs network access. its output is evidence for Aegis and the refinery, not user authority and not an automatic installation decision.

## neutral capability contract

- intent: inspect an untrusted agent skill as inert data and decide what review gate must come next.
- success: every inspected file is bounded and source-labeled; critical combinations are rejected before indexing; sensitive or ambiguous behavior requires semantic review; a clean static result remains only clear for semantic review.
- inputs: canonical skill root, optional declared purpose and permissions, scan budgets.
- outputs: deterministic manifest, evidence findings, inferred sensitive surfaces, static disposition, semantic-review requirements, and proof digest.
- effects: local read only.
- exclusions: malware removal, runtime sandboxing, legal clearance, reputation scoring, provider claims, target execution, dependency installation, and automatic activation.

## architecture

### inert scanner

`src/skill-supply-chain-defense.mjs` owns canonical traversal, budgets, file classification, evidence rules, deterministic deduplication, and static disposition. it reads regular files only and rejects symlinks, escaped paths, unsupported special files, exceeded budgets, and unreadable required entrypoints.

rules identify evidence combinations rather than isolated words:

- decoded or obfuscated payload plus dynamic execution;
- remote acquisition plus shell or interpreter execution;
- credential or agent-state access plus external transmission;
- startup, scheduler, registry, profile, or self-rewrite persistence;
- destructive command construction or forceful broad deletion;
- instruction-boundary attacks, hidden prompt replacement, or system-prompt extraction;
- declared-purpose or permission mismatch against observed shell, network, credential, persistence, destructive, and external-write surfaces.

single sensitive primitives such as `subprocess`, network clients, or shell commands create review evidence but do not independently prove malice. line evidence is bounded and secret-like values are redacted.

### verdict lattice

- `reject-before-indexing`: structural escape, obfuscated execution, credential exfiltration, deceptive persistence, destructive hidden behavior, or another critical combination.
- `manual-review-required`: sensitive surfaces, purpose mismatch, permission mismatch, incomplete inspection, or high-confidence suspicious evidence that lacks a critical combination.
- `clear-for-semantic-review`: bounded scan completed with no critical/high evidence. this is not `APPROVE`.

semantic review is mandatory before any source can support synthesis or promotion. its record covers purpose fit, permission fit, external transmission, execution, persistence, prompt behavior, trigger scope, dependencies, and user control. only Aegis reconciliation can issue `APPROVE`, `CAUTION`, or `REJECT`.

### quarry ledger

`scripts/build-skill-security-ledger.mjs` scans the Wave 2 source records and writes deterministic source-level evidence without mutating the acquired repositories. the ledger records source id, exact body digest, static disposition, finding counts, and scan digest. the acquisition receipt remains historical evidence and is not rewritten.

### Aegis extension

Aegis gains a `skill-supply-chain` route. the route consumes static evidence plus semantic review, preserves scanner uncertainty, and blocks promotion when evidence is missing, stale, rejected, or bound to different source bytes. it never activates a skill.

## provenance

the selected pattern source is `NVIDIA/SkillSpector@1b875933a666b627c3ed1b695f066a21a6773dc4:skills/skill-inspector/SKILL.md`, Apache-2.0, disposition `independent-implementation`. useful mechanisms are independent static and semantic review lines, contextual finding interpretation, purpose and permission fit, explicit sensitive surfaces, and fail-closed unexplained critical findings. no source prose or implementation is copied, and no third-party code is executed.

## verification

tests must prove:

1. canonical traversal rejects lexical and real-path escape, symlinks, special files, and budget overflow;
2. known malicious fixtures trigger `reject-before-indexing`;
3. a documented shell-using skill does not become an automatic rejection;
4. purpose and permission mismatch require manual review;
5. findings, ordering, redaction, and digests are deterministic;
6. stale semantic review cannot satisfy the promotion gate;
7. Aegis routes skill trust review while preserving every existing route and refusal;
8. the Wave 2 ledger reconciles exact source ids and body digests;
9. the full repository suite and existing intent arena remain green.

## proof limits

static evidence cannot prove absence of malicious intent, detect every novel attack, or replace sandboxing and human judgment. fixture performance is not production safety. a clean scan means only that no covered evidence crossed the configured threshold.
