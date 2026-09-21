# Corpus-overlap pilot review — 2026-09-20

Status: bounded source synthesis review complete. No source was copied, promoted,
executed, indexed, deleted, committed, or pushed.

## Decision frame and boundary

This review covers the five pairs in
`data/corpus-overlap-pilot-2026-09-20/receipt.json` (`requestId`
`gs-overlap-c258f55e-v1`, receipt snapshot
`c258f55e2c3b579a089daee6195d5227acb92cbc050a10078e1a424bf3b44249`). The
receipt was selected from truncated public descriptions, not full bodies: its
selection rule is cross-repository description Jaccard overlap greater than
0.45, with descriptions truncated at 620 characters. Jev abstained on p0–p3
and proposed `equivalent` for p4. That proposal is treated as an input signal,
not as a duplicate verdict.

The review boundary is the exact `SKILL.md` body recorded by each receipt
source identity. Each body was retrieved as raw bytes with `git show
<commit>:<path>` from the checkout named by the repository manifests, and its
SHA256 was computed independently. Full retrieved bodies were read as inert
text. No referenced skill, script, installer, provider, benchmark, or upstream
command was run.

Classification rules used here:

- `exact duplicate`: only a matching raw-body SHA256 qualifies; matching names,
  descriptions, or apparent intent do not.
- `near-duplicate`: the same primary task and materially shared structure or
  guidance, with meaningful additions or constraints that prevent exact
  equivalence.
- `overlapping-but-distinct`: a shared domain, trigger, or neighboring task,
  but materially different inputs, outputs, operating assumptions, or safety
  boundaries.
- `unrelated`: no material shared task after full-body inspection.
- `unresolved`: exact body unavailable, oversized for this review, or
  insufficient evidence to classify.

## Retrieval result

All eight repositories named by the pairs were located through the two pinned
manifests. Every destination existed, was a Git checkout, and had `HEAD` equal
to the manifest `head`; short status showed the expected clean `main` tracking
state. The exact destination, origin, and pinned commit are retained below so
the source ledger is reproducible without relying on mutable working-tree text.

| Repository | Manifest | Pinned checkout | Origin | Pinned head / current HEAD |
| --- | --- | --- | --- | --- |
| `Gentleman-Programming/Gentleman-Skills` | `data/quarry-intake-2026-09-20-web/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\Gentleman-Programming__Gentleman-Skills` | `https://github.com/Gentleman-Programming/Gentleman-Skills.git` | `c8036a37893679dc5e942484975405d39689c63b` / match |
| `himself65/finance-skills` | `data/quarry-intake-2026-09-20-categories/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\himself65__finance-skills` | `https://github.com/himself65/finance-skills.git` | `0a5759bca1ea273790cd45c17fad6a9aff76a7f5` / match |
| `twostraws/Swift-Testing-Agent-Skill` | `data/quarry-intake-2026-09-20-categories/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\twostraws__Swift-Testing-Agent-Skill` | `https://github.com/twostraws/Swift-Testing-Agent-Skill.git` | `2d6bba14a3c8bf3694f218b92fffe617c41ae43e` / match |
| `twostraws/SwiftData-Agent-Skill` | `data/quarry-intake-2026-09-20-categories/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\twostraws__SwiftData-Agent-Skill` | `https://github.com/twostraws/SwiftData-Agent-Skill.git` | `922d989473a9914210b41529a1ac5636aff4b8c1` / match |
| `callstackincubator/agent-skills` | `data/quarry-intake-2026-09-20-web/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\callstackincubator__agent-skills` | `https://github.com/callstackincubator/agent-skills.git` | `61e6e7dfdf3a8ee862254c200d751fcb1fb863dc` / match |
| `lawve-ai/awesome-legal-skills` | `data/quarry-intake-2026-09-20-categories/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\lawve-ai__awesome-legal-skills` | `https://github.com/lawve-ai/awesome-legal-skills.git` | `180fd1582cc56fb0fc122a8e734ff3a1a666b87a` / match |
| `NEU-ZHA/legal-ai-skills` | `data/quarry-intake-2026-09-20-categories/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\NEU-ZHA__legal-ai-skills` | `https://github.com/NEU-ZHA/legal-ai-skills.git` | `1c139e9dfb5312a304eb540cbf8547b9d13fd2a1` / match |
| `aitytech/agentkits-marketing` | `data/quarry-intake-2026-09-20-categories/repositories.json` | `D:\\03-ARSENAL\\warehouse\\from-stars\\aitytech__agentkits-marketing` | `https://github.com/aitytech/agentkits-marketing.git` | `651201edf940a4ce78d36258347835f0bb8f1b9e` / match |

