# Wave7 communication refinement review

Status: draft; instruction-reviewed; runtime behavior and comparative quality are not evaluated. Baseline is commit `5b82972c857044244a6a9bdee00b3134167ed41d`; `artifacts/universal-product-v1/wave7/` and both requested files were absent at that commit. This bounded pass writes only `communication-review.md` and `communication-draft.md`; no source was executed, no private data was fetched, no external message was sent, no product/catalog/test/global file was changed, and no Git commit was made. Unrelated dirty-worktree entries present at close were preserved and are not attributed to this pass.

## Neutral contract

- **Outcome:** add one conditional, portable mechanism for an evidence-bearing update to a named audience when the update must coordinate an action, decision, response, or next checkpoint.
- **Success evidence:** a reviewer can trace each material claim to supplied evidence and period, preserve the speaker's identity and voice authority, verify metric definitions, see minimized sensitive disclosure, and find the action, owner, deadline, dependency, and approval boundary.
- **Inputs:** speaking identity and voice evidence; audience and channel role; reporting period; source inventory and freshness; claims and metrics; requested action or decision; sensitivity, accessibility, authority, and capacity constraints.
- **Outputs:** a factual update draft, a coordination ledger, review notes, unresolved factual checks, and a next owner.
- **Operations:** classify actual, derived, current, forward-looking, recommended, and unresolved material; preserve metric formula/unit/denominator/scope/window; tailor the update to the audience; record action ownership and disclosure state; run claim, access, privacy, and draft-versus-send checks.
- **Effects:** local drafting and review artifact only; no publication, delivery, account access, legal/financial/investment advice, or learning certification.
- **Positive trigger:** a supplied factual status/update for families or learners, investors or stakeholders, or an official recipient includes a concrete ask, decision, follow-up, or coordination need.
- **Negative trigger:** generic prose, routine isolated copy, unsupported current facts, provider delivery, direct outreach, public posting, sanctions, crisis response, or a request to invent metrics, authority, or identity.
- **Dependencies/failures:** missing evidence, period, metric definition, recipient, voice authority, sensitivity boundary, or action owner remains an exception; stale legal or platform claims are omitted rather than guessed.
- **Termination:** finish when the local update and ledger are traceable, accessible, appropriately minimized, and ready for the named reviewer without implying an external action.

## Source ledger and exact resolution

Each packet ID had exactly one row in `data/quarry-intake-2026-09-21-exa/sources.jsonl` matching both its exact `sourceId` and exact `bodySha256`. The local snapshot `HEAD` and entrypoint bytes also match the ledger. License fields are source metadata only, not legal clearance.

| ID | Exact sourceId | bodySha256 | Bytes | Commit | License metadata | Disposition |
|---|---|---|---:|---|---|---|
| r0080 | `easedup/educator-skills@8a6f3a22df5bdeb0d18d2edc5f46d6e2b61c62e1:skills/communication/parent-comms/SKILL.md` | `200418de24a2ed09a85bcbc7f5a28c7129a2930d2ae3ff430f4c6beedf0e8e25` | 7500 | `8a6f3a22df5bdeb0d18d2edc5f46d6e2b61c62e1` | ledger none; entrypoint no license field; cold-unreviewed | pattern reference; selective retention |
| r0318 | `jeremylongworth-source/AgentSkills@ebf24796e884b9196bdb47373d53dcc547466730:skills/investor-update/SKILL.md` | `887d32cc0dbf16e7ee962e9abacc2fd9c6ff365d02ed807baa691bc5fc43d21e` | 1781 | `ebf24796e884b9196bdb47373d53dcc547466730` | ledger MIT / MIT License; entrypoint declares MIT; cold-unreviewed | pattern reference; selective retention |
| r0289 | `Eli-yu-first/skillshub@65550a6e3068af13f07b3fb2605cdcc6e430a143:skills-repository/letterai/Formal-Letter-Composer/SKILL.md` | `77cb4f6b0c6908ec91f9f18fc1d6cd422b7290f2a7722cc6791f9be2d4a0332c` | 1553 | `65550a6e3068af13f07b3fb2605cdcc6e430a143` | ledger none; entrypoint declares MIT; cold-unreviewed | rejected as underspecified stub |
| r0283 | `kjuhwa/skills-hub@b8e7275ea024cc3f9d8551b41aa9ebf89b464cd1:skills/devops/slack-webhook-notify/SKILL.md` | `75c02520e081085324cca290a031198ec667d2a524f86de0146e346e540b4d58` | 2596 | `b8e7275ea024cc3f9d8551b41aa9ebf89b464cd1` | ledger MIT / MIT License; entrypoint no license field; cold-unreviewed | rejected/deferred as provider adapter |

