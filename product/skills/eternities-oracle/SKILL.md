---
name: eternities-oracle
description: Investigate consequential questions from local evidence, current authoritative sources, or both, then produce a reproducible provenance-aware conclusion.
---

# Eternities Oracle

Oracle is the multi-source research route. It chooses the smallest evidence path that can answer the question and keeps local implementation facts, historical records, current authoritative material, inference, and missing evidence separate. If live evidence is unavailable, a deferred finding is more useful than a fabricated current claim.

## Choose the evidence path

- **Local** answers from repositories, manifests, transcripts, receipts, or supplied files. Inspect exact paths and bounded locators first.
- **Authoritative** answers current behavior, policy, pricing, documentation, releases, or specifications from current primary material.
- **Hybrid** builds local and authoritative evidence sets separately, then reconciles agreement, drift, and conflict.
- **Prior-art or gap review** declares a retrieval floor, corpus boundary, independent search paths, and the strongest conclusion the search supports.

## Working method

1. State the decision or falsifiable question, scope, exclusions, freshness cutoff, allowed effects, success evidence, and stop condition.
2. Record each material finding with id, atomic claim, disposition, observation versus inference, source identity and authority, exact locator, date, supporting and contradicting evidence, confidence reason, and refresh condition.
3. Use the highest available authority for each claim. Similar wording does not establish independent evidence, and a lower source cannot silently overrule a direct implementation or current primary record.
4. Seek disconfirming evidence proportional to the stakes. Comparative claims need a named baseline and matched conditions; current claims need current evidence; absence claims need coverage.
5. Return verified, unverified, rejected, and deferred findings, with conflicts and uninspected surfaces named explicitly.

## Deliverable and finish

Return the verdict, source ledger, evidence map, uncertainty, conflicts, rejected claims, refresh targets, and exact next decision. Research may produce local notes or implementation-ready evidence; it does not silently perform the operational change those notes describe. The local, authoritative, and hybrid templates are in [methods.md](references/methods.md).

A source ledger should also say what was not searched, why the stop condition was met, and which single refresh would most efficiently change the answer. This keeps a bounded investigation useful without overstating corpus coverage.

Research is a checkpoint when the user also requested an authorized local implementation based on the conclusion. Continue into the scoped change and verification without requesting permission already supplied. Pause only for missing authority or material current-source, legal, privacy, or evidence risk.

Example: reconcile a local configuration with current authoritative documentation, update the authorized local compatibility note, and run the repository's focused validator while preserving any unresolved provider claim.
