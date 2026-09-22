# Black-box test-writing task

Write `tests.mjs`: Node tests for an ES module that exports `coalesce(items)`.

## Interface

- The absolute filesystem path of the module under test is in `process.env.TARGET_MODULE`. Import `coalesce` from it with `pathToFileURL` from `node:url`, e.g. `await import(pathToFileURL(process.env.TARGET_MODULE).href)`.
- Use Node built-ins only. No external dependencies and no network access.
- Do not change any implementation, do not read implementation files (other than importing the module under test), and do not enumerate directories.
- The process must exit with code 0 when behavior conforms to the contract below, and nonzero otherwise.

## Contract

- Input is an array of objects with `id` (a nonempty string) and `amount` (a finite number). Unrelated optional fields are allowed and ignored.
- Reject with `TypeError`: a non-array input; a null or non-object element; an empty or non-string `id`; a non-number or nonfinite `amount`. The entire call must reject; never return a partial result.
- Aggregate `amount` by exact, case-sensitive `id`, retaining order of first appearance. Empty input returns `[]`.
- Return fresh objects containing only `id` and `amount`. Do not mutate input objects and do not retain references to them.
- `0` and negative amounts are valid. Numeric strings are invalid.
- `'__proto__'` and `'constructor'` are ordinary valid ids.
- Sum with ordinary JavaScript addition in input order. There are no rounding, currency, overflow-handling, or Unicode-normalization requirements; do not invent such requirements.
