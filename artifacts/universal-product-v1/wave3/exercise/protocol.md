# Preregistered bounded instruction exercise

Decision: can the candidate artifact-lineage instructions support a useful,
portable reuse guard without introducing unsafe acceptance? This is not a
universal superiority benchmark.

Two fresh non-forked GPT Luna max workers receive the same `task.md`, tools,
isolated empty output directories and no pre-existing implementation. Condition
H is host-native: current global skill catalog/instructions remain visible.
Condition S additionally reads the frozen candidate entrypoint. The host cannot
remove all background instructions, so neither arm is called raw. The candidate
is not installed before the exercise. Each worker gets one attempt, no feedback
from hidden checks, no source-review reports, and a 10-minute wall-time budget.
Tool failure can be reported as invalid; no selective retry for a losing arm.
Dispatch order is S then H; both run concurrently. Score order is H then S.

Parent-authored hidden cases are fixed before worker outputs. They cover valid
cache/resume/warm-start, changed dependent versus irrelevant identities,
path-independent reuse, malformed/missing evidence, unknown dependency names,
incomplete or unverified artifacts, required training state, explicit operation
boundaries, fit/evaluation overlap, and input preservation.

Success requires zero unsafe accepts and all valid controls accepted. Record
case-level results and keep both outputs even on ties or failures. Shared host
instructions, one task, small sample, and author-designed checks limit inference.
Token charges are unknown unless observable; wall time and final self-reports are
not substitutes for billing data. An improvement claim needs fresh repetitions
and tasks, not a single score. A tie means no demonstrated advantage here.
