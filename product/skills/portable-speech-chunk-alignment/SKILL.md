---
name: portable-speech-chunk-alignment
description: Prepare multilingual speech chunks with pronunciation decisions, Unicode-safe boundaries and traceable text-to-audio lineage, including partial or cancelled output.
---

# Portable speech chunk alignment

Use for bounded narration or text-to-speech preparation when text changes, chunk boundaries, retries or streaming seams must be traceable. For a single ordinary spoken phrase, do not impose a full packet unnecessarily. This method is not a renderer, pronunciation authority or audio-quality guarantee.

## Preserve source meaning

Retain the original text and source identity. For reproducible jobs, retain its exact bytes, encoding and digest. Separate source text from render text: record consequential normalization, numeral expansion, punctuation changes and pronunciation substitutions with source spans and reasons. Declare whether offsets count bytes, code points or another unit; do not mix them.

Use language/locale information from the task and mark uncertain spans. Do not silently apply compatibility normalization: it can erase distinctions important to meaning. Select a normalization and segmentation profile suited to the actual language and renderer. Preserve punctuation instead of losing delimiters during splitting.

Represent pronunciation choices by stable IDs tied to the relevant source span. Use supplied accepted readings where available; proposed or disputed readings remain explicitly provisional. Do not pretend guessed phonetics have been verified. A provider's spelling hack or markup support is not portable across engines.

## Plan bounded chunks

Prefer sentence or other meaningful boundaries, respecting grapheme clusters and protected pronunciation spans. Use the renderer's actual budget basis; characters, words, bytes and model tokens are not interchangeable. If the budget is unknown, a provisional segmentation is useful but not claimed to fit that renderer.

If a sentence is too long, find the strongest permissible internal boundary and record the split. If a protected unit itself cannot fit, report the unsatisfied constraint; do not split inside a grapheme cluster or detach a pronunciation substitution from its source unit.

Keep ordered chunk IDs, source ranges, render text, locale, pronunciation IDs and the policy revision. A retry is a new attempt for the same chunk; changed source or policy produces a new revision. Verify that source content is covered once or explicitly excluded, mappings resolve, and chunk order is preserved. Rendering context may repeat source spans, but context is not automatically audible content.

## When audio is actually produced

Record each attempt's renderer/version, available output identity, format, timing, completion state and unresolved seam checks. Keep requested duration separate from measured duration. Text lengths alone do not establish exact word timestamps.

For streaming, distinguish conditioning/context overlap from emitted audio. Map the emitted segments onto the assembled timeline and check for unintended gaps or repeated speech. Intentional crossfades may overlap, but their ranges and assembly policy must be explicit. Do not import a model-specific repeated-prefix or tail-slicing formula as a general solution. Unknown overlap, timing or final-flush behavior remains unverified.

Cancellation preserves partial output and attempt state; it does not become a completed render. Do not silently concatenate stale revisions or retry fragments into a final artifact.

## Finish at the requested layer

For planning, return the chunk plan, transformation decisions and unresolved renderer constraints without fabricating audio receipts. For rendering or repair, add actual receipts and the checks performed. Missing runtime information blocks the corresponding validation, not all useful text preparation. Structural coverage alone does not establish pronunciation accuracy, naturalness, seam quality or latency; report whether audio was rendered and listened to.
