# Governed vocabulary and relationship checks

Use when otherwise well-formed records must obey a declared terminology,
taxonomy, relationship model or application constraint set. A simple JSON edit
or free-form explanation needs no registry audit. This is a validation method,
not an ontology engine, external lookup service or permission to publish data.

## Bind the rules before judging the records

Identify the record snapshot, namespace and vocabulary version, applicable rule
set and intended consumer. Keep stable identifiers separate from display labels.
A term absent from the wrong version is not necessarily a typo. If the required
rules cannot be obtained within scope, report which checks are unavailable;
do not substitute a similarly named vocabulary or invent constraints.

State whether the task enforces application constraints or requires formal
ontology reasoning. A curated lookup and parent traversal must not be presented
as a complete reasoning or consistency engine. List the checks actually
supported: term membership, applicability, value types, cardinality, units,
relationships and completeness can have different coverage.

## Check separate failure classes

1. Resolve each class and property identifier against the bound vocabulary.
   Apply only declared aliases or normalization. Keep unknown and ambiguous
   labels distinct; a fuzzy suggestion is a proposed correction, not a match.
2. Check a property's applicability to the subject and a relationship's allowed
   target using the declared rules. Property existence alone is insufficient.
   Honor supported inheritance explicitly; similar names and substrings do not
   establish ancestry. Bound traversal, detect cycles and missing parents, and
   surface unsupported cases instead of silently passing them.
3. Evaluate required, recommended and optional fields separately. Check values
   against the declared presence/type rules: null, an empty string and zero are
   not interchangeable. Missing required fields cannot be compensated for by
   many optional fields or a high aggregate completeness score.
4. Separate violations from advisory warnings and checks not performed. Attach
   each diagnostic to a record or relationship locator and the relevant rule.
   A warning needs an explicit disposition when it affects acceptance; it must
   neither disappear into an average nor automatically become a hard error.

Preserve original records. Propose corrections with their evidence and possible
ambiguity; apply only authorized changes, then revalidate against the same
declared rules. Changing the rules is a separate reviewed decision, not a way
to make failing data pass.

## Verify the consumer boundary

Use a small valid control plus an unknown term, a valid property on the wrong
subject, an invalid relationship target, a supported subclass, a missing required
field despite many optional fields, and a vocabulary-version mismatch. Include
valid zero/false values where allowed and malformed hierarchy cases. Check that
the actual consumer blocks or qualifies invalid/incomplete results as intended;
a plausible report alone does not prove that downstream behavior.

Return the rule/version binding, performed and unavailable checks, located
diagnostics, unresolved warnings, and correction/revalidation outcome. A result
establishes conformity only within that tested scope. It does not establish
real-world truth, complete ontology consistency, permission, or successful
publication. Stop when the requested validation or authorized repair is verified,
or when missing rules or unresolved ambiguity prevent a justified conclusion.
