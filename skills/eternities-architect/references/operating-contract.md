# Eternities Architect operating contract

## Route selection

- `decision-record`: one consequential choice with known context and no broad system redesign.
- `new-system`: requirements must become components, interfaces, state, failure behavior, and a build handoff.
- `existing-system`: current implementation must be mapped before any target design is accepted.

Select the narrowest route that covers the requested outcome. Do not run all routes by default.

## Evidence classes

Use four labels:

- `verified`: directly supported by inspected files, commands, authoritative documentation, or user-provided facts;
- `intent`: stated by product or design documents but not confirmed in implementation;
- `assumption`: needed to continue and explicitly exposed for validation;
- `unknown`: consequential information that cannot presently be recovered.

An assumption never silently becomes a requirement. Documentation never overrides observed implementation reality without calling out the divergence.

## Decision quality gate

A design may be selected only when:

1. the problem and excluded scope are stable enough to compare options;
2. each critical requirement maps to at least one design element and one acceptance signal;
3. alternatives are compared across the same dimensions;
4. trust boundaries, authority, state ownership, and failure recovery are visible;
5. migration and reversal costs are stated;
6. the strongest counterargument and reconsideration trigger are recorded.

If a critical constraint has no viable route, stop with the exact conflict instead of inventing architecture.

## Handoff shape

The implementation handoff contains ordered dependency slices, not speculative file-level tasks. Each slice names its observable result, required interfaces, validation surface, and upstream decision. `writing-plans` converts that settled handoff into repository-specific steps.

## Termination

Stop when the architectural choice and proof obligations are explicit. Do not continue into implementation merely to demonstrate momentum. Never route back to `eternities-architect`, and never force optional process skills when a narrow direct answer completes the contract.
