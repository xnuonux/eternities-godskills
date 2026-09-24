# Creator sponsorship obligation method

## Purpose and authority

Use this Beacon method to organize a human-reviewed creator-sponsorship plan, obligation register, and internal recap. Keep one minimized row for each distinct promised deliverable and a separate campaign summary. The record should let an owner distinguish what was proposed, explicitly agreed, observed, checked, and included in an internal report.

This is a decision-tracking method, not a contract interpretation, legal or disclosure review, rights grant, performance certification, or action authorization. A stored URL, note, status, license label, or Boolean field is not proof by itself. Before an assertion is treated as supported, the named human decision owner must inspect the underlying evidence, confirm that the decision-maker has relevant authority, and record the evidence reference and decision date. A software check or this prose cannot perform that validation.

Do not send a pitch, accept terms, sign, publish or schedule content, disclose on someone's behalf, use or adapt creator media, transfer data, or pay anyone through this record. Each external effect needs its own explicit scope and authorization from the responsible human owner. Route creator-facing content, disclosure, and publication questions to the appropriate owner, including Chorus where applicable.

## Record what is known

Keep only the information needed for the decision. Use stable local campaign and obligation identifiers, a minimized partner reference, a deliverable and acceptance-criteria reference, an owner, and references to evidence held by its source owner. Avoid copying media, correspondence, personal details, or full agreements into the register.

For each obligation, distinguish:

- lifecycle state: proposed, agreed, delivered, verified, or reported;
- proposal, due, agreement, delivery, verification, and internal-report event times, as applicable;
- agreement outcome: pending, agreed, or declined, with the responsible owner and evidence for a decided outcome;
- disclosure and usage decisions separately, each with an owner, state, decision time, and underlying evidence reference when decided;
- the exact proposed or owner-reviewed usage scope; and
- measurement definition, source, reporting period, limits, and whether evidence is available.

Use unambiguous timestamps with timezone. A date-only value is insufficient when events on that date could occur in the wrong order; add a time or other owner-verifiable ordering evidence. Never alter an actual event time to make the record appear compliant.

## Chronology is a gate

For a normal agreed sponsorship obligation, the event sequence is:

**proposed → agreed → delivered → verified → reported**

Its supported event times must be nondecreasing: proposedAt ≤ agreedAt ≤ deliveredAt ≤ verifiedAt ≤ reportedAt. Do not populate a later event time until that event has happened and its evidence is available. A due time is a planned commitment, not an observed event; set it no earlier than the proposal and, once terms are agreed, no earlier than the agreement. Delivery after the due time may be recorded as late without changing either actual time.

An observed event outside that sequence is an exception, not permission to reorder or backdate it. Preserve the facts, mark the row unresolved at its last supported state, and ask the responsible owner to determine whether the item was unsolicited, outside the agreement, or covered by a separately evidenced amendment. Do not retroactively turn a later agreement into proof that an earlier delivery was sponsored or authorized. If two same-day events cannot be ordered from the evidence, hold the transition until the human owner resolves the sequence.

## Agreement decision and evidence

At proposal, identify who can decide and keep the outcome pending. An agreed outcome requires that owner to review the underlying agreement evidence and record the decision time and evidence reference before the row enters agreed. A declined outcome also requires the named decision owner, decision time, and owner-held evidence reference; “declined” without those details is an unresolved assertion, not a complete decision record. A declined obligation remains at proposed and does not advance to delivery, verification, or reporting as an agreed sponsorship commitment. Preserve the decline; any later agreement needs a new dated, evidenced owner decision rather than silent replacement of the earlier state.

The evidence reference only helps a person locate the record. It does not establish that the record is authentic, current, complete, or approved. The human owner remains responsible for checking those facts.

## Usage scope: specific, evidenced, or unresolved

Record usage independently from the sponsorship agreement and from delivery acceptance. Any proposed or approved use must identify, at minimum:

- each covered asset by a stable, finite asset identifier;
- the exact platform, account, placement, and use format;
- the specific purpose and whether use is paid, organic, or both;
- the geographic scope stated in the owner-evidenced grant—named places when limited, or exact worldwide wording when that is what the grant says;
- the exact duration term, including dated start/end times with timezone or explicit expiry/no-expiry language from the underlying grant; and
- whether edits, derivative versions, boosting/whitelisting, exclusivity, or sublicensing are allowed, denied, or separately unresolved.

Generic wildcard or open-ended placeholders—such as “all assets,” “all channels,” “any territory,” “every use,” or “perpetual” without exact supporting terms—remain unresolved. They are not permission. Unknown, missing, conflicting, expired, or unverified rights assertions are also never permission, even when accompanied by a general license label, unfamiliar clearance field, rightsCleared-style Boolean, or nonempty reference.

A specifically negotiated worldwide or indefinite grant may be possible; this method neither prohibits it nor decides its legal effect. For unusually broad or indefinite terms, require the exact underlying terms to be held as evidence, validation by the appropriately authorized human owner, and qualified review appropriate to the matter before representing the decision as resolved. Do not infer worldwide coverage from silence, turn a summary field into blanket rights, or invent permission beyond the evidenced terms. If the owner cannot state the scope from reviewed evidence, leave it unresolved and do not use the material.

An approved usage decision records an owner's evidenced decision for the stated scope; it does not widen that scope or replace any required legal, platform, creator, or publication review. A decision for one asset, account, purpose, territory, or period does not transfer to another. Any change requires a new owner-reviewed decision.

## Disclosure and measurement

Keep disclosure decision-making separate from permission to use media. Name the responsible owner and record pending, approved, declined, or not-applicable only when the owner has reviewed the relevant evidence; a decided state needs a date and evidence reference. A pending or declined disclosure decision is not approval to publish. “Not applicable” requires a reason and an owner reference, not an empty field. Route any public-facing content or disclosure execution to its authorized human owner; use Chorus for editorial/publication work when appropriate.

Define measurement before the recap: metric and unit, eligible population, denominator, start/end window and timezone, source and source owner, attribution limits, and known missingness. Report only supplied or owner-authorized observations. Separate observed values from interpretation and proposed experiments; identify denominators and data gaps. If the source or value is unavailable, record unavailable and why. Do not estimate a result, imply causality, or promise performance.

## Advance, hold, and finish

Move a row only when its current state has the required event evidence and the named human owner has checked the underlying record. Delivery evidence shows receipt, not acceptance or permission. Verification compares the observed deliverable with the evidenced acceptance criteria and names the reviewer, date, and result. Reporting means only that evidence was included in an internal, owner-reviewed recap; it does not certify campaign completion, rights, public disclosure, or outcome quality.

When evidence, chronology, decision authority, usage scope, or disclosure status is incomplete or contradictory, preserve actual facts and the last supported state, identify the human owner, and leave the matter unresolved. Finish the local packet when every in-scope row is traceable to its required evidence, exceptions and open decisions are visible, and the recap separates observation from interpretation. Human-owner validation remains necessary even when every field appears complete.
