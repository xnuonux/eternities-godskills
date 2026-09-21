---
name: counterbalanced-agent-evaluation
description: Compare agent, skill, prompt, model, or harness variants with isolated conditions, held-out tasks, independent criteria, and explicit quality-cost tradeoffs.
---

# Counterbalanced agent evaluation

Use when a claimed improvement needs a fair test: a skill pack versus a raw
agent, an updated prompt, a new model, or an orchestration change. For a single
bug's regression test, use the ordinary test workflow instead. This method is
provider-neutral and works with recorded outputs when live runs are unavailable,
but recorded, simulated and actually executed conditions must remain distinct.

## State the decision before seeing the results

Write the change being tested, the target task population, acceptance criteria,
resource limits, and the decision the result could support. Choose a bounded
sample of representative, difficult and negative cases. Specify which failures
cannot be compensated for by a better average score.

Keep development examples separate from held-out evaluation tasks. Do not let a
builder write expected answers for its own output and call that independent
validation. Criteria may be public; concealed answer keys must not leak into a
worker's context. Record any necessary contamination instead of hiding it.

## Make the conditions comparable

1. Freeze the candidate artifact and baseline by digest or immutable version.
   Name every intended difference. If model, tools, skill and budget all change,
   the result compares complete systems; it does not isolate the skill's effect.
2. Give matched runs the same user task, permitted source data, tool availability,
   workspace state and stopping contract. Keep user data private and external
   actions within authority. Use copies or inert fixtures where side effects
   would make later conditions incomparable.
3. Start isolated contexts. Verify that a supposedly raw agent did not inherit
   skills, Keel, repository instructions, memories or outputs from the other arm.
   If the host cannot remove an influence, describe the baseline as host-native,
   not raw. Never claim to disable higher-priority host safeguards.
4. Randomize or counterbalance run order and presentation labels. Use repetitions
   appropriate to the variance and budget. A fixed seed can aid replay where
   supported; it does not guarantee identical model behavior across services.
5. Predeclare treatment of timeout, unavailable tools, retries and invalid runs.
   Retain failures and costs. Restarting only the losing arm biases the result.

## Score outcomes, not confidence

Use executable checks for objective contracts and inspect real artifacts for
visual, usability or domain judgments. Blind the reviewer to condition labels
where possible; vary display order if order could matter. Model judges are useful
triage but may share biases with builders; preserve disagreements and use an
independent check for consequential conclusions.

Report task-level results, regressions, missing outcomes and practical effect
size. State the denominator and uncertainty. Repeated outputs from the same task
are not automatically independent tasks. Do not turn one attractive demo into
evidence that a system is superior across professions.

Track wall time, tool calls, retries, input/output usage when observable, actual
charges when available, and human correction effort. Unknown cost is unknown,
not zero. A better result at higher cost may be useful; expose the tradeoff.

## Refine without erasing the experiment

Preserve the original candidate, outputs and score before patching. Classify the
failure: selection, missing method, excessive process, execution, environment,
review or evidence quality. Make the smallest justified revision, then evaluate
on fresh held-out cases plus regressions. A revised candidate starts a new
comparison; it does not retroactively win the original one.

Choose keep, revise, narrow scope, merge, defer or retire from observed outcomes.
Do not promote a method merely because it parses or its package tests pass.
When the user authorized implementation after evaluation, carry the supported
change through verification rather than ending at a recommendation.

## Example and useful record

For two visual effects agents, freeze the same scene brief and resource budget.
One receives the candidate design method; the other does not. Preserve both
outputs before showing randomized labels. Review visual accuracy, interaction,
stability, accessibility and GPU cost separately. If the skill improves form but
worsens orbit controls, retain that regression rather than averaging it away.

A compact result needs: hypothesis, condition versions, task IDs, environment,
order/labels, raw artifact locations, criterion results, failures, resources,
uncertainty, decision and the scope in which the conclusion holds. The record
supports the work; producing paperwork is not the experiment itself.
