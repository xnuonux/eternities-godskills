# 2026-09-20 category synthesis

Status: bounded intermediate synthesis; pattern-reference only. This is not an
implementation, promotion, safety, superiority, performance, certification, or
legal-clearance report.

## Scope and evidence boundary

- Godskills `HEAD` was checked as `9d899e02c0fbc4e00bdc2c14d183218b4c840b8b`
  (`9d899e0`, “Acquire public skill-directory batch and add offline Jev-faceted
  intake search”).
- Read-only inputs were
  `data/quarry-intake-2026-09-20-web/repositories.json`,
  `data/quarry-intake-2026-09-20-web/sources.jsonl`, and
  `docs/capability-directory.md`. The six selected source bodies and their
  repository-root license evidence were read as inert data. No upstream code,
  script, installer, test, build, model call, or external service was run.
- The directory identifies itself as a 2026-09-06 navigation snapshot at
  `3501f20baedc95a7ec25a6535278f463b7f98c19`; therefore “existing owner” below
  means the nearest owner evidenced by that snapshot, cross-checked against the
  current extension definitions where useful. It is not a claim that the
  directory is current or that any candidate is already integrated.
- All six source records were `reviewStatus: cold-unreviewed` and
  `activation: none`. Local repository `HEAD`, source blob, SHA-256 body hash,
  and listed root-license blob matched the intake records. That verifies intake
  identity only; it does not verify source quality, safety, provenance beyond the
  recorded acquisition, compatibility, or license clearance.
- This report is the only intended write. Bulk acquisition and Jev
  classification remain outside this lane.

## Exact source ledger

The local path is the acquired checkout path; the repository-relative path and
commit are the source identity. `sources.jsonl` line numbers are bounded
locators in the requested latest intake.

| ID / domain | Exact source path and commit | Intake identity | Root license evidence (data) |
| --- | --- | --- | --- |
| W / web accessibility | `D:\03-ARSENAL\warehouse\from-stars\addyosmani__web-quality-skills\skills\accessibility\SKILL.md` — `addyosmani/web-quality-skills@afa8da942115f2961fdbfa80807ea0b232ff6c00` | `sources.jsonl:3`; blob `22a244430f890fe44cbd7a50590d5cbf8528c77b`; body SHA-256 `267fb2a0707d6142f2871f22688203a42ba21291a2aa200fb740936e41362b5d`; 14,358 bytes | `...\addyosmani__web-quality-skills\LICENSE`, blob `90715bb429f374dcc4e05c35535b049d3c077313`; file begins MIT License, copyright Addy Osmani (line 3). Pattern reference only; no legal clearance. |
| R / robotics | `D:\03-ARSENAL\warehouse\from-stars\arpitg1304__robotics-agent-skills\skills\robotics-testing\SKILL.md` — `arpitg1304/robotics-agent-skills@f9bc5467ff9ee3d23f1a1b0b29a649843bb6ad11` | `sources.jsonl:41`; blob `c2c2c3326591d49935381ffc43a9342b88b53e55`; body SHA-256 `2de46ea2c1d831c702b57d72d6ae8f8e47c208eec803476861df8de00a51eb0b`; 18,920 bytes | `...\arpitg1304__robotics-agent-skills\LICENSE`, blob `c32fd4634d8ba91fb8755092a711f0e95711cf98`; root file is Apache License 2.0 and identifies 2026 robotics-agent-skills contributors. Pattern reference only; no legal clearance. |
| G / game development | `D:\03-ARSENAL\warehouse\from-stars\gamedev-skills__awesome-gamedev-agent-skills\skills\disciplines\level-design\SKILL.md` — `gamedev-skills/awesome-gamedev-agent-skills@b105e1cf617adf0b68ed98790a716bbb60993179` | `sources.jsonl:303`; blob `f46ebe758c357a7e78d52f7c15ec6b9f00fe2c33`; body SHA-256 `f1656cb00b9af8dc625a9655448b410b37ce6f1e523048a5abf09fda25cbfd32`; 7,081 bytes | `...\gamedev-skills__awesome-gamedev-agent-skills\LICENSE`, blob `c7fc0c6d59cb8129a0e30fe13f5a6118f3933c44`, plus root `NOTICE`, blob `d4204881c3f79f39151a53a6aae476b188a8c51f`; root evidence says Apache 2.0. Pattern reference only; no legal clearance. |
| M / marketing and ASO | `D:\03-ARSENAL\warehouse\from-stars\appeeky__aso-skills\skills\aso-audit\SKILL.md` — `appeeky/aso-skills@4df730f456c21e42b9a2ea2be89fb32caf787728` | `sources.jsonl:238`; blob `291042c081c45ffa827f0978823618a7eae35fb3`; body SHA-256 `907997223a8df93ff68a262eaa87b61467ed5fd884e666f6f1bbacd6f79dccfd`; 6,570 bytes | `...\appeeky__aso-skills\LICENSE`, blob `2713bfcbd814010d93f21ced8c01c1e3f20ae253`; file begins MIT License, copyright Erencan (line 3). Pattern reference only; no legal clearance. |
| I / infrastructure | `D:\03-ARSENAL\warehouse\from-stars\hashicorp__agent-skills\plugins\terraform\skills\terraform-test\SKILL.md` — `hashicorp/agent-skills@c2d65dfe492f74d360d35b859b88932222470bd8` | `sources.jsonl:577`; blob `2feebcc9f3c5b9e61a05119087f4fc328b9edf9f`; body SHA-256 `bba613c50727af9a8e47e690b0e16a4093f0239afec495016e016b5152c9a598`; 11,148 bytes | `...\hashicorp__agent-skills\LICENSE`, blob `d0a1fa1482eea82e19510e7920cbe3a03e41f691`; root file contains Mozilla Public License 2.0 including the standard Exhibit B notice template. Template presence alone does not establish a project-specific secondary-license restriction. The source front matter also says `Copyright IBM Corp. 2026`. Pattern reference only; no legal clearance. |
| N / mobile | `D:\03-ARSENAL\warehouse\from-stars\callstackincubator__agent-skills\plugins\vendored\.agents\skills\react-native-testing\SKILL.md` — `callstackincubator/agent-skills@61e6e7dfdf3a8ee862254c200d751fcb1fb863dc` | `sources.jsonl:215`; blob `71f7cc1be424f64fed9f6baaef303548d0bef195`; body SHA-256 `dea54d1d397cbd271a9ee7f6c09e841bb1aa546d9f2a3ee46fd466275061e6e1`; 7,315 bytes | `...\callstackincubator__agent-skills\LICENSE`, blob `b9dc6bb6fc8378c98b553325e4b4df5a56098c46`; file begins MIT License, copyright Callstack Incubator (line 3). Pattern reference only; no legal clearance. |

