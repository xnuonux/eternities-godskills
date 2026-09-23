# Wave17 candidate methods — original design proposals

These are two independent candidate owner refinements, not installed Godskills, accepted product changes, source dispositions, or financial/investment advice. Source observations are recorded separately in source-review.md. The contracts below are newly authored from the current owner boundaries and the capability comparison. They do not copy source wording, code, templates, visual profiles, assets, or provider instructions.

## R1 — Evidence-bound slide artifact handoff

**Candidate owner seam:** a Logos refinement, with a Muse visual/accessibility acceptance handoff. It does not create a broad presentation-design owner.

### Trigger

Use when the user asks for a factual presentation, board or operating deck, or slide-based report from supplied evidence and expects a file or reviewable local artifact. Choose the output adapter only after the requested format and available local validation tools are known.

### Exclusions

- Do not use to discover or manufacture market facts, financial forecasts, product performance, or causal claims. Route analysis to Atlas, Beacon, Agora, Athena, or the relevant financial/scientific owner, then consume its declared output.
- Do not treat a polished deck as proof, approval, demand, investment quality, deployment, or publication.
- Do not send source material to a hosted slide, image, or narration service without explicit authorization for that exact provider, data transfer, and cost.
- Do not reuse a reference deck’s text, assets, template parts, or protected source material merely because it was supplied for style review. Do not use assets with unresolved rights.
- Do not mark visual acceptance complete when rendering or inspection was unavailable.

### Inputs and working record

Bind the decision or purpose, audience, date/freshness boundary, supplied source set, reuse/rights state, intended format, local tool availability, allowed effects, and named reviewer. Maintain a claim register with stable claim IDs, exact source locators, source dates, claim class (observed, derived, assumption, proposal, or unresolved), calculation owner, caveat, and allowed reuse.

Before layout, create a slide map. Each slide record has a stable ID, narrative role, proposed conclusion, evidence IDs, contrary or limiting evidence, chart/table inputs where applicable, audience action, and a visual/accessibility note. Decorative elements are marked as such; factual labels, values, and quotations each bind to a claim or source.

### Procedure

1. **Freeze the boundary.** Confirm the intended decision, audience, source period, file format, private/public handling, and authorized local effects. If a required source or rights basis is absent, keep that part as a visible gap.
2. **Build the claim register.** Separate supplied values from calculations and interpretation. Check every material value against its source and declared unit, denominator, cohort, period, and definition. Preserve contradictions instead of selecting the most convenient figure.
3. **Make a decision path.** Sequence the slide records so a reader can distinguish current state, evidence, implication, alternatives, uncertainty, and requested decision. Do not hide counterevidence to improve persuasion. Reduce or split claims when a slide cannot support them legibly.
4. **Specify before rendering.** Create a format-neutral slide specification for order, content, semantics, source IDs, editable elements, and reading/accessibility intent. Add only the geometry and format properties required by the selected adapter. Keep primary information editable where the format supports it; never encode essential values only inside a raster image.
5. **Build through an available local adapter.** Keep authoring tool, version, configuration, input identities, and output path in a manifest. Do not assume a particular JavaScript, Python, browser, or office package. Preserve source files; write new output to an authorized, non-colliding path.
6. **Check content, structure, and rendering separately.** Re-open the generated package; verify slide/page count and order, required text and source references, object bounds, reading order, image descriptions, and no unintended hidden or omitted material. Render every page when a compatible local renderer exists and inspect for clipping, overlap, illegibility, contrast loss, crop errors, and missing fonts. Run format-specific interaction or viewport checks only for formats that have those behaviors.
7. **Repair and report.** Resolve deterministic defects and repeat the affected checks. If content does not fit, split or restructure it rather than silently shrinking it below the declared readable size. Return the artifact, slide map, claim/source register, asset provenance, build manifest, validation receipt, unresolved issues, and explicit checks not performed.

### Evidence outputs and acceptance

Expected local packet: the authored slide file; source/claim register; slide map; asset/rights list; build manifest; and a validation receipt with output SHA-256, page count, tool/version, structural checks, rendered viewports/pages inspected, detected issues, repairs, and exceptions.

Call the artifact *content-supported* only when every factual claim has a traceable source or explicit assumption label. Call it *structure-checked* only after package and ordering checks. Call it *visually inspected* only if all requested pages were rendered and inspected. Call it *accessible-reviewed* only for the specific semantic, contrast, reading-order, keyboard, or reduced-motion checks actually performed. These states are independent; no single pass implies the others.

### Recovery

- **Missing or stale source:** mark the affected claim unresolved; narrow the deck or request the exact update. Do not fill gaps with generic benchmarks.
- **Conflicting values or definitions:** keep both candidates with their dates and definitions, show the conflict, and route the resolution to the source owner. Block only claims and pages that depend on it.
- **Unclear rights:** omit the asset or use a user-authorized alternative; do not synthesize from protected or unlicensed material.
- **No renderer or renderer failure:** preserve the specification and generated draft, report structural checks separately, and leave visual acceptance open. Do not imply that a source body or static spec proves the rendered result.
- **Overflow, overlap, or accessibility defect:** repair the underlying content or layout, rebuild, and repeat the relevant checks. If a defect cannot be repaired within scope, identify slide and issue and hand off explicitly.
- **Output collision or overwrite risk:** stop before writing; use a new path only when authorized.

### Illustrative case

