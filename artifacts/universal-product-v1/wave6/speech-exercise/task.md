# Speech preparation request

Prepare a usable chunk plan for input.json. No renderer or audio files are
available. Do not call a provider, browse, install software, or create audio.
Use the supplied portable-speech-chunk-alignment skill. You may use built-in
local utilities for arithmetic and Unicode inspection.

Keep the source text unchanged. Do not normalize the combining accent, expand
the circled numeral, or turn the accepted reading into a guessed engine-specific
substitution. Treat the protected pronunciation range as one indivisible unit.
Use the declared provisional planning budget, not an assumed model token limit.
Make useful progress on portions that fit; represent an unsatisfied protected
unit explicitly. Whitespace and punctuation still need to be accounted for.

Write candidate.json with these fields:

- sourceId, revision, originalText, offsetUnit, rangeConvention, normalization,
  locale, and policyRevision (choose a stable identifier for your plan).
- budget: maximum, basis, and rendererFitVerified (boolean).
- chunks: ordered records containing id, sourceRange [start,end], text,
  graphemeCount, pronunciationIds, and status ("planned" or "blocked"). Add a
  reason to blocked records. All source text must be covered exactly once;
  blocked records are accounted-for text, not ready-to-render chunks.
- pronunciationDecisions: preserve supplied identity, span, reading, status,
  and note what is not verified.
- constraints: actionable unresolved constraints, not a blanket refusal.
- audio: rendered, listened, emittedSegments, and completionClaim. All refer
  to work actually done during this task, not the supplied historical scenario.
- historicalDisposition: retainedRecords, assemblyAllowed, reasons, and
  nextAction for the separate historicalAttemptScenario. Retain the distinction
  between supplied metadata and independently verified artifacts.

Write at most200 words in candidate-notes.md explaining any tradeoff, including
whether the historical records could form a completed current-revision result.
Do not inspect the protocol, other skills, source quarry, existing exercise
results, or any evaluation criteria. You own only the two candidate files.
