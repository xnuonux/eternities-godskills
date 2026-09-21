---
name: docx-package-redline-and-render-verification
description: Use when an authorized DOCX needs relationship-safe redlines, tracked-change validation, external-content inspection, and rendered-page comparison.
---

# DOCX package redline and render verification

Use this entrypoint when a document change must preserve package structure and review semantics as well as visible pagination. A text diff is only one view of a DOCX package and cannot establish that the delivered pages are intact.

## Inventory the package

Preserve the original bytes and record its digest. Inspect the ZIP parts, content types, document and numbering parts, headers and footers, styles, comments, footnotes, endnotes, settings, tracked-change markup, media, embeddings, and relationship files. Resolve every relationship target enough to classify it as internal, external, missing, or unsupported. Do not open or retain an unknown external target simply because the document references it.

Capture the requested revision as a small set of semantic edits: text, structure, formatting, comments, or tracked changes. Decide whether the task needs a redline, an accepted-clean document, or both. Keep author, date, revision, and review metadata intentional rather than allowing a library default to rewrite it.

## Edit and validate

1. Apply the smallest package-safe change on a copy. Preserve unrelated XML, namespaces, relationship IDs, and existing review markup where possible.
2. Validate XML well-formedness and relationship targets after writing. Check that every inserted or removed run, paragraph, comment, and change marker remains connected to the intended part.
3. Compare package inventories and semantic text/formula-like fields before and after. Flag unexpected changes to styles, numbering, fields, settings, document protection, or embedded content.
4. Render the result with the available compatible document engine. Compare page count, page breaks, headers and footers, tables, images, tracked-change visibility, clipped text, overflow, and blank pages.
5. Preserve the render settings and version in the review receipt. If rendering is required but unavailable, report a pending visual gate rather than calling the package complete.

If the requested edit is legally or contractually consequential, return the redline and evidence for human review; package integrity is not legal adequacy.

## Finish and failure handling

Finish when package integrity, relationship safety, requested review semantics, and rendered-page checks all have evidence. Stop if an external relationship escapes scope, a package part cannot be interpreted, or a render changes unexpectedly. Keep the original and failed candidate available for comparison or rollback.

## Common failure modes

- Treating XML text equality as proof of pagination.
- Flattening tracked changes into plain text.
- Letting a library rewrite all relationship IDs or styles.
- Rendering only the first page.
- Ignoring embedded objects or linked media because the main document opens.