## Evidence-backed synthesis

“Duplicate” means the compact directory already exposes substantially the same
route and boundary. “Narrow gap” means the source adds a concrete domain
procedure or receipt shape that is not named in that directory; it does not mean
the capability is absent from every uninspected file.

| Domain / source locator | Useful method, invariant, or decision process | Existing Godskill owner | Missing capability vs duplicate | Dependencies, risks, and license disposition |
| --- | --- | --- | --- | --- |
| W — `accessibility/SKILL.md:14-23,405-428` | Rendered-page loop: use an audit to obtain failing nodes, localize to the component, inspect the accessibility tree and keyboard flow, repair, then repeat the same audit and manual interaction. It explicitly keeps an automated score separate from WCAG conformance. | `eternities-muse`, via `interface-accessibility-audit`; the directory also records `accessible-async-interface-state-machine` under Muse (`capability-directory.md:29,76`). | Mostly duplicate/adjacent. The route, deterministic fixture boundary, and non-certification rule already exist. The useful narrow refinement is a receipt linking failed node → component/state → keyboard/manual check → same-audit rerun. | Browser/a11y tooling, a named browser/device, and manual screen-reader/zoom/high-contrast/reduced-motion checks are prerequisites. Live-browser, legal, and universal assistive-technology conclusions remain unverified. Root MIT evidence is recorded above; no reuse or legal conclusion is made. |
| R — `robotics-testing/SKILL.md:24-45,250-309,375-467,532-580` | Tiered verification: many fast deterministic unit/property tests; fewer integration, simulation, hardware-in-loop, and field tests. Preserve seeded fixtures, joint-limit/round-trip properties, event-driven timeouts, mock hardware/replay, golden trajectories, collision checks, and explicit failure-case tests. | No robotics-specific owner is named. Nearest broad owner is `eternities-daedalus` (implementation-engineering, `capability-directory.md:22`); Aegis is a required safety/security handoff, not a robotics owner. | Truly missing domain-specific capability in the inspected directory. General testing/implementation routes do not express ROS message timing, deterministic replay, trajectory invariants, simulation-to-HIL progression, or field-test authority. | ROS1/ROS2, pytest/launch testing, numerical/property libraries, simulator and possibly real hardware; version and physics-model differences matter. HIL/field work would need explicit authority and safety review. Apache 2.0 root evidence is data only; no legal clearance. |
| G — `level-design/SKILL.md:33-107` | Derive geometry from player metrics; block out before dressing; model critical/golden paths; encode tension/rest as data; teach then test mechanics; validate gated reachability and soft-lock absence before polish. | `eternities-arcadia`; related directory extensions include `immersive-comfort-and-spatial-interaction` and `realtime-3d-performance-and-spatial-systems` (`capability-directory.md:16,88,95`). | Duplicate at the broad route level, with a narrow artifact gap. A metrics/pacing/gating/playtest ledger would make Arcadia’s existing playable-proof route more operational, but a standalone level-design owner would overlap. | Engine movement/input and tile/grid skills, real playtest evidence, and human judgment are dependencies. The source’s engine-neutral examples are not runtime evidence. Apache 2.0 plus NOTICE are recorded above; pattern reference only. |
| M — `aso-audit/SKILL.md:12-32,34-137` | Require app context, App ID, country, and platform; collect metadata/rankings/competitors/reviews when authorized; otherwise request supplied data. Produce a weighted factor card, prioritized quick/high-impact/strategic actions, and a competitor comparison rather than an unbounded recommendation. | `eternities-beacon`, whose discoverability and conversion/lifecycle routes cover the broad problem (`capability-directory.md:20`); product-priority questions may hand to Prometheus. | Mostly duplicate/adjacent. The missing narrow artifact is a platform-specific store-listing audit packet with explicit evidence dates and “no ranking promise” language; the general marketing route already owns this class of decision. | Store/platform rules, weights, character limits, ranking facts, connector availability, and competitor data are temporal and require refresh. The source’s ranking-algorithm assertions are not independently verified here. Root MIT evidence is data only; no account or store action and no legal clearance. |
| I — `terraform-test/SKILL.md:22-28,75-115,214-248,318-367,409-448` | Separate plan-mode unit tests from apply-mode integration tests; use mocks where supported; assert outputs/resource counts/tags; test invalid inputs with expected failures; isolate state with `state_key`; order dependent runs and rely on reverse cleanup. | Nearest owner is `eternities-daedalus`; `eternities-herald` owns the release-readiness handoff (`capability-directory.md:22,25`). No Terraform/infrastructure test owner is named. | Truly missing infrastructure-specific capability in the inspected directory. The existing engineering/release routes do not spell out plan/apply effects, provider mocks, state isolation, negative variable tests, or cleanup-order evidence. | Terraform/provider versions, credentials, real resource cost, state mutation, cleanup failure, and version-gated features (for example mocks and parallel/state behavior) are material risks. Root MPL-2.0 and source copyright metadata are recorded; no legal conclusion or copied-source promotion. |
| N — `react-native-testing/SKILL.md:17-28,41-97,110-155` | Detect the installed RNTL version before loading v13/v14 references; prefer semantic role/name queries; await `userEvent`; use `findBy*` for asynchronous results; keep side effects out of `waitFor`; use library matchers and avoid redundant `act`/`cleanup`. | Nearest owner is `eternities-daedalus` through `behavioral-test-maintainability-review`; `eternities-muse` remains the accessibility handoff (`capability-directory.md:56-58,76`). | Truly missing mobile/platform-specific contract in the inspected directory. Generic test quality exists, but not the RNTL version split, semantic query order, async interaction rules, or React Native accessibility assertions. | RNTL v13/v14, React 18/19, test-renderer, project package metadata, and the source’s uninspected version-specific reference files. No app was run. Root MIT evidence is data only; no legal clearance. |

