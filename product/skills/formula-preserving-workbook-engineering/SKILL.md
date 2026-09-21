---
name: formula-preserving-workbook-engineering
description: Use when an authorized workbook must change without flattening formulas, named ranges, calculation settings, external links, or rendered meaning.
---

# Formula-preserving workbook engineering

Use this entrypoint for spreadsheet changes where computational lineage matters as much as the visible cells. It covers package edits, repair, recalculation, and review; a library round trip or a matching screenshot alone is not enough.

## Inventory before editing

Preserve the original workbook bytes and record a digest. Inventory worksheets, formulas, shared formulas, array formulas, defined names, tables, external links, data validations, conditional formatting, charts, macros or embedded content, calculation mode, cached values, and workbook protection. Identify formula-bearing regions and cells whose visible value is intentionally static.

Record the requested change in terms of cells, ranges, names, formulas, or presentation. Clarify whether the deliverable must retain formulas, update cached values, accept tracked changes, preserve macros, or render through a particular engine. If an external reference cannot be classified, keep it unresolved rather than silently severing it.

## Make and verify the smallest change

1. Edit only the required package parts or use a library configured to preserve formulas, names, links, and calculation settings. Never replace a formula with its cached display value to make a check pass.
2. Recompute with a compatible calculation engine when the task requires new values. Record engine and version, calculation mode, volatile-function behavior, and whether external data was available.
3. Compare formula text and normalized references before and after. Separately compare cached values, error cells, defined-name targets, table ranges, and dependent sheets.
4. Validate package structure and relationships. Check that the workbook opens, all referenced sheets and names resolve, and no unexpected package part was dropped or regenerated.
5. Render every affected sheet and inspect page breaks, hidden rows or columns, merged cells, number formats, conditional styles, charts, and clipped or stale values. Compare against a baseline render when visual meaning matters.

If recalculation produces unexplained deltas, preserve the original and report the cells and dependency path. A recalculated value can be correct while a formula or external-input change remains unexplained, so retain both comparisons.

## Evidence and finish

Deliver a change ledger with original and candidate digests, formula/name/link inventory, edit list, recalculation facts, changed-cell classification, package validation, rendered-sheet review, and unresolved external dependencies. Finish when formula identity, requested value changes, package integrity, and visual output all satisfy the contract.

Do not infer business correctness from arithmetic equality alone, and do not claim that cached values represent current reality when the source workbook or external links were unavailable.

## Common failure modes

- Loading a workbook in a mode that discards formulas.
- Updating formulas but leaving stale cached values without recording recalculation status.
- Replacing a defined name with a cell coordinate that works only in one sheet.
- Validating one visible tab while a hidden dependency changed.
- Treating a successful save as proof that Excel or another consumer will render the same way.
