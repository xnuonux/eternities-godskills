export async function recoverRequest(options) {
  if (options === null || typeof options !== "object") {
    throw new TypeError("options must be an object");
  }

  const {
    send,
    idempotencyKey,
    maxAttempts,
    deadlineMs,
    now,
    sleep,
    signal,
  } = options;

  if (typeof idempotencyKey !== "string" || idempotencyKey.length === 0) {
    throw new TypeError("idempotencyKey must be a nonempty string");
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts <= 0) {
    throw new TypeError("maxAttempts must be a positive integer");
  }
  if (!Number.isFinite(deadlineMs)) {
    throw new TypeError("deadlineMs must be finite");
  }
  if (typeof send !== "function") {
    throw new TypeError("send must be callable");
  }
  if (typeof now !== "function") {
    throw new TypeError("now must be callable");
  }
  if (typeof sleep !== "function") {
    throw new TypeError("sleep must be callable");
  }

  const isCancelled = () => signal?.aborted === true;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (isCancelled()) {
      return { status: "cancelled", attempts };
    }
    const dispatchTime = now();
    if (isCancelled()) {
      return { status: "cancelled", attempts };
    }
    if (dispatchTime >= deadlineMs) {
      return { status: "deadline", attempts };
    }

    attempts += 1;
    const response = await send(idempotencyKey);
    const responseStatus = response?.status;

    if (responseStatus === 200) {
      return { status: "success", attempts, value: response.value };
    }
    if (responseStatus !== 429) {
      return { status: "terminal", attempts, responseStatus };
    }

    const retryAfterMs = response?.retryAfterMs;
    if (
      typeof retryAfterMs !== "number" ||
      !Number.isFinite(retryAfterMs) ||
      retryAfterMs < 0
    ) {
      return { status: "invalid-guidance", attempts };
    }
    if (attempts >= maxAttempts) {
      return { status: "exhausted", attempts };
    }

    if (isCancelled()) {
      return { status: "cancelled", attempts };
    }
    const currentTime = now();
    if (isCancelled()) {
      return { status: "cancelled", attempts };
    }
    if (currentTime >= deadlineMs) {
      return { status: "deadline", attempts };
    }
    if (currentTime + retryAfterMs >= deadlineMs) {
      return { status: "deadline", attempts };
    }
    if (isCancelled()) {
      return { status: "cancelled", attempts };
    }

    await sleep(retryAfterMs);
  }

  return { status: "exhausted", attempts };
}
