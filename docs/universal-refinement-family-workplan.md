# Newest-intake refinement families

This research layer organizes 410 leads: 406 gap-bearing bodies plus four
unknown-category bodies without gap labels. It is not a second product catalog.
There are 40 family definitions, including an unresolved-source family; counts
do not imply 40 finished specialist disciplines.

All 410 leads now have a bound advisory assignment: **19 method candidates,
271 owner-extension leads, 60 platform adapters and 60 unclear sources**.
Fourteen of the unclear sources have no useful primary family yet. The other
46 can be broadly placed but lack enough evidence for a method disposition.
See the [complete family index](../data/universal-product-v1/FAMILY-INDEX.md).

The packet binds the 2,558-body refinement queue, repaired descriptions, family
definitions and previous 59-method release
`8de2600c40fab57bfbe8b26b50ca7ccfa3351cda02eaf6e86fe4263dd704bee4`.
Packet snapshot:
`237e8b46c4d736ff9e68a8e58bca21e36889a4aaf6f9b84fa8e7614f71a56d9d`.
Later method additions do not retroactively change that review baseline.

## Inputs and lookup

- `data/universal-product-v1/family-packet.json`: selected metadata and all family
  scopes, stable row IDs and exact source-body hashes.
- `data/universal-product-v1/family-review-a/` and `family-review-b/`: Luna max
  assignments by frozen packet offset. Each row has a family, disposition and
  short rationale, not a source quality score.
- `family-plan.jsonl` and `family-plan-summary.json` in the same data directory:
  generated accounting and per-family dispositions.
- `family-jev/`: bounded Jev advisory receipts and the paced stop.

Read a bounded packet slice with
`node scripts/refinement-family-workplan.mjs slice 0 64`. Rebuild accounting with
`node scripts/refinement-family-workplan.mjs build`. The `packet` command creates
a packet from current inputs and refuses to replace an existing different frozen
packet. A new source/product baseline requires a newly versioned review batch.

## Meaning of the dispositions

| Disposition | Next useful action | What it does not establish |
| --- | --- | --- |
| method-candidate | Read source bodies; test a distinct portable contract | A finished missing skill or a superior method |
| owner-extension | Compare a mechanism against the adjacent owner and extend only if useful | Complete source coverage by that owner |
| platform-adapter | Keep platform prerequisites explicit; extract a neutral core only if one exists | Universal compatibility or permission to install tools |
| unclear | Inspect the source or retain unresolved state | Rejection, zero value, or invented expertise |

Family owner IDs are adjacent entrypoints, not mandatory dependencies. A source
may span families; this primary-family assignment is an indexing choice, not a
claim of semantic equivalence. Keep the original domain label for provenance,
even where the more precise family corrects an earlier coarse classification.

## Compute and evidence

Jev first advised on eight family-design questions (seven proposals and one
abstention). It then performed one eight-row scope batch. The next batch returned
`unavailable: paced`, so there was no retry or new request ID to evade that stop.
The remaining organization was assigned to two non-forked Luna max workers with
disjoint paths. Their output is validated by exact snapshot, row and body binding;
missing or duplicate assignments cannot silently become complete coverage.

This layer cannot read a source body merely by classifying its metadata. It
promotes zero skills. Actual source reads, independent synthesis and behavior
checks remain separate distillation waves. It covers only the newest intake's
gap/unresolved subset, not every older corpus stratum or every skill on the web.
