---
name: portable-speech-chunk-alignment
description: Create a renderer-neutral packet that preserves Unicode speech text, explicit pronunciation choices, and inspectable text-to-audio chunk lineage, including declared streaming and cancellation seams.
---

# Portable speech chunk alignment

Use when a text-to-speech or narrated-audio job must preserve the original text, language and pronunciation decisions, and an inspectable mapping from text spans to bounded audio chunks. This is a planning and alignment contract, not a TTS engine, pronunciation authority, audio-quality proof, or provider adapter.

## Contract

Inputs are immutable source text and its byte hash; language or locale per span (or unresolved); explicit pronunciation records keyed to source spans; a chunk policy with permitted boundaries, a render budget, and a normalization profile; and declared renderer capabilities for format, timing, streaming, cancellation, and context overlap.

Produce a packet containing:

- verbatim source text and hash;
- a transformation ledger where every normalization, punctuation change, pronunciation substitution, or unresolved choice records its source span, render span, reason, and reversibility;
- ordered chunks with stable IDs, source ranges, render text, language or locale, pronunciation-record IDs, budget basis, and predecessor or successor;
- an audio receipt for each attempt: renderer identity and version, output hash when available, sample rate and channels, declared time span, completion state, and seam status.

## Method

1. Validate the input encoding and retain the original bytes. Use a declared Unicode normalization profile only when needed; never silently apply compatibility folding. Declare the offset coordinate system, and put boundaries on grapheme-cluster boundaries. Tailor sentence or word boundaries for the language when the default profile is insufficient.
2. Build render text from source spans. Keep spelling, punctuation, numerals, and language unless a recorded policy changes them. Pronunciation alternatives are proposals with stable IDs; preserve the original and mark unknown or disputed readings unresolved. Do not invent phonetics.
3. Split at the strongest available semantic boundary that satisfies the declared renderer budget. If one unit exceeds the budget, mark the forced split and its reason. Never split a grapheme cluster or detach a pronunciation substitution from its covered span.
4. Derive chunk identity from source hash, packet revision, and ordered source range. A retry creates a new attempt under the same chunk identity; changed source or policy creates a new revision.
5. If streaming is supported, every emitted audio interval names its source or chunk range and is non-overlapping in the assembled timeline. Provider-supplied context or overlap may be used only when declared by the renderer; context is not automatically audible output. If overlap, timing, or end flush is unknown, mark the seam unverified. On cancellation, retain partial receipts as cancelled or partial and never promote them to complete audio.
6. Verify coverage: every source span is covered once by a chunk or explicitly excluded; every transform resolves to a source span; chunk order is monotonic; and no completion receipt lacks an attempt, format, or seam state.

## Failure and finish

Stop with `unresolved` when language, pronunciation, renderer budget, timing, or cancellation semantics are missing. Do not substitute a generated preview or model confidence for evidence. Finish with the packet, receipts, known gaps, and a statement of whether runtime audio was actually rendered and inspected.

If the task also requires supplied-media transcription or captions, hand the packet to a media-provenance workflow; this method does not replace that work.