## Ranked first-party improvement candidates

These are original internal design candidates, expressed from the observed
patterns without copying source prose. They are ranked for bounded usefulness and
testability, not claimed superiority.

### 1. Daedalus: robotics verification ladder and deterministic replay contract

Why first: R is the clearest domain gap and supplies a concrete evidence ladder
that complements Daedalus’s existing test-first and fail-closed contract. It
should be an extension or specialist route, not a new top-level Godskill, with
Aegis named for safety/security decisions.

Worked-example outline:

1. Hypothetical ROS2 perception → planner package declares topics, message
   schemas, timing bound, seed, joint limits, collision envelope, simulator
   version, and the human owner for any HIL/field step.
2. The packet runs in order: pure-function/property fixtures; node/message
   integration with an event timeout; deterministic camera/joint replay;
   golden trajectory comparison; seeded simulation with collision and completion
   bounds; only then an explicitly authorized HIL or field handoff.
3. The result keeps failed-case evidence (invalid parameters, unreachable goal,
   empty sensor input, timeout, changed seed) beside the happy path. A sleep,
   missing failure test, or unexplained seed change leaves the gate open.

Observable test to require if this candidate is implemented: the same replay
fixture produces the same trajectory digest twice, an invalid confidence
parameter is rejected, and the integration fixture reports an event completion
within its declared timeout without a fixed sleep. The test design must also
show that no robot or external simulator was invoked for the unit/integration
tiers. This has not been run.