### Exact source ledger

The `receipt SHA256` and `retrieved SHA256` columns are identical for every
record. `Git blob` is the object ID resolved at the recorded commit. `Body
license field` is the license metadata observed inside the retrieved body when
present; `manifest hint` is the repository-level hint, not a per-file legal
determination.

| Pair/side | Exact source identity | Bytes | Git blob | Receipt SHA256 = retrieved SHA256 | Body license field | Manifest hint / recorded license file |
| --- | --- | ---: | --- | --- | --- | --- |
| p0/a | `Gentleman-Programming/Gentleman-Skills@c8036a37893679dc5e942484975405d39689c63b:curated/skill-creator/SKILL.md` | 4,322 | `bcac57a79b785902aabe96b57d6b645e586c8dde` | `6e60e41b41f49c793170c23d77f80cff6d825268f21c1c83d4d676bba06a6aaf` = yes | `Apache-2.0` | `MIT`; `LICENSE` blob `bf7bcbd2a32c3c990464ae2365587f9af6cfa4ed` |
| p0/b | `himself65/finance-skills@0a5759bca1ea273790cd45c17fad6a9aff76a7f5:plugins/skill-creator/skills/skill-creator/SKILL.md` | 12,984 | `8ca1a5e23cdc7dfda7cd0287a28ece80a905ec56` | `b2093073e74450d34cd877ca565c86a5b0cc4ad63177ed8a53db001cc4ff75aa` = yes | not declared | `MIT`; `LICENSE` blob `c51625cfa127c6cb25b37eba98e48fcfceaf561a` |
| p1/a | `twostraws/Swift-Testing-Agent-Skill@2d6bba14a3c8bf3694f218b92fffe617c41ae43e:swift-testing-pro/SKILL.md` | 4,302 | `b26429479c8615d293bd41b23ed0e6a02b2e1ad7` | `ad4f1bff44b5b7fce20b282481e651876efce024d13b16cb969bc433036ac059` = yes | `MIT` | `MIT`; `LICENSE` blob `e9f6fd1f59090753544df5af4edbd524f1aa0f32` |
| p1/b | `twostraws/SwiftData-Agent-Skill@922d989473a9914210b41529a1ac5636aff4b8c1:swiftdata-pro/SKILL.md` | 3,722 | `83735a31b8b58e3d8087e188fc858733807decde` | `79164f3bc4942b8ca384057cbe951ca7715aecee4970bea38781d91ddb1c442e` = yes | `MIT` | `MIT`; `LICENSE` blob `e9f6fd1f59090753544df5af4edbd524f1aa0f32` |
| p2/a | `callstackincubator/agent-skills@61e6e7dfdf3a8ee862254c200d751fcb1fb863dc:plugins/vendored/.agents/skills/react-native-testing/SKILL.md` | 7,315 | `71f7cc1be424f64fed9f6baaef303548d0bef195` | `dea54d1d397cbd271a9ee7f6c09e841bb1aa546d9f2a3ee46fd466275061e6e1` = yes | not declared | `MIT`; `LICENSE` blob `b9dc6bb6fc8378c98b553325e4b4df5a56098c46` |
| p2/b | `Gentleman-Programming/Gentleman-Skills@c8036a37893679dc5e942484975405d39689c63b:community/react-native/SKILL.md` | 9,742 | `20b44cdd36c0081e420474f795d6e768c468d7cd` | `539e32782efa0ecc613be9d14240868446439ea23ee2f18ef7b35bda8b103c3b` = yes | not declared | `MIT`; `LICENSE` blob `bf7bcbd2a32c3c990464ae2365587f9af6cfa4ed` |
| p3/a | `lawve-ai/awesome-legal-skills@180fd1582cc56fb0fc122a8e734ff3a1a666b87a:skills/legal-ai-model-router-stephane-boghossian/skills/route-legal-research/SKILL.md` | 6,249 | `03a6c0f0ef386b20c85290b9eaea87be86227572` | `3191f7b53c8bf0cad48c7ee062d2371c20da6e095370c6aafe2ce95b83c8c807` = yes | `AGPL-3.0-or-later` | `NOASSERTION`; `LICENSE` blob `c741d9203a142f267b0ada2b03a74a64a38a4293` |
| p3/b | `NEU-ZHA/legal-ai-skills@1c139e9dfb5312a304eb540cbf8547b9d13fd2a1:skills/pkulaw-mcp-legal-research/SKILL.md` | 6,981 | `8885df22bbbb376b2e147f4055aba9681f58f6ba` | `ac23e111334bacfe255abb1c62de5c89495a08464b11e360ca7caa166b9c98e0` = yes | `MIT` | `MIT`; `LICENSE` blob `7a078bee857511290d799b33829bd29d0a68dc81`; `NOTICE.md` blob `b2110f3852a00e8f95cebced51cce031329dca0c` |
| p4/a | `lawve-ai/awesome-legal-skills@180fd1582cc56fb0fc122a8e734ff3a1a666b87a:skills/excel-editor-openai/SKILL.md` | 5,392 | `6d024f59e5d3e0aecacfd0f2fbd134dadbbadc52` | `6ab421a54f54dc5382f12081ed16d42095b805d43c1add3e0957a0a3e1e37ef4` = yes | `Apache-2.0` in metadata | `NOASSERTION`; `LICENSE` blob `c741d9203a142f267b0ada2b03a74a64a38a4293` |
| p4/b | `aitytech/agentkits-marketing@651201edf940a4ce78d36258347835f0bb8f1b9e:skills/document-skills/xlsx/SKILL.md` | 11,292 | `4957ec856b57a7e64171e79156592742a359e4c7` | `3316101faba9615e9447928cbdadf52207d6358822fea587b0d90911ce6005f9` = yes | `Proprietary. LICENSE.txt has complete terms` | `MIT`; `LICENSE` blob `0b2df7c5e059b8a66ec17d60603d9e664366ba1d` |

