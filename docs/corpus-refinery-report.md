# corpus refinery foundation report

date: 2026-08-26

status: certified foundation, continuing refinery

## result

The repository now has a deterministic evidence ledger for every source in the
certified 4,741-card quarry. The audit resolved and read every exact `SKILL.md`
body under `D:\03-ARSENAL\warehouse` as inert text, recorded its SHA-256,
byte and line evidence, and found zero missing or unreadable bodies.

This milestone corrects the previous ambiguity between catalog breadth and
actual refinement. The machine-readable state is:

| evidence | count |
|---|---:|
| indexed | 4,741 |
| classified outside `general` | 3,880 |
| exact body inspected | 4,741 |
| independently reviewed | 10 |
| represented by formal provenance | 30 |
| clustered by reviewed behavioral contract | 0 |
| synthesized through this corpus program | 0 |
| evaluated through this corpus program | 0 |
| promoted through this corpus program | 0 |

Existing promoted Eternities skills remain valid under their release receipts.
They are not silently projected into later corpus states because the new ledger
requires exact review and cluster evidence.

## classifier correction

The first audit exposed that the original classifier used substring matching.
The short marketing keyword `cro` therefore matched unrelated words such as
`across` and `microsoft`, inflating the marketing family to 966 cards. The
classifier now requires Unicode letter and number boundaries where a keyword
begins or ends with a word character. Regression tests preserve matching for
real phrases and hyphenated repository identities.

After correction, the first professional queues are:

| family | cards | packets |
|---|---:|---:|
| agency and client services | 12 | 1 |
| marketing and growth | 291 | 12 |
| social media and community | 106 | 5 |
| game design and development | 25 | 1 |

Every packet contains at most 25 cards, retains exact source and body digests,
and labels source material as inspected data rather than instructions.

## first semantic wave

Ten bodies were read in full and received independently written review
contracts:

- agency: onboarding audit orchestration, pipeline reconciliation, client
  history, and evidence-to-proposal transformation;
- marketing: marketing operating plans and canonical product-marketing context;
- social: pillar-format ideation matrices and voice-grounded post authoring;
- game development: lifecycle routing and measured balance/progression tuning.

Each review records inputs, operations, outputs, effects, failure behavior,
exclusions, invariants, risks, disposition, proposed cluster, and exact body
digest. The validator rejects stale bodies, copied-prose declarations, unknown
sources, unsupported promotion claims, missing boundaries, and duplicate rows.

## generated evidence

- `artifacts/corpus/body-evidence.jsonl`
- `artifacts/corpus/coverage-ledger.jsonl`
- `artifacts/corpus/review-evidence.jsonl`
- `artifacts/corpus/coverage-summary.json`
- `artifacts/corpus/families/<family>/queue.json`
- `artifacts/corpus/families/<family>/packets/*.json`
- `receipts/corpus-refinery-foundation.json`

## limits

This milestone does not claim that all 4,741 skills were semantically reviewed,
deduplicated, synthesized, evaluated, or promoted. Structural body inspection
is complete. Semantic refinery work continues packet by packet, with review
state tied to exact source hashes so interruption and resumption remain honest.

No third-party code was executed. No generated candidate was globally
installed. No repository was published or pushed. No external account or
runtime adapter was mutated.
