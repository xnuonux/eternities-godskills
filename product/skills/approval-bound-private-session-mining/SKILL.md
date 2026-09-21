---
name: approval-bound-private-session-mining
description: Use when an explicitly approved private transcript export must be mined for a named question with minimization, source labels, redaction, and retention evidence.
---

# Approval-bound private session mining

Use this entrypoint for a bounded analysis of private session exports that the user has explicitly placed in scope. It turns a fixed source set into a minimized evidence ledger; it is not a route for ambient monitoring, identity inference, or cross-user discovery.

## Freeze the question and source set

Write the question in one sentence and record the approved purpose, owner, date or file range, permitted output, retention rule, and revocation instruction. Build a manifest of the exact files or export records before reading broadly. Preserve source identifiers and byte or content digests where available, but do not copy private content into a manifest unnecessarily.

If ownership, approval, retention, or the boundary between relevant and unrelated material is ambiguous, stop and report the missing fact. A broad statement such as “use my history” does not silently authorize another person's transcript, an unrelated project, or a new purpose.

## Mine with minimization

1. Work from the manifest and exclude records outside the question before semantic extraction.
2. Redact credentials, tokens, private contact details, precise secrets, and unrelated personal traits before creating a working corpus. Keep the redaction category and source locator, not the secret.
3. For each finding, record a source locator, a short minimized statement, whether it is directly stated or inferred, confidence, and the reason it answers the question. Keep multiple contradictory source observations instead of resolving them by tone.
4. Deduplicate repeated exports without erasing chronology. Mark edited, truncated, missing, or machine-generated portions as uncertainty.
5. Maintain a separate exclusions and ambiguity ledger. This prevents a clean-looking summary from hiding that a conclusion depended on omitted or revoked material.

The useful artifact is usually a table with finding, source reference, evidence class, confidence, redactions, and permitted use. Include only the minimum excerpt needed to audit a claim. Do not transform a transcript into a profile when the question asks for a workflow pattern.

## Retention and finish

Record which source files, derived ledgers, redaction maps, and temporary material remain, where they are stored within the authorized workspace, and how revocation will remove or invalidate them. If approval is withdrawn, stop analysis, mark affected findings revoked, and follow the stated deletion or quarantine rule. Do not transmit private content or use a finding for a new purpose without a new scope decision.

Finish when every retained finding is traceable to the approved set, unrelated material is excluded, redactions are recorded, ambiguity is visible, and the retention receipt is complete. A source-labeled ledger is evidence of extraction, not proof that an inferred pattern is true outside the observed sessions.

## Common failure modes

- Searching an entire history because the first export was inconvenient.
- Keeping raw secrets in “temporary” debug output.
- Treating a speaker guess or inference as a source-stated fact.
- Collapsing conflicting sessions into one confident narrative.
- Leaving derived summaries alive after a source is revoked.
