---
name: interface-localization-and-bidirectionality
description: "Use when an interface must support locale-aware content and bidirectional layout with deterministic visual and interaction checks. Do not use to publish unreviewed translation."
---

# Interface localization and bidirectionality

Engineer locale and direction behavior across text, layout, controls, formatting, assets, and assistive semantics while preserving human language review.

## use when

- Add locale-aware and bidirectional interface behavior.
- Verify RTL LTR mixed text formatting controls and visual layout.

## do not use when

- Publish machine translation without human review.
- Mirror directional icons or data semantics indiscriminately.

## inputs

- interface routes components and content catalog
- target locales scripts and direction rules
- human-reviewed translations and visual acceptance matrix

## preconditions

- target locales and direction rules are explicit
- publication requires named human review

## workflow

1. separate translatable content from code
2. bind locale formatting pluralization and direction
3. adapt layout navigation icons and mixed-direction text
4. test keyboard assistive semantics screenshots and human-reviewed language

## outputs

- localized bidirectional interface implementation
- locale visual interaction and human-review evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: automatic-cultural-claim, external-write, unreviewed-translation-publication

## failure behavior

- stop publication when human translation review is absent
- retain logical order when visual mirroring would change meaning

## exclusions

- does not certify cultural appropriateness automatically
- does not publish or mutate translation services

## termination

Stop when locale formatting, LTR and RTL layout, mixed text, controls, accessibility, screenshots, and human review gates pass.
