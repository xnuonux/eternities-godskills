# Sampling and detection records

## Sampling contract

Record target state or change quantity, population, taxon, area, time horizon, sampling unit, occasion definition, planned and realized effort, inclusion and exclusion rules, spatial and temporal coverage, revisit plan, reporting support and decision boundary. Mark missing design elements as unknown.

## Observation ledger

Preserve one row per planned survey opportunity where possible:

```text
site_id, occasion_id, start, end, protocol_version, observer_or_sensor,
effort, conditions, coordinates, coordinate_uncertainty, observed_count,
detection_state, source_record_id, exclusion_reason, notes
```

Use separate detection states for detected, surveyed without detection, not surveyed and unusable. Keep raw counts and derived event counts separate. Never repair missing effort with an assumed default.

## Event and effort rules

Record the event key, grouping unit, independence interval, gap and tie handling, label revision process and sensitivity alternatives. Compute effort from the operation record, including downtime and partial days. If a relative index is reported, state its denominator and what it cannot separate: occurrence, abundance, activity or detectability.

## Detection and change assumptions

- Replicate visits or sensors where imperfect detection must be estimated.
- Check closure, site availability, behavioral response, observer effects, double detection and zero inflation where relevant.
- Keep state covariates separate from observation covariates.
- For repeated estimates, record protocol equivalence, revisit overlap and temporal error correlation.
- Aggregate uncertainty to the support actually reported; do not quote point error as project error.
- Compare a plausible alternative model or design choice when model uncertainty could change the conclusion.

## Acceptance and failure evidence

Reconcile planned, completed and usable occasions; verify matrix dimensions and stable identifiers; inspect missingness by site and period; reproduce event counts from raw rows; and test at least one changed event or effort rule. Preserve negative findings and disappointing periods.

Characteristic failures are missing visits encoded as zero, unreviewed label changes, effort measured as calendar span, event thresholds chosen after seeing the result, relative indices relabeled as abundance or occupancy, point error quoted for an aggregate claim, and a change claim shorter than its detectability.
