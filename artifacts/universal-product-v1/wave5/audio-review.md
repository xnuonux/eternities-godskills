# Wave 5 audio review — bounded Godskills refinement sidecar

Date: 2026-09-21  
Workspace: `C:\dev\eternities-godskills\.worktrees\universal-product-v1`  
Scope: only `artifacts/universal-product-v1/wave5/audio-review.md` and new files under `artifacts/universal-product-v1/wave5/audio-draft/`.

## Decision receipt

One new standalone method is drafted: `portable-speech-chunk-alignment`. It is a renderer-neutral text/chunk alignment packet for speech work. It is intentionally not a product catalog entry, owner edit, provider adapter, audio generator, or DSP qualification. A standalone draft is the narrower fit because the method owns the seam between text/provenance and rendering, while the existing Orpheus entrypoint already owns broad supplied-media provenance and alignment.

Maturity: draft and instruction-reviewed; runtime evaluation unavailable. No source code from the three quarantined bodies was executed. No external synthesis API, TTS provider, audio generation, upload, publication, catalog mutation, product edit, test file, or commit was performed.

The initial inventory showed unrelated worktree changes, and a later inventory also showed additional unowned product and wave5 changes. Every status entry outside the two target paths was left untouched and is not part of this sidecar.

## Neutral contract

Outcome: produce an audit-ready packet mapping immutable multilingual speech text and explicit pronunciation decisions to bounded audio chunks, with enough lineage to explain normalization, chunk boundaries, render attempts, streaming seams, and cancellation without silently changing the source.

Success evidence is structural and receipt-based: original text bytes and hash retained; every transform has a source/render span and reason; language or locale is declared or unresolved; chunks cover each source span exactly once or record an exclusion; IDs and revisions distinguish retries from changed inputs; audio receipts identify attempt, format, timing, completion, and seam state; and unsupported renderer behavior remains unresolved.

Inputs are source text, source identity, language/locale spans, pronunciation records, normalization and boundary policy, renderer budget/capabilities, and any existing timing or audio receipts. Outputs are the source manifest, transform ledger, ordered chunk plan, attempt receipts, coverage result, and explicit gaps. The method may create a local plan or receipt only; it does not authorize provider calls, publication, or claims about audible quality.

Operations are: retain original bytes; apply only declared language-aware transformations; preserve a reversible span map where possible; segment at grapheme-safe semantic boundaries under a declared budget; bind stable chunk identity to source hash/revision/range; record optional renderer-declared stream context and non-overlapping emitted intervals; retain cancelled or partial attempts as non-complete; then check coverage and receipt completeness.

Positive triggers are bounded TTS preparation, multilingual narration chunking, pronunciation-preserving re-render planning, and text-to-audio lineage review. Negative triggers are DSP callback or signal-graph review, speaker identity or consent, voice conversion, authenticity, provider selection, or audible-quality certification. Dependencies are a readable source, a declared Unicode/profile policy, pronunciation authority when a reading is uncertain, and renderer capabilities when timing or streaming is claimed.

Failure modes include invalid or unavailable source encoding, unknown language, disputed pronunciation, a forced split beyond the declared budget, missing timing, unknown seam/cancellation behavior, stale revision, incomplete receipt, and partial/cancelled output. Termination is `complete` only for a structurally closed packet; otherwise stop with `unresolved`, `partial`, or `cancelled` and preserve the reason.

## Source resolution and hash ledger

The family packet resolved the requested IDs by `bodySha256`; the corresponding metadata records are in `data/quarry-intake-2026-09-21-exa/sources.jsonl` at lines 1933, 2281, and 2429. The family packet records the same ID/hash/source binding at `data/universal-product-v1/family-packet.json:1226-1231`, `:3080-3085`, and `:3197-3202`.

| ID | Resolved body | Declared / observed bytes | SHA-256 verification | Intake license metadata | Disposition |
| --- | --- | ---: | --- | --- | --- |
| `r0100` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\kjuhwa__skills-hub\skills\inference\streaming-tts-prefix-overlap-chunks\SKILL.md` | 4,086 / 4,086 | `2a9af4ae54981270574a96bce6ec30c72cbf53c516845d757912aff5d99a38ab` — match | MIT License; `cold-unreviewed`; activation `none` | Pattern reference only |
| `r0306` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\kjuhwa__skills-hub\skills\text-normalization\multilingual-tts-text-normalize-and-split\SKILL.md` | 4,482 / 4,482 | `7ebba7c1eb4df1bf65da2eff838d602e6d650235ba99bfb296984b250445b2cf` — match | MIT License; `cold-unreviewed`; activation `none` | Pattern reference only |
| `r0319` | `D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\leynos__visual-storytelling-skills\skills\phoneticize\SKILL.md` | 10,419 / 10,419 | `897545d4de613f68451d332c7b5cc7e3926f113d0c53ee931925ca16e622c8bd` — match | ISC License; `cold-unreviewed`; activation `none` | Pattern reference only |

The three bodies were read in full after hash verification: 103, 137, and 254 raw lines respectively. The intake license names are metadata, not legal clearance. There is a provenance conflict worth retaining: the first two body frontmatters identify an upstream VoxCPM project, while the resolved intake `sourceId` is a `kjuhwa/skills-hub` path; the third has a separate repository identity. This supports pattern-level use only and excludes copying, activation, or a legal conclusion.

## Mechanism comparison and disposition