### 2. Daedalus → Herald: infrastructure plan/apply test gate

Why second: I gives a precise boundary around infrastructure effects and a
portable contract for negative tests, mocks, state isolation, and cleanup. The
implementation owner can hand a readiness packet to Herald; neither route gains
permission to apply infrastructure merely by using the extension.

Worked-example outline:

1. A hypothetical VPC module declares a fast plan-mode unit suite for defaults,
   NAT disabled, tags, output shape, and invalid environment values; provider
   mocks are conditional on the declared Terraform version.
2. A separate apply-mode suite creates a foundation run, passes its output to an
   application run through an explicit state key, and records reverse cleanup
   ordering. The PR gate runs plan-only tests; an authorized merge/release gate
   may schedule apply tests with credentials and cost ownership made explicit.
3. The artifact separates observed plan diffs, expected failures, apply effects,
   cleanup results, and unresolved provider/version issues.

Observable test to require if this candidate is implemented: an invalid
environment fixture must pass only through `expect_failures`, a valid plan must
show no unintended resource diff, and a dependent run must consume the named
foundation output while the receipt records cleanup order. A unit-only run must
not require credentials or create a real resource. This has not been run.

### 3. Daedalus with Muse cross-check: React Native semantic async test contract

Why third: N is a small, high-signal mobile gap that can be tested without
claiming that a passing component fixture proves device, OS, or accessibility
coverage. It complements Daedalus’s behavioral-test owner and routes visual or
accessibility questions to Muse.

Worked-example outline:

1. A hypothetical login form records the installed RNTL major version, loads the
   matching reference, and renders through an explicit provider wrapper.
2. The test finds the sign-in control by role and accessible name, uses awaited
   `userEvent` input/press, awaits an asynchronous alert with `findByRole`, and
   asserts the accessible name/value/state with RNTL matchers.
3. The review packet rejects a test that falls back to a test ID while a semantic
   role exists, puts a press/type side effect inside `waitFor`, omits an await,
   or mixes v13/v14 assumptions without evidence.

Observable test to require if this candidate is implemented: a delayed-error
   fixture must yield the alert through a semantic `findBy*` assertion after the
   awaited interaction, while a deliberately bad fixture containing a
   `waitFor` side effect or unawaited `userEvent` is rejected by the review
   contract. A fixture pass would not establish live-device or universal
   assistive-technology support. This has not been run.

## Lower-ranked follow-ups and explicit non-promotion

- W can refine Muse’s accessibility receipt, but its route and boundary are
  already present; do not create a second general accessibility owner.
- G can supply Arcadia with a level-flow ledger, but the broad game route and
  spatial extensions already cover the ownership boundary.
- M can supply Beacon with a store-listing audit packet if dated first-party
  store evidence is available; the source’s platform/ranking assertions need
  current authoritative refresh before use.
- No selected source is promoted, copied, installed, activated, executed, or
  treated as safe, superior, or legally cleared by this report.

## Open blockers and refresh targets

1. Independent static/semantic supply-chain review remains required before any
   source can influence an internal promotion decision. The intake’s
   `cloned-verified` status and matching hashes are not that review.
2. The compact capability directory is dated relative to current `HEAD`; refresh
   owner/routing evidence before implementing a candidate.
3. Compatibility, performance, safety, and legal conclusions are deferred. In
   particular, no ROS, simulator, Terraform, RNTL, browser, store, or external
   provider behavior was executed or live-verified, and linked source reference
   files were not ingested for this bounded pass.
4. A later implementation would need independently authored eval fixtures,
   negative cases, version pinning, source attribution decisions, rollback or
   revocation paths, and human-owned acceptance—not just a copied checklist.

Changed only:
`C:\dev\eternities-godskills\docs\quarry-intakes\2026-09-20-category-synthesis.md`
