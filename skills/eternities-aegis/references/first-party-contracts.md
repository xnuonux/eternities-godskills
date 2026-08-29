# Static-rule fixture contract

A new deterministic security rule is promotion-ready only when one isolated fixture proves all five boundaries:

1. the planted positive is detected;
2. the clean and comment-only controls remain unflagged;
3. out-of-scope targets are rejected;
4. receipt mutation is detected;
5. generated output is isolated from source inputs.

Keep rule id, bounded locator, severity, ownership, and artifact digest visible. Passing this gate proves the rule fixture only. It does not prove exploitability, production coverage, or legal compliance.

The executable reference is `src/lunari-first-party-contracts.mjs`.
