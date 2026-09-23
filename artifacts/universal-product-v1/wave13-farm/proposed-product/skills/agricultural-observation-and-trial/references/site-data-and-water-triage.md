# Site data and seasonal or water triage

Draft owner extension for agricultural-observation-and-trial. This is a review
artifact only; it is not part of the product, installed pack, or active skill
catalog.

## Contract

Help distinguish local observations from mapped or model-derived information,
and route a water question to the evidence needed for that decision. Inputs
are user-supplied or otherwise authorized site, crop, weather, survey,
laboratory, and water records. Outputs are a traceable evidence table, a
missing-input list, a bounded calculation when its method and parameters are
provided, and the next measurement or qualified review. Do not fetch data,
select treatments, design infrastructure, or change field conditions as part
of this workflow.

Use this extension when a crop or soil decision depends on mapped soil-survey
data, a weather-based seasonal estimate, or a farm-water question. Do not use
it to produce a guaranteed agronomic outcome, diagnose a hazard from one
value, or replace current local advice, laboratory interpretation, or
qualified design.

## Keep mapped soil values separate from field measurements

For a supplied soil survey, record its provider or dataset, retrieval or
publication date, mapped area or map unit, stated scale or coverage, horizon,
attribute, method, units, and any range or component information that the
source provides. Label the result as mapped survey information. Do not
present it as a sample from the user's exact bed or field.

Compare survey information with the user's field observations and, where the
decision needs site-specific evidence, a suitably collected and interpreted
sample. Preserve the sampling depth, date, preparation, analytical method,
units, and laboratory or local interpretation. Do not convert a mapped value
or laboratory value into a treatment rate by analogy with an unrelated source.

If the source does not establish its spatial coverage, date, horizon, or
measurement method, retain that uncertainty in the result. If the distinction
could change the decision, stop at the evidence gap and request a better-matched
measurement or qualified interpretation.

## Keep seasonal calculations traceable

Before calculating a heat-unit total or discussing a model-estimated stage,
confirm the crop or cultivar, site, date range, weather source, temperature
units, daily-data convention, calculation method, and the applicable crop- and
region-specific parameters. Record where those parameters came from. If a
required method or parameter is missing, list it; do not supply a default from
an unrelated guide.

Check dates, units, duplicate or missing days, and any change of weather
station or source. Keep the original records available for comparison. Expose
gaps and conflicting records; do not interpolate or silently repair them.
When a calculation is supported, state the formula and parameters used and
label the result as calculated from those inputs.

Report a model-estimated stage separately from a stage observed in the field.
Compare the estimate with dated field observations where available, and leave
the disagreement visible. A calculation alone does not establish a planting
window, frost date, expected yield, or biological response.

## Route the water question before analyzing it

First identify which decision the user is asking about:

- **System choice:** collect the intended use, crop or enterprise, existing
  system, available source information, and measured flow or pressure if
  supplied. Return the evidence still needed for a design comparison.
- **Operating schedule:** collect dated soil-moisture or system readings,
  crop and observed stage, recent weather or rainfall records, units, and the
  locally applicable scheduling method. Do not invent a schedule threshold.
- **Constrained supply:** distinguish preparation from an active shortage.
  Record available supply, demand assumptions, time horizon, user priorities,
  and uncertainty. Do not impose a universal crop-priority order or deficit
  percentage.
- **Drainage or ponding:** record where and when water appears, how long it
  remains, recent rainfall, field pattern, and relevant observations. Keep
  possible causes separate from observations; do not design drains or
  earthworks from this triage.
- **Rain capture or storage:** record the intended use, supplied catchment and
  demand measurements, rainfall source and period, and storage assumptions.
  Keep arithmetic and assumptions visible; leave structural feasibility,
  permits, and engineering design to current local review.
- **Water quality:** record source, intended use, sample date, laboratory,
  analytical method, units, and the applicable interpretation supplied with
  the result. Do not invent thresholds, treatment instructions, or a claim
  that water is safe for people, animals, or edible crops.

Return a short evidence summary, unresolved assumptions, and the next
measurement or qualified local review. A request that depends on current
regulations, public-health limits, chemical treatment, infrastructure design,
or site-specific irrigation rates needs current authoritative guidance or
qualified review before an action recommendation.

## Evidence record and finish

For every consequential value, keep its status visible as observed, supplied,
derived, estimated, or unresolved. Include source, date, method, units, and
limitations. Finish when the requested distinction or calculation is bounded,
the next evidence need is clear, and no unsupported prescription or performed
effect is implied.

