---
name: measured-paid-creative-iteration
description: "Use when supplied campaign evidence must become bounded creative hypotheses and a measurement plan. Do not use to spend, launch, target people, or mutate ad accounts."
---

# Measured paid creative iteration

Turn authorized aggregate evidence into falsifiable creative variants, precommitted metrics, and a human-controlled experiment handoff.

## use when

- Design creative variants from supplied aggregate campaign evidence.
- Precommit a bounded paid-creative comparison and decision rule.

## do not use when

- Launch ads or spend a budget.
- Use private targeting data or unsupported audience claims.

## inputs

- authorized aggregate performance evidence
- brand truth offer and creative constraints
- human-approved budget ceiling and measurement window

## preconditions

- claims are supported by supplied evidence
- spend and launch remain human-controlled

## workflow

1. separate observed signals from hypotheses
2. design minimal creative contrasts
3. precommit metrics guardrails and stopping rules
4. prepare a no-launch experiment packet and analysis template

## outputs

- creative hypothesis and variant set
- measurement decision and authorization handoff

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: aggregate-evidence-read, artifact-write
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop when budget launch or audience authorization is absent
- reject a winning claim before the precommitted measurement window closes

## exclusions

- does not spend or change a campaign
- does not infer sensitive traits or guarantee conversion

## termination

Stop when the creative packet, metric definitions, guardrails, and explicit human launch gate are complete.
