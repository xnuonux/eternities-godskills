# Structured-output consumer

`consumer.mjs` exports a pure `consume(event, context)` adapter. It handles
transport state first, accepts only a completed JSON payload of at most 4096
UTF-8 bytes, binds `requestId` and `revision` exactly to the supplied context,
and validates the versioned closed-object contract without coercion. Valid
complete records return `accepted`; an explicit abstention and known provider
unavailability remain unavailable states.

Run the focused tests with:

```text
node --test consumer.test.mjs
```

Limitations: duplicate JSON object keys are outside the exercise contract and
are therefore left to ordinary `JSON.parse` behavior. The context is treated
as trusted input, with only enough shape checking to keep malformed calls from
throwing. The adapter performs no provider calls, retries, persistence,
execution, or external effects; tests do not establish any hidden scorer result.