The p3/a, p4/a, and p4/b body-level signals are not interchangeable with the
repository-level hints. In particular, p4/b names a per-skill `LICENSE.txt`
while the manifest records the repository `LICENSE` as MIT. That is a rights
review gate, not a reason to silently normalize the sources.

## Pair findings

### p0 — skill creator guidance

Receipt score: `1.0`; Jev: abstain. Classification: **overlapping-but-distinct**.

Both bodies are named `skill-creator` and address creating agent skills. The
Gentleman body is a compact creation guide centered on when to create a skill,
the directory/template shape, naming and reference conventions, frontmatter,
registration, and a pre-creation checklist. The finance-skills body is a much
larger lifecycle guide covering create, improve, and evaluate modes, runtime
tool/auth detection, architecture choices, reference-file planning, quality
scoring, and mode-specific response templates.

The shared intent is real, but the second body adds evaluation and improvement
behavior and a dynamic-calling doctrine that the first body does not provide;
the first retains Prowler-oriented metadata and a compact registration/template
workflow that the second does not provide. The distinct byte counts and hashes
rule out exact duplication. No merge is justified from this pair.

### p1 — Swift Testing versus SwiftData

Receipt score: `0.8333333333333334`; Jev: abstain. Classification:
**near-duplicate**.

These bodies share a strong scaffold: same author and version metadata, the same
write/review/improve framing, a review-process list, Swift 6.2/concurrency
guidance, a file-oriented output format with before/after examples, and a
references section. Their behavioral cores remain domain-specific. The
Swift-Testing body routes to testing conventions, async tests, confirmations,
actors, UI-test boundaries, and XCTest migration. The SwiftData body routes to
model relationships, predicates, CloudKit, indexing, inheritance, and
SwiftData-specific constraints.

This is a near-duplicate scaffold, not an equivalent capability: swapping the
reference set or domain rules would produce incorrect reviews. Both bodies and
their repository hints say MIT, so a future abstract scaffold could be
license-reviewed, but no direct merge or source-text reuse is authorized here.

### p2 — React Native testing versus general React Native

Receipt score: `0.6666666666666666`; Jev: abstain. Classification:
**overlapping-but-distinct**.

The callstack body is a specialized React Native Testing Library guide: v13/v14
version detection, query priority and variants, async `userEvent`/`fireEvent`,
Jest matchers, role semantics, `waitFor`, fake timers, and provider-wrapped
rendering. The Gentleman body is a general mobile-development guide covering
Expo and bare workflows, project structure, typed components, navigation,
NativeWind, platform-specific code, state/data hooks, safe areas, and general
anti-patterns.

They share the React Native domain and component context, but they have
different triggers, reference surfaces, and expected actions. The general body
does not supply the testing contract; the testing body does not supply the
application-architecture guidance. Both repository hints are MIT, but the
functional boundary remains clear. No merge is justified.

### p3 — legal research model routing versus PKULaw MCP routing

Receipt score: `0.5`; Jev: abstain. Classification:
**overlapping-but-distinct**.

The lawve body is a vendor-neutral model-selection advisor for legal analysis:
it asks about stakes, cost, speed, privacy/jurisdiction/language, uses a
benchmark scorecard, and emits a primary model, fallback, escalation, avoid, and
verification response. The NEU-ZHA body is a Chinese PKULaw-native-MCP route
selector: it chooses among ten retrieval/recognition/validation/linking
services, uses cost tiers, requires evidence before legal citations, and defines
MCP failure fallbacks.

