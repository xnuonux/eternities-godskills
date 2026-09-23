# Wave 14 visual source dispositions

Source-body review and dispositions are limited to `r0019`, `r0038`, `r0206`, `r0247`, and `r0248` from `data/universal-product-v1/family-plan.jsonl`. The initial inventory command streamed the entire family-plan file, so non-selected row metadata, including Eli-yu-first entries, was inadvertently read. Their source bodies and launcher-packet files were not opened, and those rows were not modified or used. Exact exposure and boundaries are recorded in [source-integrity.json](source-integrity.json). The source body identities and pinned checkouts are also recorded there.

The existing owners divide the work by responsibility. Muse owns visual analysis, interface direction, accessibility, and rendered acceptance (`product/skills/eternities-muse/SKILL.md:10-24`; `product/skills/eternities-muse/references/methods.md:3-13`). Atlas owns data semantics, analytics, reconciliation, and measurement contracts (`product/skills/eternities-atlas/SKILL.md:8-26`). Hermes owns integration behavior, including retry/timeout policy and effect receipts (`product/skills/eternities-hermes/SKILL.md:10-26`). Forge owns multi-stage delivery and integration evidence (`product/skills/eternities-forge/SKILL.md:10-26`). Frontend Arsenal governs component fit, target tokens, accessibility, real-browser rendering, and source/license proof (`C:/Users/Dom/.codex/skills/eternities-frontend-arsenal/SKILL.md:10-36`). These owners cover the surrounding disciplines, but none currently supplies operational-system visual mappings for the four concrete domains below.

## Per-body decisions

### r0019 — `materialized-view-visualization-pattern` — adapter

The body specifies a source-table → materialized-view → consumer topology; last-refresh time, row count and staleness; a lag strip; row-delta, duration-histogram and stale-read panels; and query-plan comparison. Those are useful data-to-mark mappings for explaining freshness and downstream impact. Atlas has query, reconciliation, and measurement routes, while Muse supplies general visual law and acceptance; neither defines this lifecycle view. Adapt the mappings into the proposed Muse method, with every metric and threshold bound to the actual data contract. Do not carry over the body's `< TTL/3` color boundary or `>30%` refresh-storm alarm as defaults: the body provides no system-specific validation for either. Motion must represent observed refresh events, not decorative activity.

### r0038 — `connection-pool-visualization-pattern` — adapter

The body proposes one cell per physical connection, explicit lifecycle states, a separate waiter queue, and a time series linking active/idle/waiter counts to acquisition latency. This capacity-plus-queue pairing can explain saturation better than a pie chart. No current owner specifies a pool visualization. Adapt the relationship and the synchronized measurements; derive state names, capacity, age, and thresholds from the pool's own telemetry. The source's colors, progress bars, fixed age buckets, and implied mutually exclusive states need target-specific checks. For large pools, add an aggregate view without hiding counts; provide labels and a non-color state encoding.

### r0206 — `nanobana-image-generator` — rejected

The complete body is a provider-specific image-generation workflow: Google API-key setup, a Python package, named Gemini models, image editing and batch calls, optional Google Search grounding, and generated-file metadata. That is not a reusable operational visualization method. Its infographic prompts can request charts or technical diagrams, but generated pixels do not enforce metric correctness, exact labels, keyboard access, responsive behavior, or live state. The body also makes time-sensitive capability, watermark, and cost claims that are not established by this local source inspection. Do not retain it as a Muse method or invoke its provider. This decision does not reject ordinary visual design; it rejects this particular provider workflow as the method for the current owner gap.

### r0247 — `retry-strategy-visualization-pattern` — adapter

The body lays request attempts on a time axis and distinguishes request latency from backoff intervals; it also proposes jitter bands, terminal outcomes, attempt-budget use, and aggregate attempt counts. Hermes owns retry policy and timeout behavior, but not this visual explanation, so adapt the timeline as a Muse presentation of a Hermes/Atlas-owned contract. Source the retryable/terminal classification, actual attempt timestamps, `Retry-After`, budget, and backoff formula from the target system. Do not generalize the body's `429/503` or `4xx` classifications to services without an explicit policy. Only draw a theoretical curve when its formula and parameters match the active policy; use keyboard-accessible detail and avoid relying on color or hover alone.

### r0248 — `consistent-hashing-visualization-pattern` — adapter

The body describes a ring with physical nodes, virtual nodes, key positions, clockwise ownership arcs, node-change migration, and a per-node distribution view. It offers a concrete explanation of locality under membership change. Current Atlas, Hermes, and Muse methods do not define a consistent-hash visualization. Adapt the topology and before/after comparison; use the target's actual hash space, function, vnode rules, tie/wrap behavior, and key population. The source's 32-bit range, FNV-1a/MurmurHash3 suggestions, seeded placement, and color assignments are not universal defaults. A deterministic educational fixture is useful only when clearly marked as simulated and checked against the same ownership function used by the target.

## Summary

Disposition is four adapters and one rejection. No body is marked covered: Muse and Frontend Arsenal cover visual craft and acceptance, and Hermes/Atlas cover operational semantics, but those are complementary layers rather than replacements for these specific data-to-view mappings. The proposed method is original prose that composes those layers; it does not copy source code or passages.
