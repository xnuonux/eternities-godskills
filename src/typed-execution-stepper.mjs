import { sha256 } from "./io.mjs";
import { verifyTypedMissionMethod } from "./typed-composition.mjs";

const EXECUTION_PROTOCOL = "eternities-typed-mission-execution-stepper-v1";
const STEP_PROTOCOL = "eternities-typed-mission-execution-step-v1";
const COMPLETION_PROTOCOL = "eternities-typed-mission-execution-completion-v1";
const EXECUTIONS = new WeakMap();
const STEPS = new WeakMap();
const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;

export class TypedExecutionStepperError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "TypedExecutionStepperError";
    this.code = code;
  }
}

function failure(code, message, cause) {
  return new TypedExecutionStepperError(code, message, cause ? { cause } : undefined);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function object(value, label, code = "execution-invalid") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw failure(code, `${label} must be an object`);
  }
  return value;
}

function exactKeys(value, expected, label, code = "execution-invalid") {
  object(value, label, code);
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw failure(code, `${label} fields are invalid`);
  }
}

function jsonKind(value) {
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return "object";
  }
  return null;
}

function validateJson(value, label, seen = new Set(), code = "execution-invalid") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (!value || typeof value !== "object" || seen.has(value)) {
    throw failure(code, `${label} is not finite acyclic JSON data`);
  }
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
      throw failure(code, `${label} is not a dense JSON array`);
    }
  } else if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw failure(code, `${label} is not a plain JSON object`);
  }
  seen.add(value);
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) validateJson(child, `${label}.${key}`, seen, code);
  seen.delete(value);
}

function requireValueKind(value, expected, label, code = "execution-invalid") {
  validateJson(value, label, new Set(), code);
  if (jsonKind(value) !== expected) throw failure(code, `${label} must be a JSON ${expected}`);
}

function verifyMissionInputs(method, missionInputs) {
  object(missionInputs, "typed mission inputs");
  const expected = method.missionInputs.map(({ artifactId }) => artifactId).sort(lexical);
  const actual = Object.keys(missionInputs).sort(lexical);
  if (expected.length !== actual.length || expected.some((key, index) => key !== actual[index])) {
    throw failure("execution-invalid", "typed mission input set is not exact");
  }
  for (const input of method.missionInputs) {
    requireValueKind(
      missionInputs[input.artifactId],
      input.jsonKind,
      `mission input ${input.artifactId}`,
    );
  }
}

function validateOutputEnvelope(output, node, missionId) {
  const code = "output-invalid";
  exactKeys(
    output,
    ["schemaVersion", "capabilityId", "missionId", "slots"],
    `${node.capabilityId} output`,
    code,
  );
  if (output.schemaVersion !== 1 || output.capabilityId !== node.capabilityId
      || output.missionId !== missionId) {
    throw failure(code, `${node.capabilityId} output envelope identity is invalid`);
  }
  object(output.slots, `${node.capabilityId} output slots`, code);
  const expected = node.outputContract.slots.map(({ slotId }) => slotId).sort(lexical);
  const actual = Object.keys(output.slots).sort(lexical);
  if (expected.length !== actual.length || expected.some((key, index) => key !== actual[index])) {
    throw failure(code, `${node.capabilityId} output slots are not closed and complete`);
  }
  for (const slot of node.outputContract.slots) {
    requireValueKind(
      output.slots[slot.slotId],
      slot.jsonKind,
      `${node.capabilityId}.${slot.slotId}`,
      code,
    );
  }
}

function stateFor(registry, execution) {
  assertTypedMissionExecution(execution);
  const state = EXECUTIONS.get(execution);
  verifyTypedMissionMethod({ registry, method: state.method });
  if (registry.registryDigest !== state.registryDigest) {
    throw failure("registry-mismatch", "typed mission execution registry changed");
  }
  return state;
}

function buildReadyStep(execution, state) {
  const node = state.method.nodes[state.index];
  const nodeLinks = state.method.links.filter(({ consumer }) => consumer.nodeId === node.nodeId);
  const slots = {};
  const handoffs = [];
  for (const link of nodeLinks) {
    let value;
    if (link.producer.kind === "mission-input") {
      value = state.missionInputs[link.producer.inputId];
    } else {
      value = state.nodeOutputs.get(`${link.producer.nodeId}\0${link.producer.slotId}`);
    }
    if (value === undefined) {
      throw failure("execution-invalid", `artifact ${link.artifactId} is unavailable at execution`);
    }
    slots[link.consumer.slotId] = structuredClone(value);
    handoffs.push({
      artifactId: link.artifactId,
      producer: structuredClone(link.producer),
      consumer: structuredClone(link.consumer),
      valueDigest: digest(value),
    });
  }
  const input = deepFreeze({
    schemaVersion: 1,
    capabilityId: node.capabilityId,
    missionId: state.method.missionId,
    slots,
  });
  const unsigned = {
    schemaVersion: 1,
    protocolId: STEP_PROTOCOL,
    status: "ready",
    missionId: state.method.missionId,
    methodDigest: state.method.methodDigest,
    missionInputDigest: state.missionInputDigest,
    order: state.index,
    nodeId: node.nodeId,
    phase: node.phase,
    capabilityId: node.capabilityId,
    activationDecisionDigest: node.activation.decisionDigest,
    input,
    inputDigest: digest(input),
    authorityExpanded: false,
  };
  const projection = deepFreeze({ ...unsigned, stepDigest: digest(unsigned) });
  const current = { projection, node, handoffs };
  state.current = current;
  STEPS.set(projection, { execution, state, current });
  return projection;
}

