---
name: cashflow-forecast-scenario-integrity
description: Build a portable, time-bucketed cash forecast that reconciles accrual drivers to settlement cash and proves scenario changes are attributable to declared assumptions.
metadata:
  version: 0.1.0
---

# Cash-flow forecast and scenario integrity

Use this method when a forecast must answer when cash moves, whether a budget change reaches cash, or where a base/downside/upside case creates a timing gap. It is an analytical workflow for supplied evidence; it does not execute payments or change account state.

## Method: typed cash-ladder delta ledger

Choose the entity or reporting perimeter, accounting basis, units, opening cash, forecast horizon, bucket size, and actual-versus-forecast boundary. Pick finer buckets where a shortfall could occur. Keep missing inputs unresolved rather than treating them as zero.

Represent each material inflow, outflow, accrual adjustment, or balance movement as an event row with:

- amount and sign;
- operating, investing, or financing class;
- recognition period and cash-settlement period;
- actual, estimate, or assumption status;
- source or assumption reference; and
- the driver that can change it in a scenario.

Recognition and settlement are separate fields. Revenue or expense is not cash until its collection or payment rule places it in a settlement bucket. For working-capital drivers, calculate DSO, DIO, and DPO only from period-matched balances and flows, retain `CCC = DSO + DIO - DPO` as a timing indicator, and show the resulting cash bucket rather than treating days as cash.

For every bucket `t`, calculate:

`ending cash_t = beginning cash_t + receipts_t - payments_t`

and reconcile the receipts and payments back to event rows and their activity classes. Keep non-cash items visible as adjustments or excluded cash events. A carried balance must equal the prior bucket's ending balance.

Create a base case and only the named alternatives needed for the decision. Each alternative gets a delta ledger containing the case, driver, old value, new value, affected event, affected settlement bucket(s), sign, and evidence or rationale. Recompute from the same base; do not allow untagged changes. A collection or payment lag therefore moves cash between buckets without silently changing the accrued amount. A one-off item appears once, in its stated bucket.

## Checks and output

Run these checks before interpretation:

1. Every bucket and the full horizon tie beginning cash, net movement, and ending cash.
2. Activity totals tie to their event rows; accrual items have a settlement rule or an explicit non-cash disposition.
3. Actuals, estimates, and assumptions remain distinguishable, with consistent units and periods.
4. Every scenario delta is explained by its driver ledger; unchanged inputs stay unchanged.
5. The cash ladder reports minimum headroom or a funding gap by bucket, including the severity and duration of any shortfall.

Deliver the event ledger, cash ladder, cash bridge, scenario delta ledger, assumptions, exceptions, and unresolved questions. Do not assign scenario probabilities without a defensible basis. Finish when a reviewer can reproduce each material number and identify which dated assumption changes the conclusion.
