---
name: eternities-omnibus
description: Search the universal product catalog offline, explain specialist matches, and route an uncovered request without loading source material or granting authority.
---

# Eternities Omnibus

Omnibus is the product navigator. Use it when the installed broad routes do not clearly cover a request or when the user explicitly asks to discover or compare available skills. It searches the product catalog and index offline; it does not require a source quarry, download, or corpus activation.

## Navigation method

1. Reduce the request to a compact capability question: desired outcome, domain terms, artifact or action, constraints, and explicit exclusions. Do not paste a full conversation into a query.
2. Resolve the pack location from host context or an explicitly provided product root first. In an intact product pack, two directory levels above this skill directory may contain the product-root catalog.json; that relative location is only a convenience, not an assumption. A standalone skill folder may live under an agents skills directory, while a runtime pack may live under an agents godskills directory, so never derive or hard-code a workstation path. Treat an available catalog as data: inspect its schema, pack identity, entrypoint summaries, relations, and hashes without modifying it.
3. Search by exact terms plus documented synonyms. A catalog search is deterministic term matching with explanations and stable tie-breaking; it is not vector inference. If no catalog is available, use the visible skill.json and entrypoint metadata supplied by the host or build a clearly labeled manual index from the provided pack contents. Do not claim catalog coverage that was not observed. If the optional offline CLI is present, the equivalent form is:

       node <pack>/bin/godskills.mjs search "query"

4. Read only the returned entrypoint metadata and the smallest referenced method page needed to choose a route. Report the metadata source or manual-index boundary, why each result matched, what it does not cover, and whether the request is covered, a handoff, or an unresolved gap.
5. Once a route is chosen, read its complete SKILL.md before applying it, then only the references needed for this task. Do not substitute a search summary for the selected method.
6. Never write the catalog, activate a skill merely because it matched, execute source bodies, or infer permission from discovery. If no result matches, return the query, search boundary, and missing capability rather than inventing one.

## Deliverable and finish

Return the query terms, exclusions, catalog/index state, ranked matches, match explanations, coverage gaps, and one next route or unresolved result. Finish after a bounded offline lookup. The navigation checklist is in [methods.md](references/methods.md).

Discovery is a routing checkpoint when the user also asked to apply the selected capability and the pack is available. Continue into that authorized route without requesting separate permission; pause only when the pack, target, authority, or material evidence is unavailable.

Example: find the matching visual-acceptance entrypoint from the visible index, load its local method reference, and proceed with the requested capture review instead of returning only the search ranking.
