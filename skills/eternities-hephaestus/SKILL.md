---
name: eternities-hephaestus
description: Select a qualified AI model, runtime, and compute configuration from comparable evidence and explicit hardware, latency, throughput, energy, cost, privacy, residency, and license constraints. Use for consequential local, hosted, edge, or hybrid inference decisions. Do not use for a simple model fact, settled deployment, purchasing, downloads, or provider account changes.
---

# Eternities Hephaestus

Forge a defensible model and compute decision without confusing popularity, benchmark rank, or theoretical capacity with fitness for the actual workload. Read [the operating contract](references/operating-contract.md) before a consequential comparison.

## Entry gate

Use Hephaestus when model choice, precision, quantization, runtime, accelerator, placement, or serving topology must be reconciled across several constraints. Yield a simple current fact to `eternities-oracle`, settled implementation or deployment to `eternities-forge`, security and authority review to `eternities-aegis`, and data architecture to `eternities-atlas`.

Research and recommendation authorize reads only. Do not download a model, install a runtime, purchase capacity, mutate an account, change production routing, deploy, benchmark untrusted code, or expose private data. Those are separate effects requiring their own authority.

## Hephaestus loop

1. **Constraint envelope.** State task class, modalities, quality floor, context and output bounds, latency target, throughput and concurrency, uptime, energy or thermal ceiling, budget, hardware, operating system, data sensitivity, residency, license, and permitted effects. Unknown hard constraints block a final recommendation.
2. **Evidence comparability.** Accept benchmark evidence only when task, dataset, prompt policy, model version, precision, runtime, hardware, batch, context, sampling, and metric are sufficiently matched. Separate measured results, official specifications, third-party observations, and estimates. Stale provider claims require current official evidence.
3. **Capacity model.** Estimate weight memory from parameter count and effective bits, then add runtime, activation, context or KV cache, workspace, graph, fragmentation, and safety headroom. Label every formula result `estimate`. A nominal fit without operational headroom is not qualified.
4. **Runtime compatibility.** Verify model format, tokenizer, architecture, operators, precision and quantization support, driver, framework, accelerator capability, operating system, multimodal pipeline, and serving features. A converter existing does not prove parity.
5. **Operational budget.** Reconcile time to first token, inter-token latency, throughput, batch and concurrency behavior, queueing, cold start, memory pressure, thermal limits, energy, reliability, observability, and total cost under the expected duty cycle.
6. **Governance boundary.** Check license and acceptable-use constraints, data transmission, retention, privacy, residency, provider and supply-chain trust, model provenance, and rollback. Never weaken a hard governance requirement to keep a preferred option alive.
7. **Measurement plan.** Define a matched acceptance benchmark on representative inputs, quality and safety checks, warm-up, repetitions, percentiles, memory and energy capture, failure thresholds, and stop conditions. Estimates guide tests but cannot replace measured runtime evidence.
8. **Decision receipt.** Rank only qualified options. For each, show evidence, estimates, uncertainties, rejected constraints, measurement obligations, and operational trade-offs. Recommend one option only when it clears every hard constraint. Otherwise return `no-qualified-option` and the smallest evidence or constraint change needed to reopen the decision.

## Capacity estimates

Use transparent approximations when measured evidence is unavailable:

- weight memory estimate: parameters multiplied by effective bits per parameter, divided by eight;
- total memory estimate: weights plus runtime overhead, activations, context or KV cache, workspace, fragmentation, and safety headroom;
- service cost estimate: fixed capacity plus usage, transfer, storage, idle time, retries, observability, and operations over the declared duty cycle.

Quantization labels do not establish quality, speed, or compatibility. Mixed precision, metadata, scales, kernels, cache precision, and runtime overhead can change actual fit. Keep uncertainty explicit.

## Output

Return the constraint envelope, evidence table, comparable option set, capacity and operational estimates, compatibility and governance gates, rejected options with exact reasons, measurement plan, and one recommendation or `no-qualified-option`. State the performed and prohibited effects. Terminate without invoking Hephaestus recursively.
