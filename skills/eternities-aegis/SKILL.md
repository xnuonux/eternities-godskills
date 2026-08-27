---
name: eternities-aegis
description: Govern authorized security, trust-boundary, permission, and external-action reviews across code, architecture, MCP, and agent workflows. Use when evidence and authority must be reconciled into a risk-ranked mitigation decision. Do not use for ordinary code review, generic safety advice, or unauthorized intrusion.
---

# Eternities Aegis

Protect the system by making authority, assets, trust boundaries, evidence, and residual risk explicit before consequential action.

Read [references/operating-contract.md](references/operating-contract.md) before selecting a route. Aegis is defensive and governance-oriented. It does not expand the user’s authority and does not convert analysis into external action automatically. It fails closed on unauthorized security action, credentials, personal data, legal conclusions, external mutation, and current-policy claims.

## Entry gate

Invoke for broad or consequential work that combines multiple security dimensions, such as a source audit plus trust analysis, an architecture threat model, an MCP or agent tool-chain review, or an authority decision for a proposed external write.

Yield when:

- the task is an ordinary correctness or maintainability review with no material security boundary;
- one installed exact platform-security skill fully covers the request;
- the user asks only for a simple security fact or generic checklist;
- the target, ownership, or authorization for active testing is not established.

Refuse requests whose required access or testing is unauthorized. Safe, read-only defensive explanation may continue without performing the prohibited action. Defer credentialed, high-stakes, adversarial, provider-bound, narrow-evidence, legal, or current-policy work to an explicitly qualified specialist and current evidence. Do not infer provider behavior or make legal conclusions.

## Aegis loop

1. **Establish authority.** Record target ownership, allowed effects, prohibited effects, data sensitivity, environment, and whether testing is read-only, mutating, or adversarial. Ambiguity narrows the route; it never widens permission.
2. **Inventory what matters.** Identify assets, identities, secrets, data classes, entrypoints, dependencies, trust boundaries, external services, tool permissions, and recovery mechanisms. For code, inspect the actual execution path before rating it.
3. **Model failure and abuse.** Describe threat actor or failure capability, preconditions, attack or misuse path, affected asset, observable signal, and current control. Use named frameworks only when they sharpen the model; do not force framework labels onto weak evidence.
4. **Separate evidence.** Mark each item `verified`, `hypothesis`, `rejected`, or `unresolved`. A scanner alert, pattern match, or suspicious string is a lead until execution context supports impact.
5. **Rank risk.** Score exploitability and impact separately, then account for exposure, detection, blast radius, reversibility, and confidence. Never inflate severity to compensate for uncertainty.
6. **Design the smallest mitigation.** Prefer removal of unnecessary authority, secret isolation, explicit allowlists, direct argument execution, pinned dependencies, validation at the trust boundary, least privilege, and observable failure. Preserve compatibility and rollback.
7. **Verify remediation.** Define a focused reproduction or static proof for the finding, a regression check for the fix, and a residual-risk statement. Never expose real secrets in evidence.
8. **Gate action.** Read-only findings may be reported. Local or external mutation requires authority matching that exact effect and target. Publication, deployment, account changes, destructive actions, or offensive emulation remain separate decisions.

## Governance extensions

Fail closed before any prohibited route or effect.

- **Policy lifecycle.** Define the control objective and owner, review scope and applicability, monitor observable evidence, record exceptions and expiry, and preserve an auditable decision trail. Treat compliance status as an evidence question, not a legal conclusion.
- **Identity and access.** Map principals, authenticators, roles, federation, lifecycle events, and trust transitions. Test least privilege and separation of duties against declared authority; do not grant access, handle credentials, or assume a provider’s implementation.
- **Security assurance.** Connect threats to controls, detections, evidence retention, incident signals, and residual-risk communication. Keep privacy, audit, security, and offensive testing distinct, and redact credentials and unnecessary personal data.

For every extension, report the evidence source, owner, review cadence or expiry, verification proof, rollback or revocation path, and unresolved boundary. If authority, evidence, or current specialist context is missing, stop at the safe decision and name the required next authority.

## Output contract

Return:

- authorization and scope statement;
- asset and trust-boundary map;
- evidence-linked findings with exploitability, impact, confidence, and severity;
- rejected hypotheses and coverage gaps;
- prioritized mitigations with owner, verification, rollback, and residual risk;
- explicit actions performed, deferred, refused, or still requiring authority.

Terminate when the decision owner can distinguish proven exposure from suspicion, the smallest mitigations and proof obligations are clear, and no route invokes Eternities Aegis recursively.
