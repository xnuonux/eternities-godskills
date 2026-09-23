# Wave 17–18 owner-method release boundary

This release improves four existing, portable Godskills rather than adding four new skill IDs:

| Owner | Added method | Boundary |
| --- | --- | --- |
| Hermes | Incremental byte-to-record stream intake | Verify runtime chunk support and framing; never treat a partial final record as success. |
| Daedalus | Partial-commit and compensation state matrix | A database transaction is atomic only for effects inside its supported boundary; reconcile uncertain commits before retry or compensation. |
| Logos | Evidence-bound slide artifact handoff | Keep claim support, package checks, rendered inspection, and accessibility checks separate. |
| Agora | Cross-artifact business fact register | Preserve conflicting definitions, periods, and values until the named owner resolves them. |

The source packets, independent proposal reviews, product-integration reviews, and bounded text-only exercise live under `artifacts/universal-product-v1/wave17-collections-synthesis-luna6/`, `wave18-autoskill-technical-luna6/`, `wave17-18-product-integration-review-luna6/`, `wave17-18-product-integration-rereview-r2-luna6/`, and `wave17-18-method-exercise-luna6/`. Their exact receipts govern the review scope. The restricted presentation bodies in Wave 17 and rights-uncertain code examples in Wave 18 were not copied into the product. Source review does not clear rights.

This is instruction and packaging evidence, not a comparative agent win, live stream/database/provider qualification, rendered deck acceptance, or whole-corpus completion. The independently rejected `feat/search-routing-v2` branch is separate and is not part of this release. The acquired-source ledger and its remaining obligations continue independently.
