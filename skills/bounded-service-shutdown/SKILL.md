---
name: bounded-service-shutdown
description: "Use when a service or worker must stop accepting work, drain tracked activity, and close under a verified deadline. Do not use for platform mutation or an unmeasured kill window."
---

# Bounded service shutdown

Engineer an idempotent shutdown path whose readiness, drain, cleanup, timeout, and exit evidence are explicit.

## use when

- Add a bounded shutdown lifecycle to an authorized local service.
- Verify readiness, drain accounting, cleanup, and timeout behavior before release.

## do not use when

- Terminate a production process without operational authority.
- Choose a shutdown deadline without the platform grace-period evidence.

## inputs

- service lifecycle and active-work accounting
- platform termination window
- cleanup and health-check hooks

## preconditions

- active work can be measured
- the external kill deadline is known

## workflow

1. map signal handling and idempotent state transition
2. lower readiness and refuse new work
3. drain tracked work below the external deadline
4. close resources and classify clean versus forced exit

## outputs

- bounded shutdown implementation
- clean timeout and duplicate-signal verification

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when active-work accounting cannot be trusted
- fail closed when cleanup exceeds the bounded deadline

## exclusions

- does not control a live orchestrator
- does not claim every transport drains through one listener close

## termination

Stop when shutdown, duplicate-signal, clean-drain, and forced-timeout paths have local verification evidence.