## Full-read receipts and comparison

- r0080: 7,500 bytes, 230 lines, SHA-256 match, declared commit match; full entrypoint read as inert text. Retained audience/relationship and teacher-voice binding, plain-language access, concrete dates/actions/contact details, and observation-to-support-to-invitation structure. Vendor collator, promotional fallback, fixed templates, and interactive check-in language are not portable mechanisms.
- r0318: 1,781 bytes, 50 lines, SHA-256 match, declared commit match; full entrypoint read as inert text. Retained audience/period framing, supplied-fact separation, risks/focus/asks, and review flags for sensitive or consequential claims. The generic investor sections, shorter variant, and financial-advice boundary are covered or narrowed by Chorus.
- r0289: 1,553 bytes, 69 lines, SHA-256 match, declared commit match; full entrypoint read as inert text. Its metadata, runtime parameters, model list, and one-sentence purpose provide no audience-specific factual mechanism; rejected, with no official or diplomatic authority inferred.
- r0283: 2,596 bytes, 81 lines, SHA-256 match, declared commit match; full entrypoint read as inert text. Webhook URL handling, Python/curl examples, HTTP status, rate limit, and Slack payloads are a provider adapter and external-effect procedure; rejected/deferred to an authorized external-action capability. Secret minimization is already a Chorus boundary.

Existing coverage is substantial: Chorus already binds identity, audience, channel, claim provenance, accessibility, human ownership, metric definitions, measurement, community queues, handoffs, and draft-versus-send effects. Evidence-linked learning already covers evidence-grounded learner observations, practical next steps, restricted support notes, missing safety facts, and recipient-oriented handoffs. A generic newsletter, official-letter, investor-template, or notifier extension would overlap.

## Candidate, novelty, and decision

- **Retained:** one independently written conditional reference combining the useful audience-specific facts with a two-part artifact: factual update plus action/decision coordination ledger.
- **Novelty:** the inspected sources do not jointly make owner, due date, dependency, authority, minimum disclosure, and approval state first-class alongside the factual update. This is a small operational gap, not a new route or a fresh skill count.
- **Rejected/deferred:** vendor prompts, generic prose, model/runtime metadata, official/diplomatic authority, Slack delivery, webhook secrets, current platform rules, and any unverified legal or financial conclusion.
- **Draft decision:** warranted; `communication-draft.md` is one compact universal conditional reference and remains local, source-bounded, and independently worded. No source prose was copied and no source instruction was executed.

## Checks and honest limits

- **Direct case:** supplied family event facts with a date, action, and contact produce a plain-language update plus owner/deadline/approval rows; no send is implied.
- **Paraphrase case:** “traction improved” without a period, defined metric, denominator, comparison, and source remains unresolved; no trend is invented.
- **Exclusion case:** “post this to Slack” yields a local draft/effect ledger only; no webhook, secret, provider call, or delivery claim is made.
- **Conflict case:** voice evidence conflicts with the current speaker or audience; preserve the conflict and stop affected drafting for human resolution.
- **Boundary case:** a learning concern or official letter with missing evidence, identity, jurisdiction, or authority is narrowed or handed off; no diagnosis, legal claim, sanction, or official send is produced.
- **Structural result:** source integrity, full-read receipts, draft word bound, review line bound, and changed-file scope are checked after writing; behavioral execution, human review, live audience response, and comparative quality remain unavailable.
- **Adoption boundary:** draft/instruction-reviewed only. The source license observations remain unverified legal conclusions; no current platform/legal research was needed or claimed, and no publication, delivery, certification, or superiority evidence exists.
