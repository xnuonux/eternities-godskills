# Forward exercise protocol

Single fresh GPT Luna max worker, ten-minute implementation budget, no forked
conversation. Start: 2026-09-21 (dispatch ID below provides the exact event).
Worker: `01a0c3cc-c726-7fb0-a569-76c4b0b1792a`.

Candidate entrypoint SHA-256:
`7710f20ce711ba1bfc1c1561e80bb17855f90375fa9af77185a53c841e700e9c`.
Task SHA-256:
`47621b6d6993be2917bfb5e183c93aba5317160c3d240e92135d7a92b674d400`.
Scorer SHA-256 frozen before dispatch:
`753ba7d941ab228a06bfbf7cf3f1ffb62922795e425c97eef9934bedc136ab6a`.

The worker may read only the candidate method, task and its own output. It may
write consumer.mjs, consumer.test.mjs and README.md in its unique temporary
directory. No provider calls, dependencies, external effects or other workers.
The parent inspects output before execution and archives the first result
unchanged. Failed cases are retained; no silent retry or repair of the exercise
candidate. Future fixes must be a distinct follow-up result.

Acceptance is the frozen scorer's complete case set, including valid controls,
input binding, false/zero/null, partial transport, UTF-8 limit, closed variants,
semantic IDs and safe error handling. This is an inert implementation exercise;
duplicate JSON keys and live provider behavior are expressly out of scope.

There is no baseline arm, so passing does not measure a gain from the skill.
The worker's global host skill catalog and instructions remain visible. This is
not a raw, context-free or universally performance-qualified agent experiment.
