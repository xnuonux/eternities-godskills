# Wave 13 farm extension: product routing hold

Status: source dispositions and authored evidence triage retained; **not in the
portable product release**. The existing agricultural-observation-and-trial
method remains unchanged from the 66-method baseline.

Eight pinned farm/soil/water entrypoints were read and reviewed in
`artifacts/universal-product-v1/wave13-farm/`. The useful independently authored
reference survives as `reviewed-reference-on-hold.md` there. This preserves the
mapped-soil, seasonal-estimate, and farm-water evidence method, including the
one-value hazard and guarantee boundaries; it is not an installed capability.
The held reference has the same SHA-256 as the last integrated candidate:
`094dddf4fa8da9f16e396e5faa90c8794757b9bdc241eed2fbdbc9efd3e063b3`.

The first integration review found that the reference was not discoverable for
its new water/heat/soil intents. Several candidate metadata and offline-search
repairs were then independently reviewed. The last review is
`artifacts/universal-product-v1/wave13-product-integration-rereview-r5-luna6/`.
It found both kinds of material failure in nearby queries:

- civic water purification/infrastructure requests with incidental garden terms
  could rank the farm method first;
- farm irrigation laboratory requests mentioning a municipal treatment plant
  as a source, or negating a treatment request, could be suppressed.

Literal phrase vetoes and one-token domain anchors cannot reliably identify
what action the user wants from the surrounding context. Another list of
synonyms or exceptions would repeat the observed precision/coverage tradeoff.
The experimental query-anchor and punctuation changes were therefore removed
from the release product; their failed candidates and independent review
receipts remain as development evidence. No farm source or reviewed draft was
deleted to make this decision.

To resume integration, design a bounded intent-aware route that distinguishes
agricultural evidence triage from civic treatment design and distinguishes a
treatment plant as a *data source* from a requested *action*. Pre-register
positive, negative, paraphrase, source-context, and negation fixtures from the
five reviews; compare against the baseline 66-method search so unrelated
routes do not regress. Keep the model-independent Markdown entrypoint usable
and test both the bundled search and at least one actual host discovery path.
Qualify the revised route independently before adding the reference to the
product or installed skill directory. No farm or public-health performance
claim follows from passing routing tests.
