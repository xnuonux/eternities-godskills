# Arcadia mining receipt

## reviewed family

Arcadia follows exact bounded semantic review of all 25 sources in `game-design-development-clusters-v1`. Eight clusters cover every reviewed source exactly once.

Selected candidate evidence:

- `game-direction-contract`, digest `efa42bb782e6e48929b724272d6cae334dd070353e84c942a24811d129468beb`: `skill-2662a809e231e576`, `skill-8828c005b56ee300`, `skill-bd538035e9ab0cf5`, `skill-c37d2be027c6a66b`, `skill-d6d7c8cfb5a2a05a`.
- `game-runtime-systems`, digest `81df935d359841e53bd1ae00cdcf2302db6e9a36231dd8dacb79818dd789effe`: `skill-01d2678fab2beba5`, `skill-15f48cb09bb3fc5c`, `skill-3925ac9a9a4a4729`, `skill-4da919605360b97e`, `skill-8426e4facce66130`, `skill-c5453d97a8bfa880`, `skill-c8515dee272ef8a4`.
- `game-player-experience`, digest `2d41d06b1e097ebc953d05bf7b49ecd31558a6e13d22e5f499aaac6302304fb3`: `skill-653cc106c45b3108`, `skill-87235b0ad6427a6c`, `skill-8fbc34ba16f26554`, `skill-9be2bc7dc4cce133`, `skill-e9c2d8bc4cbefcdd`, `skill-f92d59487c6e6a3b`.
- `game-proof-and-verdict`, digest `a22c1076cbef9827fb1ed7ef095d159322a1342577141579524ffc5910cb4a9d`: `skill-0dc34cc7a9cf2651`, `skill-0fe22284c56b22d7`.

The synthesis preserves independently expressed contracts for direction, simulation, input, persistence, network authority, performance, player feedback, access, runtime evidence, and human judgment. It does not reproduce source wording.

No source prose was copied. No third-party code or instruction was executed. Warehouse repositories remained inert evidence.

## deferred and rejected evidence

- `generated-content-boundary`: `skill-b1c5dae2c9f8b4b6` and `skill-c672de8666610086` remain deferred until exact rights, provenance, platform disclosure, ratings, safety, performance, and fallback evidence is current.
- `game-shipping-boundary`: `skill-4177e7f0e23def3a` remains deferred because package installation, signing, account, policy, legal, and publication effects require separate authority and current official evidence.
- `runtime-administration-boundary`: `skill-db19e91e6f58e8e1` remains deferred because dependency installation and global agent-profile mutation do not belong in Arcadia's local core.
- `narrow-demo-example`: `skill-d4446fd83f92f9cc` is rejected from synthesis because its prescribed terminal example does not generalize into a universal game-development contract.

None of these five sources contributes doctrine, routes, dependencies, success cases, or source coverage to Arcadia.

## deterministic verification

```powershell
node --test tests/arcadia-godskill.test.mjs tests/schema.test.mjs tests/composition.test.mjs tests/cluster-promotion-evidence.test.mjs
node scripts/evaluate-skill.mjs --skill skills/eternities-arcadia --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-arcadia.json
node scripts/verify-skill-receipt.mjs --skill skills/eternities-arcadia --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-arcadia.json
node --test
```

Static fixtures can prove contract shape, exact evidence reconciliation, routing outcomes, policy gates, and deterministic receipts. They cannot prove live-model interpretation, game quality, fun, commercial performance, current external rules, rights clearance, representative-device reliability, or production operation.
