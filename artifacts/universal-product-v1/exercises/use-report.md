# API rate-limit recovery exercise

Skill used: `product/skills/api-rate-limit-recovery/SKILL.md`

Skill digest: SHA-256 `442C4DB00B70AB29349C62F196ED7A3BB8D92AC8720E8D2CAA4079049AB974DB`

The skill shaped the implementation by limiting retries to documented `429`
responses, requiring a valid finite nonnegative delay, reusing one
idempotency key, checking cancellation and the absolute monotonic deadline
before dispatch and waiting, and returning distinct terminal outcomes. The
implementation uses only injected `send`, `now`, `sleep`, and `signal` values;
it does not create network traffic or real timers.

Verification: an inline Node v24.18.0 self-check passed for validation before
dispatch, success, same-key retry, zero-delay exhaustion, malformed guidance,
deadline/no-sleep, cancellation before and during a wait, terminal status, and
propagated send errors. Repository exercise and parent tests were not read or
run.

Independent acceptance: the parent reported that all seven acceptance tests
passed against `retry-client.mjs`. This result is recorded as supplied; no
acceptance-test files were read here.

Limits: this is deterministic client-behavior evidence for the supplied
contract. It does not establish provider behavior, idempotency enforcement,
concurrency safety, remote quota policy, or any performance superiority. The
fixed return contract does not expose the richer retry trace described by the
skill, so the exercise report records the policy boundary rather than claiming
an external trace or live-service result. The user requested the Luna max model
configuration; that request is recorded here without making a model comparison
claim.
