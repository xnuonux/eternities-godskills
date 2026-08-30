# Godagents plus Godskills ... bounded Terra integration trial

## outcome

one `gpt-5.6-terra` subagent drove the real Godagents selected-only adapter
against the certified Godskills worktree at commit `170d215`. the trial used
ordinary-language missions and the fixture host context. it made no provider
call, activated no host profile, loaded no credential, invoked no Realm hand,
and changed no genome, Realm Contract, persistent identity, or external state.

this was a Terra-driven integration trial. it did not install Terra as a
persistent Godagent cortex. the fixture genome still permits only its declared
fixture cortex adapters.

## host boundary

the adapter received the fixture host context from the Godagents repository:

- permitted effects: `local-read`, `local-write`;
- available authority: `local-read`, `local-write`, `realm:write`;
- available preconditions: `realm-present`, `realm-observed`;
- maximum risk: `moderate`;
- minimum evidence confidence: `verified`;
- maximum composition: `3`.

## three missions

| ordinary mission | result | selected capability or gate |
| --- | --- | --- |
| `diagnose and recover an API integration that is failing under rate limits without expanding authority` | `needs-decision` | `eternities-hermes` was the sole candidate, but the router required `authority:explicit execution or network authority when applicable` and selected nothing |
| `design and verify an accessible asynchronous interface for a consequential user workflow` | `selected` | `eternities-muse` through `skills/eternities-muse/SKILL.md` |
| `take a raw product idea through evidence, architecture, implementation, security review, and launch-readiness planning` | `needs-decision` | candidates were `eternities-forge` and `eternities-prometheus`; unresolved gates were `intent-ambiguous`, `authority:authorized-security-scope`, `authority:repository-write`, `precondition:repository-present`, and `precondition:settled-outcome` |

all three compiler envelopes preserved authority and effect subsets. the API
mission did not quietly select a network recovery method when the request
explicitly prohibited authority expansion. the entire product lifecycle did
not collapse into an unjustified mega-composition.

## smallest honest product lifecycle

the lifecycle mission was split into five phase requests because evidence,
architecture, mutation, security, and release have different authority and
task-state gates:

| phase request | result | selected capability or gate |
| --- | --- | --- |
| investigate a consequential question from exact local repository evidence for the raw product idea | `needs-decision` | `eternities-oracle` identified; requires `authority:external-read` |
| make and record a durable architecture decision | `selected` | `eternities-architect` through `skills/eternities-architect/SKILL.md` |
| deliver a consequential feature across several engineering phases from the settled architecture | `needs-decision` | `eternities-forge` identified; requires `repository-write`, `repository-present`, and `settled-outcome` |
| threat model a consequential system | `needs-decision` | `eternities-aegis` identified; requires `authorized-security-scope` and `authorized-target` |
| prepare a release boundary from verified changes without deployment or publication | `selected` | `eternities-herald` through `skills/eternities-herald/SKILL.md` with no release effect |

this phase separation is a feature. each consequential transition must be
earned. `eternities-herald` can prepare a local release boundary without
silently gaining deployment or publication authority.

## focused verification

the trial ran the relevant Godagents adapter checks:

```powershell
node --test --test-name-pattern 'adapter preserves|needs-decision|unknown statuses|compiler result cannot add authority' tests/godskills-adapter.test.mjs
```

result: 4 passed, 0 failed.

it also ran the focused host-policy checks:

```powershell
node --test --test-name-pattern 'host policy loads|host policy rejects' tests/host-policy.test.mjs
```

result: 2 passed, 0 failed.

the local transport used
`C:\dev\eternities-godskills\.worktrees\godagents-godskills-examples` as its
repository root and created transient request and result files only beneath the
operating-system temp directory. the final inspection found zero remaining
`eternities-godskills-*` trial workspaces.

## proof boundary

the trial proves the observed local adapter and router behavior for these exact
requests, repositories, fixture context, and commits. it does not prove Terra
as a persistent cortex, arbitrary live-model interpretation, production host
safety, external execution, universal routing quality, or future adapter
compatibility.
