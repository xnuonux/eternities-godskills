---
name: docx-package-redline-and-render-verification
description: "Use when a DOCX package needs controlled redlines, relationship-safe edits, and page rendering checks. Do not use when external links or embedded content remain uninspected."
---

# DOCX package redline and render verification

Edit a word-processing package while preserving structure, relationships, review semantics, and visually verified pagination.

## use when

- Apply a controlled redline to an authorized DOCX package.
- Verify package relationships comments tracked changes and rendered pages.

## do not use when

- Open or preserve unknown external links without inspection.
- Accept a text-only diff as proof of document layout.

## inputs

- source DOCX and requested revisions
- relationship and embedded-object inventory
- rendering and review requirements

## preconditions

- the original package is preserved
- external relationships and embedded content are inventoried

## workflow

1. inspect package parts relationships and external targets
2. apply minimal tracked structural edits
3. validate XML relationships comments and change markup
4. render pages and compare layout pagination and visual defects

## outputs

- relationship-safe redlined DOCX
- package validation and rendered-page evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, document-read
allowed effects: read, write
forbidden effects: active-content-execution, external-write, uninspected-external-link

## failure behavior

- stop when package relationships escape the approved scope
- reject edits that corrupt tracked-change or rendering semantics

## exclusions

- does not follow external package links
- does not claim legal adequacy of a redline

## termination

Stop when package integrity, relationship safety, tracked changes, and rendered pages all pass review.
