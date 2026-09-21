# Wave6 cash-flow refinement review

Status: draft; instruction-reviewed; runtime behavior and comparative quality are not evaluated. The two requested artifacts are the only files written by this task. No source code was executed, no external financial action was taken, no other product, catalog, or test file was changed, and no Git commit was made.

## Neutral contract

- **Outcome:** produce a portable cash forecast whose timing, accrual-to-cash conversion, and scenario changes are traceable.
- **Success evidence:** a reviewer can recompute each bucket, tie beginning to ending cash, locate every material event, and reconstruct each scenario delta from a declared driver.
- **Inputs:** reporting perimeter and basis; units; opening cash; actual/forecast boundary; dated receipts, payments, accruals, balances, and assumptions; forecast horizon and bucket size; named cases.
- **Outputs:** typed event ledger; cash ladder; operating/investing/financing bridge; scenario delta ledger; headroom or gap flags; exceptions and unresolved inputs.
- **Operations:** separate recognition from settlement; calculate bucket cash; map working-capital days to dated cash; recompute cases from one base; run conservation, classification, timing, and delta-isolation checks.
- **Effects:** local analytical artifact only. It does not mutate accounts, authorize funding, select investments, infer tax treatment, or send communications.
- **Positive trigger:** a supplied budget, forecast, liquidity question, or scenario comparison requires dated cash consequences.
- **Negative trigger:** bookkeeping import, tax filing, investment selection, payment execution, audit assurance, or unsupported probability claims.
- **Dependencies/failures:** source references, period/basis/unit labels, and settlement rules are required for reproducibility; missing or conflicting inputs remain exceptions. Negative cash is a flagged result, not an automatic error.
- **Termination:** finish when material numbers and scenario deltas are reproducible and open questions are explicit.

## Source ledger and resolution

Family-packet IDs were resolved through `data/quarry-intake-2026-09-21-exa/sources.jsonl`; every manifest hash matches the entrypoint bytes.

| ID | Exact sourceId | bodySha256 | License metadata | Disposition |
|---|---|---|---|---|
| r0010 | GAJETOso/financeskills@862774c15d83f58536d84973b42dbbffda5af7ae:skills/working-capital-analysis/SKILL.md | 042580b2f662d89e92271d0a0425c7563466396ba2d036806e114dd0258ab791 | MIT / MIT License; cold-unreviewed | Pattern reference: dated working-capital timing, days metrics, seasonality and aging. |
| r0093 | GAJETOso/financeskills@862774c15d83f58536d84973b42dbbffda5af7ae:skills/budget-forecast/SKILL.md | 2702ce53cffde8b4cb2d2de7a9ec8011387456e61ae8c2922ed4e4d592a02862 | MIT / MIT License; cold-unreviewed | Pattern reference: driver-based forecast, cash impact, cases and variance. |
| r0128 | GAJETOso/financeskills@862774c15d83f58536d84973b42dbbffda5af7ae:skills/treasury-management/SKILL.md | 333a81985cdf0d35320f022b1e1c45d16340183ecf57ca33070286b1d105dd62 | MIT / MIT License; cold-unreviewed | Pattern reference: cash ladder, liquidity gap, time horizon and stress framing. |

The MIT labels are manifest metadata, not a legal-clearance finding.

## Full-read receipts

- r0010: 4,174 actual/manifest bytes, 84 lines, SHA-256 match; raw entrypoint fully read as inert text; no scripts run.
- r0093: 3,019 actual/manifest bytes, 88 lines, SHA-256 match; raw entrypoint fully read as inert text; no scripts run.
- r0128: 2,836 actual/manifest bytes, 84 lines, SHA-256 match; raw entrypoint fully read as inert text; no scripts run.
- Local owner context fully read: `product/skills/financial-statement-reconciliation/SKILL.md` and `product/skills/eternities-agora/SKILL.md`. Their traceability, reconciliation, route, evidence-class, and proposed-effect boundaries were used as context only.

## Candidate, novelty, and dispositions

- **Candidate:** one independent implementation, the typed cash-ladder delta ledger. It binds recognition period, settlement period, event class, and scenario driver in one row, then requires a declared delta ledger to explain every case change.
- **Novelty:** the sources separately provide working-capital arithmetic, budget scenarios, and cash ladders. None supplies this explicit settlement-time event type plus scenario-isolation invariant. The local reconciliation owner has a driver bridge, but not this per-event case-delta ledger.
- **Retained:** period-matched DSO/DIO/DPO and CCC as timing indicators; driver-based forecasting; base/downside/upside or named cases; cash-versus-accrual separation; dated cash ladder; headroom/gap and severity-duration checks; beginning-to-ending cash arithmetic.
- **Rejected:** source role-play/persona language; generic executive-report templates; fixed 13-week or 24-month horizons; peer benchmarks without evidence; FX VaR, hedging, investment sweeps, bank relationships, and funding recommendations; tax or geography assumptions; source scripts/references and copied wording.

## Checks, external verification, and limits

- **Direct case:** move one collection one bucket later; expected accrued amount unchanged, one receipt bucket moves, and the ending-cash path changes only from that delta.
- **Paraphrase case:** change a working-capital day driver; expected effect is rejected unless a period-matched flow, amount, and settlement rule are supplied.
- **Exclusion case:** add a non-cash accrual; expected result is visible adjustment or explicit non-cash disposition, never an invented receipt/payment.
- **Conflict case:** opening cash differs from prior ending cash; expected exception, not silent repair.
- **Boundary case:** a shortfall appears for one bucket; expected severity/duration flag with no automatic financing or investment action.
- **Structural result:** draft word count, review line count, frontmatter, exact hashes, and forbidden portability constraints are checked after writing; behavioral execution is unavailable by scope.
- **Primary-source check:** SEC materials support operating/investing/financing classification, non-cash reconciliation, and beginning-plus-net-change-to-ending cash ([SEC guide](https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide), [SEC cash-flow explainer](https://www.sec.gov/files/cash-flow-statement-bblocks.pdf)). An SEC-filed issuer definition confirms period-matched DSO/DIO/DPO and `CCC = DSO + DIO - DPO` while showing that the period and perimeter must be stated ([SEC-filed working-capital definitions](https://www.sec.gov/Archives/edgar/data/1856485/000185648526000008/sylvamo10k2025ex1022.htm)). OCC liquidity guidance supports alternative scenarios, time horizons, and severity/duration review; it is not adopted as a universal banking policy ([OCC liquidity handbook](https://www.occ.treas.gov/publications-and-resources/publications/comptrollers-handbook/files/liquidity/pub-ch-liquidity.pdf)).
- **Limits:** no live ledger, forecast accuracy, human review, audit assurance, tax conclusion, funding availability, investment suitability, or superiority claim was established. The source set is cold-unreviewed and the candidate remains draft/instruction-reviewed.