| Candidate | Retained | Rejected or bounded |
| --- | --- | --- |
| `r0100` streaming overlap | Explicit source/timeline intervals, a declared context-versus-emitted distinction, final flush state, and a seam that can remain unverified. | The model-specific repeated-prefix window, patch counts, numeric default, tail-slice formula, uniform-duration assumption, and implementation code. No universal overlap algorithm is promoted. |
| `r0306` multilingual normalization/splitting | Language-aware policy, explicit transformation lineage, semantic boundary preference, and a declared renderer budget. | `wetext`/`inflect` dependencies, a fixed CJK percentage heuristic, character/word counts as universal token budgets, and delimiter-lossy regex splitting. The draft preserves punctuation and requires a profile. |
| `r0319` pronunciation preparation | Hazard records, stable IDs, contextual fragments, explicit acceptance/revision, and unresolved readings. | Higgsfield/Eleven-specific calls, vendor-specific respelling or SSML behavior, preview generation, mandatory user loops, and any guessed phonetic form. |

The retained mechanisms are independently re-authored around the contract. No source paragraph, code sample, model default, or vendor behavior is promoted as a portable rule.

## Existing product entrypoints compared

Both full product entrypoints were read. Current hashes are:

- `product/skills/eternities-orpheus/SKILL.md`: 3,105 bytes, SHA-256 `083f4461cf7a28dd5a2b25bd3e2c2d05448b74b92aaa5d87b5daa50753c2c48e`.
- `product/skills/audio-dsp-integrity-review/SKILL.md`: 3,487 bytes, SHA-256 `425578dda01d430310f6626e2658ee35c5358d952a03ad59220bb1940dab2b23`.

Orpheus supplies the governing boundaries for provenance, exact transcript text, language, timing, supplied speaker labels, uncertainty, transformation labels, local artifacts, and the distinction between a local artifact and provider invocation. The new method narrows those principles to a portable text-to-audio packet with source ranges, pronunciation records, chunk revisions, and stream/cancellation receipts. It does not replace Orpheus.

Audio DSP integrity review supplies a useful proof boundary: deadline safety, numeric integrity, and signal-graph integrity are separate evidence lanes, and static review does not prove glitch-free execution or audible quality. It is not a source of the new text method and is not invoked for a code or signal-graph review here. Any renderer/DSP quality claim remains outside this sidecar.

## Draft design

The single draft is `artifacts/universal-product-v1/wave5/audio-draft/portable-speech-chunk-alignment.SKILL.md`. It preserves original bytes and declared coordinate systems, keeps language and pronunciation changes explicit, makes forced splits visible, gives retries new attempt IDs without changing chunk identity, and treats overlap/context, timing, end flush, and cancellation as renderer-declared semantics. It explicitly refuses to generalize the `r0100` repeated-prefix trick.

The draft is fresh prose and contains one short conditional handoff to a media-provenance workflow. Its complete word count and digest are recorded in the structural result below.

## Direct, paraphrase, exclusion, conflict, and boundary checks

No executable checker or runtime renderer was available or appropriate; the source bodies remained inert. The following cases were checked against the draft contract and routing text:

| Case | Expected disposition | Observed static result |
| --- | --- | --- |
| Direct: multilingual text with combining marks, a locale span, and one explicit pronunciation record | Retain exact source, map render text to source spans, keep grapheme-safe boundaries, and carry the pronunciation ID | Covered by the contract/method; no hidden rewrite or guessed pronunciation found |
| Paraphrase: “prepare a narration for bounded multilingual rendering and let me trace each audio chunk back to the script” | Route to the new method even without the method name | Description and positive triggers match the paraphrased intent |
| Exclusion: “prove this callback is glitch-free” or “review the filter’s feedback stability” | Route to DSP integrity review; do not claim speech-packet completion | Negative trigger and DSP proof boundary are explicit |
| Conflict: intake metadata points to `kjuhwa/skills-hub`, while source frontmatter names VoxCPM | Preserve the mismatch and license uncertainty; use only as a pattern reference | Conflict is recorded; no legal or upstream identity claim is made |
| Boundary: cancellation after a streamed chunk, unknown overlap, or a unit larger than budget | Preserve partial/cancelled state, mark seam unverified, or record a forced split; never call it complete | Failure and stream/cancellation clauses cover all three |

These are contract-level cases, not agent-performance or audio-quality evidence. They were not rendered, listened to, or exercised through a provider.

## Primary technical references

The Unicode Consortium’s [UAX #15, Unicode Normalization Forms](https://www.unicode.org/reports/tr15/) was consulted for canonical versus compatibility equivalence and the warning that compatibility normalization can erase meaningful distinctions. The [UAX #29, Unicode Text Segmentation](https://www.unicode.org/reports/tr29/) was consulted for grapheme-cluster, word, and sentence boundaries, the need for locale tailoring, and the fact that boundaries should not be placed inside grapheme clusters. These references support retaining original text, declaring normalization, and avoiding fixed script heuristics; they do not establish any renderer’s token budget or audio seam behavior.

## Structural result and limits

The intended structural gates are: exactly one new draft under `audio-draft/`; draft frontmatter present; draft word count at or below 650; no source-specific model, library, provider, or repeated-prefix parameter in the draft; and all required contract/uncertainty terms present. Observed static result: the draft is 550 words, 3,818 bytes, 34 lines, and SHA-256 `7d062473fe2eda3b6e8a2d0f248639c831961c7d7d2f8dc23d79f6b51a063fef`. Runtime evaluation is unavailable. No Unicode conformance suite, locale matrix, renderer budget probe, stream seam test, cancellation test, sample-rate/channel check, audio render, or listening review was run.

Current state is therefore `draft / instruction-reviewed / not runtime-evaluated`. Adoption would require an independent consumer exercise and renderer-specific tests before catalog promotion or any claim about language fidelity, pronunciation, seam continuity, latency, or audible quality.
