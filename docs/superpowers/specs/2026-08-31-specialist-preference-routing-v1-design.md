# specialist preference routing v1 design

## status

approved for implementation by the existing Godagents two-gate architecture
and Dom's standing continuous Godskills and Godagents instruction on
2026-08-31.

this is a versioned additive routing extension. it does not change the
historically certified compiler, contracts, index, router, runtime, CLI,
adaptive activation, cross-trial evidence, capability eligibility, authority,
model selection, or Godskill bodies. an omitted preference delegates to the
historical runtime and returns its exact result.

## problem

Godagents already distinguishes all-rounder and specialist genomes. both keep
the same eligible capability set unless an explicit prohibition removes a
capability. a specialist additionally derives exact `preferredIds`, but those
ids stop at the Godagents mission binder and never reach the Godskills router.

mapping preferences to prohibitions would make a specialist weaker. applying
them before ordinary qualification would let identity override mission fit,
risk, evidence, effects, context, or authority. leaving them dormant makes the
specialist profile decorative.

## decision

add one optional, receipt-bound `preferredCapabilities` field through the
versioned `intent-preference` entrypoint and specialist-preference modules.
the extension validates and strips the field before historical compilation,
then adds it to a new compiler envelope and digest before preference routing.
omission delegates directly to the old entrypoint and preserves the exact
historical request, compiler receipt, route receipt, digest, and selection.

when preferences are present:

1. the complete routing index verifies that every preferred id exists;
2. explicit forbidden capabilities may not also be preferred;
3. preferred ids are retained in the bounded shortlist so unknown or dropped
   identities cannot influence selection invisibly;
4. all existing qualification and selection metrics run unchanged;
5. only selections equal on coverage, card count, extra capabilities, effect
   cost, context cost, dependency cost, and evidence may use preference count
   before the final lexical-id tie breaker;
6. the route receipt records the exact supplied, qualified, selected, and
   baseline ids plus whether preference changed the result.

preferences never resolve `unresolvedDecisions`, manufacture semantic
evidence, alter the intent compiler's scores, add required capabilities,
expand a candidate family, or make an otherwise rejected card qualified.

## contract

the optional request field is a lexically sorted unique array of at most 32
portable capability ids:

```json
{
  "context": {
    "preferredCapabilities": ["eternities-daedalus"]
  }
}
```

the compiler copies it exactly into the route envelope. the route receipt then
adds:

```json
{
  "preference": {
    "protocolId": "eternities-godskills-specialist-preference-v1",
    "suppliedIds": ["eternities-daedalus"],
    "qualifiedIds": ["eternities-daedalus"],
    "selectedIds": ["eternities-daedalus"],
    "baselineSelectedIds": ["eternities-architect"],
    "semanticCandidateIds": ["eternities-architect", "eternities-daedalus"],
    "applied": true,
    "reason": "equal-quality-tie-break"
  }
}
```

allowed reasons are:

- `equal-quality-tie-break` when the final selection differs from the
  preference-free comparator;
- `selected-without-effect` when a preferred capability wins without needing
  the preference;
- `stronger-nonpreferred-selection` when an earlier historical quality metric
  selects a non-preferred capability;
- `preference-not-route-capable` when a preferred card passes ordinary policy
  qualification but cannot satisfy or join a valid route;
- `preference-not-semantic-candidate` when a preferred card is inspected by
  the union but was not admitted by historical semantic retrieval;
- `no-qualified-preference` when preferred ids exist but none survive ordinary
  qualification;
- `no-selection` when no route is selected;
- `unresolved-decision` when routing pauses for a user decision.

`applied` is true only for `equal-quality-tie-break`. a receipt cannot claim
that preference changed the result without exposing the exact baseline and
selected ids.

## ordering

historical v1 decision policy remains:

```text
coverage>card-count>extra-capabilities>effects>context>dependencies>evidence>id
```

preference-aware routing uses:

```text
coverage>card-count>extra-capabilities>effects>context>dependencies>evidence>preference>id
```

preference score is the number of selected cards not present in the supplied
preference set. lower is better. this permits a specialist composition to
prefer more of its own family only when every earlier metric is equal.

## bounded shortlist

the index first derives and records the historical family and capability
candidate set. it unions preferred ids only so they can be identity-checked
and explicitly qualified or rejected. the router allows only the recorded
historical semantic ids to enter singles or compositions. a preference-only
card therefore cannot become a route or introduce a missing dependency.
existing family, capability, effect, risk, evidence, authority, precondition,
context, and composition gates still decide whether semantic cards may
compete.

the complete union must fit the existing 32-card ceiling. overflow fails
closed instead of truncating semantic candidates or preferences. Godagents
currently resolves at most nine capabilities from any one specialist family.

## executable release root

Godskills emits a deterministic versioned
`specialist-preference-routing-v1` receipt. it binds:

- the current system, router v8, compiler v3, and portable manifest parents;
- the intent and routing contracts, compiler, index, router, runtime, and CLI;
- the additive preference contracts, index, router, runtime, and CLI;
- exact routing cards and family map;
- focused compatibility and preference tests;
- a deterministic equal-quality tie fixture and a stronger-nonpreferred
  fixture;
- proof limits and zero authority expansion.

the receipt is additive. the historical router, compiler, contracts, index,
runtime, CLI, and their receipts remain byte-identical. it does not claim
that preference improves model quality.

## Godagents boundary

Godagents may forward `preferredIds` only when its release pin contains and
verifies the exact preference-routing receipt and executable closure. the
verified root enters the source envelope and durable cycle identity.

the adapter must require exact preference echo in the compiler envelope and
route receipt. it rejects added, removed, reordered, unknown, or prohibited
ids and rejects any `applied` claim that does not reconcile with the recorded
baseline and final selections.

all-rounders and legacy release pins omit the field and preserve historical
behavior. recovery reuses the committed preference result and performs no new
route, classification, or preference decision.

## rejection matrix

the implementation rejects:

- duplicate, unsorted, empty, unknown, or more than 32 preferred ids;
- an id that is both preferred and explicitly forbidden;
- a preferred id omitted from the router's supplied cards;
- shortlist overflow;
- preference used before any ordinary quality metric;
- preference used to clear an unresolved decision;
- preference used to qualify a policy-rejected card;
- a preference-only card used to expand the historical semantic route set;
- a false `applied` flag or changed baseline selection;
- a Godagents compiler or route result that changes the expected preference
  set;
- a specialist preference sent without the verified release root;
- recovery under another preference root or preference set.

## proof boundary

this milestone can prove deterministic preference-only tie breaking, exact
cross-repository forwarding, backward-identical omission behavior, durable
identity binding, and absence of tested authority expansion.

it cannot prove that specialization improves output quality, that one family
is objectively best for a mission, arbitrary provider behavior, unseen
mission routing, executed adaptive review, model selection, Lunari readiness,
or protection from a host that controls every pinned repository byte.
