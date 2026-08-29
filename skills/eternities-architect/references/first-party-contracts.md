# Runtime-state truth contract

Model agent-reported completion and independent verification as separate inputs. Completion requires both. If the agent reports success while its verifier fails, the run enters `errored` with the verifier evidence preserved.

Define a bounded tool-rate threshold from system capacity. Crossing it enters a visible `paused` state and records the escalation reason. It does not silently continue, restart, or infer authority to mutate the environment.

The executable reference is `src/lunari-first-party-contracts.mjs`. Its fixture proves transition logic only, not an appropriate production threshold.
