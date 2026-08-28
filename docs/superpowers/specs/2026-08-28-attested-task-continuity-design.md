# Attested task continuity design

## outcome

Extend Eternities Mnemosyne and Forge with a portable continuity primitive that survives compaction and session handoff without replaying full history or injecting a plan before every tool call.

## contract

- one append-only checkpoint chain per `taskRef`;
- monotonic revisions bound by the previous packet digest;
- Ed25519 signatures verified against host-configured trust roots;
- explicit task, session, objective, proven state, completed work, open work, blockers, authority, evidence pointers, next action, freshness, and context budget;
- recovery returns only the newest verified packet and never imports another task;
- evidence pointers carry locators and optional digests, never fetched bodies;
- stale, forged, cross-task, over-budget, malformed, or discontinuous state fails closed;
- no hooks, per-tool reinjection, slash commands, stop loops, host activation, or automatic execution.

## source boundary

The inert planning-with-files source is a pattern reference for disk persistence, attestation, and per-agent ledgers. Its hooks, prompt injection, slash commands, and stop-gate machinery are excluded. The implementation is independent first-party code.

## proof

Tests must demonstrate signature and byte binding, append-only chain continuity, task isolation, compaction recovery, freshness and budget refusal, direct authority preservation, and lower context cost than a declared per-tool reinjection baseline. Local fixtures do not prove arbitrary host integration or production operation.
