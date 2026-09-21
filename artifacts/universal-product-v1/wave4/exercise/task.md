# Structured-output consumer exercise

Implement `consume(event, context)` as a pure exported function in `consumer.mjs`.
This is an inert test adapter: do not call a provider, write files at runtime or
perform any external effect. Use standard JavaScript and Node built-ins only.

The event is `{transport, payload}`. Transport is `complete`, `streaming`,
`refused`, `unavailable` or `cancelled`. Only complete payloads may be consumed.
Streaming returns `{status:'pending'}`; the other non-complete known states return
`{status:'unavailable',reason:<string>}`. Unknown/malformed events are invalid.
The payload of a complete event is a JSON string, maximum 4096 UTF-8 bytes.
Duplicate JSON object keys are outside this exercise's input contract; ordinary
JSON parsing is acceptable. This does not qualify duplicate-key rejection.

Context is `{requestId,revision,allowedIds}`. Treat it as supplied trusted data;
allowedIds is an array of distinct string IDs. Require exact payload binding to
requestId and revision. Version must be the integer 1.

Payload variants are closed objects (no unknown fields):

- Complete: `{version:1,requestId,revision,outcome:'complete',records:[...]}`.
  Each record is exactly `{id,enabled,score}`: ID must occur in allowedIds and
  once at most; enabled must be boolean; score must be a finite number in [0,1]
  or null. An empty record list is valid. Return `{status:'accepted',records}`.
- Abstained: `{version:1,requestId,revision,outcome:'abstained',reason:<nonempty
  string>}`. Return `{status:'unavailable',reason}`; never turn it into empty
  successful records.

Any invalid complete payload returns `{status:'invalid',reason:<string>}`
without throwing or changing event/context. Do not coerce types, invent records,
accept stale answers, retry the provider, or execute operations. Do not echo the
raw payload in error messages. Define usable reason categories, not exact prose.

Write focused tests and a short README stating limitations. Output only those
three files in the assigned temporary directory. You may read the candidate
skill supplied in your prompt. Do not read other exercise artifacts or tests.
