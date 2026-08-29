---
name: formula-preserving-workbook-engineering
description: "Use when a workbook must be changed without flattening formulas, named ranges, recalculation behavior, or rendered meaning. Do not use for unverified bulk value replacement."
---

# Formula-preserving workbook engineering

Modify spreadsheet packages while preserving computational lineage and verifying formulas, caches, references, and rendered output.

## use when

- Change an authorized workbook while preserving formulas and references.
- Repair spreadsheet structure and verify recalculation and rendering.

## do not use when

- Overwrite formulas with cached values.
- Trust a library round trip without package and visual verification.

## inputs

- source workbook and requested change
- formula and named-range inventory
- recalculation and rendering environment

## preconditions

- the original workbook is preserved
- formula-bearing regions are identified

## workflow

1. inventory formulas names links and calculation settings
2. apply the smallest package-safe edit
3. recalculate through a compatible engine when available
4. compare formulas values references and rendered sheets

## outputs

- formula-preserving workbook
- structural recalculation and render evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, local-read
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when formula lineage or external links cannot be reconciled
- retain the original when recalculation changes unexplained cells

## exclusions

- does not silently sever external references
- does not treat cached display values as formulas

## termination

Stop after formula identity, recalculation deltas, package integrity, and rendered sheets are verified against the requested change.