A board asks whether to prioritize one of two onboarding changes using a supplied experiment export and an existing analysis packet. The slide map binds the observed completion-rate values to the analysis IDs and shows that the two cohorts used different eligibility rules. The deck may explain the observed difference but must not present it as a causal revenue effect. The generated local deck is checked for source links and page order; every page is rendered and reviewed for clipped labels. If the rendering tool is absent, the handoff remains a structurally checked draft with visual inspection explicitly open.

### Portability boundary

The method is format-neutral; adapters are not. A PPTX adapter checks package integrity and editable/readable slide objects; an HTML adapter checks named viewport sizes and browser interactions; a PDF adapter checks page order, extractable text/reading order, and rendered pages. Report what the selected environment can actually verify. The method does not require a provider, a network, or one authoring library.

## R2 — Multi-artifact business fact register

**Candidate owner seam:** a narrow Agora/Logos handoff refinement, with Beacon or a financial specialist supplying their own bounded facts when relevant. It validates consistency across artifacts; it does not become an investor-advice or financial-modeling owner.

### Trigger

Use when two or more related business or fundraising artifacts will repeat material facts or assumptions—for example, a pitch deck, investor memo, model summary, accelerator form, and update draft—and the user asks that they agree.

### Exclusions

- Do not decide the correct raise, valuation, market size, investment thesis, forecast, or legal disclosure.
- Do not infer that similarly named metrics share a definition, period, cohort, currency, or denominator.
- Do not silently resolve source conflicts, rewrite workbook formulas, or convert assumptions into observed results.
- Do not send outreach, upload a packet, publish a deck, or share restricted source material.
- Do not expand the check to artifacts the user did not place in scope.

### Inputs and working record

Establish the artifact set, authorized recipients, as-of date, source authority, and decision owner for each material value. For every reusable fact, preserve a stable key plus display label, definition, population/cohort, numerator and denominator when applicable, unit/currency, period/as-of date, source locator, calculation lineage, status (observed, derived, forecast, assumption, or unresolved), owner, caveats, and permitted reuse.

Create an assertion map from each in-scope artifact location to one or more fact keys. Mark values intentionally absent, qualified, or scenario-specific so a difference is not automatically treated as an error.

### Procedure

1. **Name the release set.** List each in-scope artifact, its version/date, purpose, audience, confidentiality, and the requested consistency rule. Confirm who can resolve conflicting facts.
2. **Reconcile fact definitions first.** Compare definitions, periods, scope, units, and source lineage. Keep same-label but non-equivalent measures as separate keys. Do not normalize away a material difference.
3. **Map material assertions.** Link each repeated figure, date, team role, ask, milestone, and assumption to its fact key and its location in each artifact. Record intentional omissions and artifact-specific wording.
4. **Recompute only declared arithmetic.** Independently check sums, ratios, and cross-references when inputs and rules are explicit. Route workbook formula preservation to its owner and business meaning to its source owner. A formula result without its formula/input lineage is not newly certified by this method.
5. **Report mismatches with choices.** Classify each as value conflict, definition/scope mismatch, stale date, unsupported claim, arithmetic discrepancy, intended scenario difference, or not comparable. Show affected artifacts, source references, decision owner, and what must be resolved before the affected statement can be treated as aligned.
6. **Apply resolved facts consistently.** Only after the owner resolves a discrepancy, update authorized local drafts or provide a correction map. Record the old and new values, the changed artifacts, and checks rerun.
7. **Close with a bounded receipt.** Return the fact register, artifact-assertion matrix, mismatch list, resolved/unresolved owners, exact artifact versions and hashes, arithmetic checks, limitations, and a human release decision. A clean comparison is not approval to contact recipients or publish.

### Evidence outputs and acceptance

Expected packet: a fact register; artifact-to-fact assertion matrix; mismatches with type, source, affected locations, and decision owner; explicit scenario/period distinctions; a correction log if authorized; and a review receipt binding the checked artifact versions.

Mark a fact *aligned* only when the same definition, unit, period, and source-backed value are present or the difference is explicitly justified. Mark a package *consistency-reviewed* only for the named artifact set and as-of cut. The receipt never means that the underlying forecast is likely, the offer is lawful, the market is validated, the fundraising packet is approved, or any recipient was contacted.

### Recovery

- **Conflicting authoritative sources:** preserve both with dates and scope; request a named owner decision and block only dependent assertions.
- **Different populations or periods:** split fact keys and label each artifact value; do not choose one as canonical merely because more artifacts use it.
- **Missing definition or source lineage:** mark the value unsupported and hold it from outward-facing copy until confirmed.
- **Stale artifact:** report the version/date and affected values; do not repair an artifact the user did not authorize.
- **Spreadsheet calculation not reproducible:** route to formula-preserving workbook review, retain the extracted value as unverified, and do not recalculate by guess.
- **Partial packet:** state the exact artifacts reviewed and leave omitted assets outside the consistency conclusion.

### Illustrative case

A founder supplies a deck, memo, cash plan summary, and draft investor update. One file describes the proposed raise as 1.5 million in a June 2 version; another says 1.8 million in a June 6 version. The register records each source/date and the assertion map identifies the conflicting locations. The method does not infer that the later number is approved. It holds those statements, asks the named decision owner to resolve the ask and affected use-of-funds arithmetic, then rechecks only the artifacts authorized for correction. No outreach is sent.

### Portability boundary

The register and assertion map can be represented in a spreadsheet, JSON, or a document. Adapters preserve each artifact’s native semantics: document text and table cells, slide objects, and workbook formulas are not interchangeable. Use stable fact keys and source locators independent of the adapter, and record extraction limits. The method is a consistency gate, not a universal “one source of truth” that overrides an owner’s authority.

