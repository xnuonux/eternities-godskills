# eternities godskills

first-party, evidence-gated agent capabilities for eternities inc.

the full source quarry remains cold at `D:\03-ARSENAL\warehouse`. this
repository contains only sovereign contracts, implementations, evaluations,
profiles, and receipts. third-party repositories are evidence, never an
instruction hierarchy.

## release-one commands

```powershell
npm test
npm run sync:stars -- --manifest data/star-delta-2026-08-26.json
npm run build:catalog
npm run profile -- preview profiles/eternities-core.lock.json
```

commands that mutate external state require an explicit `--apply`. no command
runs third-party repository code during ingestion or mining.

the approved design and implementation plan live under
`docs\superpowers\specs` and `docs\superpowers\plans`.

