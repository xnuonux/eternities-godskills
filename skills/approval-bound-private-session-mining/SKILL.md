---
name: approval-bound-private-session-mining
description: "Use when explicitly authorized private session exports must be mined for source-labeled patterns under a fixed scope. Do not use for ambient surveillance or cross-user access."
---

# Approval-bound private session mining

Extract bounded evidence from approved private transcripts while preserving provenance, minimization, redaction, and revocation boundaries.

## use when

- Mine an explicitly approved private session export for a named question.
- Build a source-labeled pattern ledger from a bounded transcript set.

## do not use when

- Access private sessions without explicit scope and approval.
- Infer identity secrets or unrelated personal traits.

## inputs

- approved transcript manifest and purpose
- redaction and retention policy
- specific extraction questions

## preconditions

- approval names the private scope purpose and retention
- the transcript set belongs to the authorized user or project

## workflow

1. freeze approved file and date scope
2. minimize and redact content before analysis
3. extract source-labeled findings with confidence
4. record exclusions unresolved ambiguity and revocation handling

## outputs

- minimized source-labeled evidence ledger
- scope redaction and retention receipt

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, private-data-read
allowed effects: read, write
forbidden effects: cross-user-access, external-write, secret-extraction

## failure behavior

- stop when approval scope or ownership is ambiguous
- exclude content unrelated to the named question

## exclusions

- does not monitor live conversations
- does not transmit private content

## termination

Stop when every finding is source-labeled within the approved scope and the minimization and retention receipt is complete.