The shared theme is legal-research routing, but the target resource, language
and jurisdiction assumptions, decision inputs, failure modes, and external
integration boundaries are materially different. The body license signals also
differ: p3/a declares AGPL-3.0-or-later while its repository hint is
`NOASSERTION`; p3/b declares MIT and its repository records MIT plus NOTICE.
No merge is justified. The benchmark values recorded in p3/a were not live-
validated in this bounded review and must not be treated as current evidence.

### p4 — spreadsheet processing

Receipt score: `0.45454545454545453`; Jev: proposal `equivalent`.
Classification: **near-duplicate**, but **not exact and not behaviorally
equivalent**.

Both bodies cover spreadsheet creation, reading, editing, analysis, formatting,
formulas, and visualization across common workbook/tabular formats. The lawve
body is a concise tool/workflow guide with openpyxl and pandas selection,
optional rendering checks, formula/reference cautions, cleanup conventions,
citations, and formatting/finance guidance. The AityTech body expands the same
surface with language behavior, zero-formula-error delivery, template
preservation, financial-model color/number rules, formula-first construction,
mandatory recalculation, error scanning, edge-case checks, and extensive
examples.

Those additions change behavior: a merged result would need to decide whether
rendering is optional or required, whether recalculation is mandatory, how
formula errors gate completion, and whether the financial-model conventions
apply universally. License signals further block direct reuse: p4/a metadata
says Apache-2.0 while the repository hint is `NOASSERTION`; p4/b says
Proprietary and points to `LICENSE.txt` while the manifest hint is MIT and
records a root `LICENSE`. Jev's equivalence proposal is therefore not accepted
as an exact-duplicate or promotion decision.

## Bounded synthesis opportunities

These are design-level opportunities only. They do not authorize source-text
copying, capability promotion, index edits, or upstream execution.

1. **p1: factor a neutral review-skill scaffold, retaining two domain leaves.**
   Keep separate Swift Testing and SwiftData trigger clauses, reference maps,
   rules, examples, and output constraints. The shared layer may cover the
   review/intake shape, partial-reference loading, file/line/rule findings,
   before/after presentation, and prioritized summary. Required behavioral
   tests before any future implementation: Swift Testing prompts select only
   testing references; SwiftData prompts select only data references; mixed
   prompts either load both explicitly or ask for a boundary; partial work
   never loads unrelated references; domain-negative cases reject SwiftData
   advice in a testing-only task and vice versa; output always preserves the
   file/line/rule/before-after/priority contract. Both source hints are MIT, but
   per-file provenance and attribution still need an explicit decision.

2. **p4: compare a spreadsheet task router with a strict validation profile,
   without merging bodies.** Keep the common task taxonomy (create, read,
   edit, analyze, visualize) separate from optional visual review and from the
   stricter formula/recalculation/financial-model profile. Required behavioral
   tests before any future implementation: dispatch `.xlsx`, `.xlsm`, `.csv`,
   and `.tsv` correctly; preserve formulas during edits; detect formula errors;
   enforce recalculation when the strict profile is selected; retain existing
   template formatting; require source documentation for hardcodes; and make
   visual review status explicit rather than inferred. This opportunity is
   **deferred pending per-file license reconciliation** because the two bodies'
   license metadata and manifest hints do not agree.

No bounded synthesis opportunity is recommended for p0, p2, or p3: their
neighboring names or domains do not overcome the different primary behaviors,
and p3 additionally carries incompatible/unclear license signals.

## Counts and disposition

| Disposition | Pairs |
| --- | ---: |
| Exact duplicate | 0 |
| Near-duplicate | 2 (p1, p4) |
| Overlapping-but-distinct | 3 (p0, p2, p3) |
| Unrelated | 0 |
| Unresolved | 0 |

Additional checks: 5 pairs reviewed; 10/10 exact Git blobs retrieved; 10/10
receipt SHA256 values independently matched; 8/8 pinned checkouts located and
manifest-head matched; 0 bodies oversized or unavailable; 0 upstream commands,
scripts, tests, providers, or subagents used. The bounded conclusion is that no
direct merge or capability promotion is justified by this pilot.

## Evidence limits and handoff

This document records source-level overlap only. It does not establish source
quality, runtime behavior, benchmark currency, legal rights to combine
per-file content, or production suitability. The parent orchestration and
deterministic inventory remain authoritative for their own receipts and counts.
Refreshing a verdict would require re-pinning the intended commits, rechecking
the receipt snapshot, and resolving the p3/p4 per-file license questions before
any synthesis or promotion decision.