function buildCompletion(state) {
  const outputs = {};
  const outputEvidence = [];
  for (const output of state.method.missionOutputs) {
    const value = state.nodeOutputs.get(`${output.nodeId}\0${output.slotId}`);
    if (value === undefined) {
      throw failure("execution-invalid", `mission output ${output.outputId} is unavailable`);
    }
    outputs[output.outputId] = structuredClone(value);
    outputEvidence.push({ ...output, valueDigest: digest(value) });
  }
  const unsignedReceipt = {
    schemaVersion: 1,
    protocolId: "eternities-typed-composition-execution-v1",
    missionId: state.method.missionId,
    methodDigest: state.method.methodDigest,
    missionInputDigest: state.missionInputDigest,
    nodeExecutions: structuredClone(state.nodeExecutions),
    handoffs: structuredClone(state.handoffs),
    missionOutputs: outputEvidence,
    authorityExpanded: false,
  };
  const result = deepFreeze({
    outputs,
    receipt: { ...unsignedReceipt, executionDigest: digest(unsignedReceipt) },
  });
  const unsigned = {
    schemaVersion: 1,
    protocolId: COMPLETION_PROTOCOL,
    status: "completed",
    missionId: state.method.missionId,
    methodDigest: state.method.methodDigest,
    missionInputDigest: state.missionInputDigest,
    result,
    authorityExpanded: false,
  };
  state.completion = deepFreeze({ ...unsigned, completionDigest: digest(unsigned) });
  return state.completion;
}

export function assertTypedMissionExecution(value) {
  if (!value || typeof value !== "object" || !EXECUTIONS.has(value)) {
    throw failure("execution-provenance", "typed mission execution lacks private provenance");
  }
  return value;
}

export function beginTypedMissionExecution(input = {}) {
  exactKeys(input, ["registry", "method", "missionInputs"], "typed mission execution request");
  const { registry, method, missionInputs: inputMissionInputs } = input;
  verifyTypedMissionMethod({ registry, method });
  let missionInputs;
  try {
    missionInputs = structuredClone(inputMissionInputs);
  } catch (error) {
    throw failure("execution-invalid", "typed mission inputs are not cloneable JSON data", error);
  }
  verifyMissionInputs(method, missionInputs);
  deepFreeze(missionInputs);
  const missionInputDigest = digest(missionInputs);
  const execution = deepFreeze({
    schemaVersion: 1,
    protocolId: EXECUTION_PROTOCOL,
    missionId: method.missionId,
    methodDigest: method.methodDigest,
    missionInputDigest,
    authorityExpanded: false,
  });
  EXECUTIONS.set(execution, {
    registryDigest: registry.registryDigest,
    method,
    missionInputs,
    missionInputDigest,
    index: 0,
    current: null,
    completion: null,
    nodeOutputs: new Map(),
    nodeExecutions: [],
    handoffs: [],
  });
  return execution;
}

export function nextTypedMissionExecutionStep(input = {}) {
  exactKeys(input, ["registry", "execution"], "typed mission next-step request");
  const { registry, execution } = input;
  const state = stateFor(registry, execution);
  if (state.completion) return state.completion;
  if (state.current) return state.current.projection;
  if (state.index === state.method.nodes.length) return buildCompletion(state);
  return buildReadyStep(execution, state);
}

export function commitTypedMissionExecutionStep(input = {}) {
  exactKeys(
    input,
    ["registry", "execution", "step", "output"],
    "typed mission step commit request",
  );
  const { registry, execution, step, output } = input;
  const state = stateFor(registry, execution);
  const provenance = STEPS.get(step);
  if (!provenance) {
    throw failure("step-provenance", "typed mission step lacks private provenance");
  }
  if (provenance.execution !== execution || provenance.state !== state) {
    throw failure("step-owner-mismatch", "typed mission step belongs to another execution");
  }
  if (!state.current || state.current !== provenance.current
      || state.current.projection !== step || state.index !== step.order) {
    throw failure("step-stale", "typed mission step is no longer current");
  }
  let closedOutput;
  try {
    closedOutput = structuredClone(output);
  } catch (error) {
    throw failure("output-invalid", "typed mission output is not cloneable JSON data", error);
  }
  validateOutputEnvelope(closedOutput, state.current.node, state.method.missionId);
  const { node, handoffs } = state.current;
  for (const [slotId, value] of Object.entries(closedOutput.slots)) {
    state.nodeOutputs.set(`${node.nodeId}\0${slotId}`, deepFreeze(structuredClone(value)));
  }
  state.handoffs.push(...structuredClone(handoffs));
  state.nodeExecutions.push({
    nodeId: node.nodeId,
    capabilityId: node.capabilityId,
    activationDecisionDigest: node.activation.decisionDigest,
    inputDigest: step.inputDigest,
    outputDigest: digest(closedOutput),
  });
  state.index += 1;
  state.current = null;
  return nextTypedMissionExecutionStep({ registry, execution });
}
