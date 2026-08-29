# Lunari First-Party Quarry Specification

## Goal

Turn the archived Claude engineering workspace into compact, reproducible first-party evidence for Eternities Godskills without loading raw transcripts, secrets, generated files, repository internals, or project-specific deployment commands into agent context.

## Source boundary

The canonical archive is `D:\05-BACKUP-BUNDLE\04-session-workspaces\desktop-lunari`.
Its Git head is recorded when the quarry is built, but the archived working snapshot is also material because later Claude skills and edits are not necessarily committed. The builder inventories the union of present working files and the head tree, preserves whether each path is present, head-only, modified, or untracked, and never mutates the archive.

Nested `.git` internals, vendored repositories, dependency trees, build output, media, lockfiles, logs, raw session material, local settings, credentials, and secret-shaped paths are terminal exclusions. Excluded rows retain only safe path metadata, size when available, and exclusion reason. Their contents are never read into evidence cards.

## Evidence model

The builder emits deterministic artifacts under `artifacts/lunari-first-party-quarry`:

- `coverage-ledger.jsonl`: one path-ordered row for every inventoried source path;
- `candidate-cards.jsonl`: bounded structural evidence for reusable first-party workflows and mechanisms;
- `duplicate-groups.json`: exact content groups and matches against the existing certified quarry or live Godskills;
- `owner-map.json`: candidate-to-Godskill recommendations with lexical evidence and an explicit review state;
- `coverage.json`: counts, source identity, input and artifact digests, exclusions, and unresolved rows.

Text evidence is capped per file. Cards retain path, digest, byte count, headings, exported or declared symbols, matched mechanism terms, recommended owner, and review state. They do not retain source prose. A recommendation is discovery evidence, not promotion.

## Capability disposition

The first review wave promotes only recurring mechanisms that close confirmed gaps:

1. Forge gains evidence-weighted independent-lens synthesis, goal-backward wiring proof, and collision-safe shared-tree coordination.
2. Phoenix gains measurement-before-hypothesis diagnosis, an append-only eliminated-hypothesis ledger, and bounded stall termination.
3. Atlas gains schema-first verification, coverage-before-ranking, additive migration proof, and post-change structural checks.

Existing owners remain authoritative for continuity, release planning, writing, visual design, and project-specific deployment. The archive's `keel-wake`, frontend ship, backend deploy, voice, and local project conventions remain provenance evidence or project-specific references rather than duplicate universal skills.

## Safety and proof limits

- no source instruction, hook, binary, package script, or archived code is executed;
- no secret-shaped or local-settings content is read;
- no source prose is copied into promoted skills;
- no external action, deployment, profile activation, or global installation occurs;
- deterministic tests prove inventory, exclusion, deduplication, routing, and artifact integrity only;
- the promotion receipt cannot claim live-agent superiority, exhaustive semantic recovery, production correctness, or literal perfection.

## Acceptance

The work is complete when the archive union is inventoried with zero unresolved paths, secret and transcript fixtures remain unread, exact duplicates are grouped, every candidate has one bounded owner disposition, the three owner extensions pass focused tests, the promotion receipt binds exact current bytes, and the full project suite passes.
