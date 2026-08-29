---
name: venture-falsification-and-planning
description: "Use when a venture thesis needs stage-aware assumptions, falsification tests, and bounded planning. Do not use for investment advice, financial commitments, or invented market proof."
---

# Venture falsification and planning

Transform a venture idea into an evidence ledger, kill criteria, staged experiments, resource bounds, and explicit decision points.

## use when

- Stress-test a venture thesis before committing resources.
- Create a stage-aware plan with assumptions experiments and kill criteria.

## do not use when

- Commit funds or make regulated investment recommendations.
- Treat forecasts or enthusiasm as validated demand.

## inputs

- venture thesis and current stage
- supplied customer market and operational evidence
- resource constraints and decision horizon

## preconditions

- the stage and resource ceiling are explicit
- current claims can be source-labeled

## workflow

1. separate facts assumptions and unknowns
2. rank existential assumptions by cost and reversibility
3. design staged falsification experiments
4. define decision thresholds resource caps and next-state plans

## outputs

- venture evidence and assumption ledger
- stage plan experiments kill criteria and decision gates

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, supplied-evidence-read
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop when a decision depends on unavailable current evidence
- surface irreducible uncertainty instead of manufacturing confidence

## exclusions

- does not provide legal tax or investment advice
- does not contact customers or commit resources

## termination

Stop when every existential assumption has evidence status, a bounded test or an explicit accepted uncertainty and decision owner.
