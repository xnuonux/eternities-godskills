# Omnibus navigation checklist

Record query terms, synonym expansions, negative terms, catalog identity, catalog hash when supplied, entrypoint IDs inspected, and result limit. Prefer exact term matches in trigger, summary, task type, category, and related metadata, then apply the documented stable tie-break. Explain each matched term and each exclusion.

The product catalog is an offline index of product metadata and content hashes. Resolve it from a host-supplied pack location or explicitly provided product root. Two directory levels above the skill directory is a valid shortcut only when the skill is being read from an intact product pack. Standalone skill-folder installation and runtime pack copies can have different parents, so never hard-code a workstation path or assume the catalog exists.

The catalog is not a source quarry and does not contain permission, execution, or quality guarantees. Do not write it during search. If it is missing, stale, malformed, or outside the declared pack, use visible skill.json and entrypoint metadata as a clearly labeled manual index when those files are available; otherwise return the missing-index state and a bounded recovery request. A no-match result is useful evidence when its search boundary is explicit.
