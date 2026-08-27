# Agora mining receipt

## selected evidence

Agora is independently written from three certified candidate clusters in `agency-client-services-clusters-v1`:

- `agency-operational-state`, digest `bc995745d1abe8130b6e70e0de497f05a5d8a93600a79611fddeff30dc3c841d`
  - `skill-50183bf171c8cfeb`, review `01c1ff75724d924c1267a2fee21ef61c2ef28ca5f6ef9212fc02f73ef0f90e24`
  - `skill-8ea282b5eae0cd7a`, review `20ce01190d45a1e79ad2daa0357a92bded93521ff35d258a397467bea8ca2a52`
  - `skill-922f3f027d2021e7`, review `6aaa6a6f7d70631164fb992663a9dc37561bd8c9c7cfb268988026c8ebc3f7a5`
- `client-deliverable-construction`, digest `438c10e4d01b0da3a784137822e72efb4ebab3201acc96335b67760513946d8b`
  - `skill-01b3dd8d8b2e3347`, review `47c4f81e3e1538f7b0c1f9cbec69df0eedc9af87e44ab7762e2794a65422b78e`
  - `skill-eb5ed7a3910e2cc4`, review `a4737843b3f032f375084a0fc50178b25eb57066a51f5011926cec83d61b4ed6`
- `prospect-assessment-depth`, digest `1648c19ae0c7229dc71bd0d5f2674da11e8b65e36860ab9052c8f56a3b393dd2`
  - `skill-6f9529112807c946`, review `c0ad7b8de48368ca6e22d6c4b4632b88a92c01a2501b378d8551bb543c68aac6`
  - `skill-ea63f2d03890111b`, review `7d1f12c0bc3f6b8b90ef78191b5c96240eb269010b408a66166105285950259e`

The synthesis preserves only independently expressed mechanisms: evidence classes and coverage, conservative identity reconciliation, bounded scoring, scope-specific state contracts, proposal and report data contracts, explicit authority separation, route handoffs, and fail-closed termination.

No source prose was copied. No third-party code or instruction was executed. Warehouse repositories remained inert evidence.

## excluded evidence

- `business-agreement-drafting-boundary`: legal enforceability and jurisdiction require a separate current, qualified-review contract.
- `regulated-client-onboarding-extraction`: sensitive identity handling and regulated-use ambiguity require a dedicated high-stakes design.
- `regulated-financial-planning-boundary`: financial, tax, and regulatory advice requires current domain evidence and qualified review.
- `runtime-capability-diagnostics-boundary`: runtime administration is not agency client service and its evidence contains unsafe remediation advice.

None of these clusters contributes doctrine, routes, dependencies, success cases, or source coverage to Agora.

## deterministic verification

```powershell
node --test tests/agora-godskill.test.mjs tests/agora-routing.test.mjs tests/cluster-promotion-evidence.test.mjs
node scripts/evaluate-skill.mjs --skill skills/eternities-agora --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-agora.json
node scripts/verify-skill-receipt.mjs --skill skills/eternities-agora --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-agora.json
node --test
```

Static fixtures prove contract shape, exact evidence reconciliation, routing outcomes, policy gates, and deterministic receipts. They do not prove live-model natural-language interpretation, commercial success, current external facts, renderer correctness, or production reliability.
