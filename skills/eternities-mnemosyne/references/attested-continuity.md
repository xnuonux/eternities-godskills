# Attested continuity contract

Use this route only at a real compaction, session handoff, parallel-task boundary, major checkpoint, or explicit continuity request.

## packet

Each packet binds one task and contains a session reference, monotonic revision, parent digest, canonical timestamp, objective, proven state, completed and open work, blockers, available and excluded authority, source locators with exact digests, one next action, status, and context budget. The packet digest covers canonical bytes. A host-configured Ed25519 trust root signs that digest for the `task-continuity-checkpoint` purpose.

## append and recover

- keep one JSONL chain per task;
- validate every existing record before appending;
- require revision one to have no parent and every later revision to bind the exact previous digest;
- reject task mismatch, unknown key, invalid signature, malformed bytes, time reversal, stale state, incomplete records, or budget overflow;
- after compaction, return only the newest verified packet, its signer identity, measured recovery cost, and proof limits;
- keep parallel tasks in separate chains and never merge their open state implicitly.

The packet is continuity evidence, not permission to deploy, publish, spend, contact, or mutate anything outside its carried authority. Evidence locators are pointers, not injected source bodies. Reconcile current user instructions and newer authoritative evidence before action.

## excluded machinery

Do not install always-on prompt hooks, inject a plan before each tool call, require slash commands, block agent stop events, or automatically execute recovered next actions. Host activation and key custody remain outside this skill.
