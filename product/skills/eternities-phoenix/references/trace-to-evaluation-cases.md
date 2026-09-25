# From interaction evidence to candidate evaluation cases

Use this route when a user wants to decide *what to test* from interaction notes or traces already supplied or expressly approved for inspection. For one failure with a known input and expected output, take the normal reproduction and regression route. This card is case discovery, not a permission to fetch production conversations, install instrumentation, retain private data, write source annotations, or declare a model improvement.

## Set the observation boundary

Name the user's decision question, authorized source, time window, selection rule, and what the sample omits. Choose an operation, complete turn, or full conversation as the counting unit based on where the suspected behavior appears. A multi-turn failure cannot be counted as independent failures per turn. Keep separately selected streams separate. Every count states its own denominator and overlap rule; an incident queue or convenience sample cannot estimate population prevalence without a justified sampling design.

For each selected unit, preserve its locator, observed event, evidence class, and the expected task rule *if known*. A surprising trace is not automatically wrong when the expected behavior or missing context is unknown. Separate a mismatch from a causal hypothesis. Include completed-but-wrong behavior and correctly handled errors; an exception flag alone does not classify agent quality.

## Form revisable dimensions

Group observations by narrow failure dimensions after recording them individually. Keep an unknown or contested bucket, examples that resist the grouping, and the original evidence links. Record counts, overlap, missingness, selection bias, and any reviewer disagreement. For consequential labeling, a second blinded reviewer can check a bounded sample; absent that check, do not claim label reliability or a complete taxonomy.

## Freeze candidate cases before evaluation

For each material dimension, draft a case with input conditions, expected invariant, observable pass/fail check, and source locator. Seek near misses, successes and counterexamples where the authorized sample contains them. If the sample is incident-only and has none, record that gap instead of inventing a success. Remove or replace private details only while preserving the failure mechanism, label the transformation, and keep the source's access and retention boundary attached. Synthetic cases are not production observations.

Freeze the candidate definitions and gaps before comparing agents, prompts, models or repairs. The same examples that shaped the cases are development material, not held-out proof. Route any later matched-condition test to `counterbalanced-agent-evaluation` with fresh cases and independent criteria. A selected trace, passing development fixture, or label count does not establish causal root cause, population reliability, or improvement.

Return the observation unit; source/access and privacy boundary; sample frame and denominators; evidence-linked observations with expected, observed, unknown and hypothesis separated; provisional dimensions with counts and disagreement; candidate case table; development-versus-held-out split; and explicit limits. If source access, expected behavior, denominator or safe minimization is missing, hold the affected conclusion at unknown and name the smallest evidence needed. Do not prescribe a vendor API, storage path, annotation UI or fixed sample size.
