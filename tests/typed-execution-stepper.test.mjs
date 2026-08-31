import assert from "node:assert/strict";
import test from "node:test";

import {
  compileTypedMissionMethod,
  executeTypedMissionMethod,
} from "../src/typed-composition.mjs";
import {
  assertTypedMissionExecution,
  beginTypedMissionExecution,
  commitTypedMissionExecutionStep,
  nextTypedMissionExecutionStep,
} from "../src/typed-execution-stepper.mjs";
import {
  buildFixture,
  canaryExecutors,
  missionInputs,
} from "./helpers/typed-composition-fixture.mjs";

function expectCode(code) {
  return (error) => {
    assert.equal(error?.name, "TypedExecutionStepperError");
    assert.equal(error?.code, code);
    return true;
  };
}

async function compiled(t) {
  const fixture = await buildFixture(t);
  return {
    ...fixture,
    method: compileTypedMissionMethod(fixture),
  };
}

test("emits one branded typed step at a time and reproduces the reference execution", async (t) => {
  const fixture = await compiled(t);
  const { acceptanceBoundary, executors } = canaryExecutors();
  const execution = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  assert.equal(assertTypedMissionExecution(execution), execution);
  assert.equal(Object.isFrozen(execution), true);
  assert.deepEqual(Object.keys(execution).sort(), [
    "authorityExpanded",
    "methodDigest",
    "missionId",
    "missionInputDigest",
    "protocolId",
    "schemaVersion",
  ]);

  const muse = nextTypedMissionExecutionStep({ registry: fixture.registry, execution });
  assert.equal(muse.status, "ready");
  assert.equal(muse.capabilityId, "eternities-muse");
  assert.equal(muse.nodeId, "design");
  assert.equal(muse.order, 0);
  assert.equal(Object.isFrozen(muse), true);
  assert.equal(nextTypedMissionExecutionStep({ registry: fixture.registry, execution }), muse);

  const forge = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step: muse,
    output: await executors[muse.capabilityId](muse.input),
  });
  assert.equal(forge.status, "ready");
  assert.equal(forge.capabilityId, "eternities-forge");
  assert.equal(forge.nodeId, "implementation");
  assert.deepEqual(forge.input.slots["acceptance-risk-boundary"], acceptanceBoundary);

  const completed = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step: forge,
    output: await executors[forge.capabilityId](forge.input),
  });
  const reference = await executeTypedMissionMethod({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
    executors: canaryExecutors().executors,
  });
  assert.equal(completed.status, "completed");
  assert.deepEqual(completed.result, reference);
  assert.equal(completed.result.receipt.nodeExecutions.length, 2);
  assert.equal(completed.result.receipt.handoffs.length, 6);
  assert.equal(completed.authorityExpanded, false);
  assert.equal(nextTypedMissionExecutionStep({ registry: fixture.registry, execution }), completed);
  assert.doesNotMatch(JSON.stringify({ execution, muse, forge }), /white-fire-sovereign|## forge loop|## muse loop/i);
});

test("a fresh execution revalidates accepted outputs and resumes at the first uncommitted node", async (t) => {
  const fixture = await compiled(t);
  const { executors } = canaryExecutors();
  const first = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  const muse = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: first });
  const museOutput = await executors[muse.capabilityId](muse.input);
  const firstForge = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: first,
    step: muse,
    output: museOutput,
  });

  const recovered = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  const recoveredMuse = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: recovered });
  const recoveredForge = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: recovered,
    step: recoveredMuse,
    output: structuredClone(museOutput),
  });
  assert.equal(recoveredMuse.stepDigest, muse.stepDigest);
  assert.equal(recoveredForge.stepDigest, firstForge.stepDigest);

  const forgeOutput = await executors[recoveredForge.capabilityId](recoveredForge.input);
  const completed = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: recovered,
    step: recoveredForge,
    output: forgeOutput,
  });
  assert.equal(completed.status, "completed");
  assert.equal(completed.result.outputs.implementation.status, "verified");
});

test("invalid output is never committed and the same step remains current", async (t) => {
  const fixture = await compiled(t);
  const { executors } = canaryExecutors();
  const execution = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  const step = nextTypedMissionExecutionStep({ registry: fixture.registry, execution });
  assert.throws(() => commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step,
    output: { broken: true },
  }), expectCode("output-invalid"));
  assert.equal(nextTypedMissionExecutionStep({ registry: fixture.registry, execution }), step);

  const next = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step,
    output: await executors[step.capabilityId](step.input),
  });
  assert.equal(next.capabilityId, "eternities-forge");
});

test("forged cloned stale and cross-execution projections fail closed", async (t) => {
  const fixture = await compiled(t);
  const { executors } = canaryExecutors();
  const first = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  const second = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  const firstStep = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: first });
  const secondStep = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: second });
  const output = await executors[firstStep.capabilityId](firstStep.input);

  assert.throws(() => assertTypedMissionExecution(structuredClone(first)), expectCode("execution-provenance"));
  assert.throws(() => commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: first,
    step: structuredClone(firstStep),
    output,
  }), expectCode("step-provenance"));
  assert.throws(() => commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: first,
    step: secondStep,
    output,
  }), expectCode("step-owner-mismatch"));

  commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: first,
    step: firstStep,
    output,
  });
  assert.throws(() => commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: first,
    step: firstStep,
    output,
  }), expectCode("step-stale"));
});

test("changed mission inputs and untrusted methods reject before a step exists", async (t) => {
  const fixture = await compiled(t);
  const changedMethod = structuredClone(fixture.method);
  assert.throws(() => beginTypedMissionExecution({
    registry: fixture.registry,
    method: changedMethod,
    missionInputs,
  }), (error) => error?.code === "method-integrity");
  assert.throws(() => beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs: { ...missionInputs, "visual-source-set": { invalid: true } },
  }), expectCode("execution-invalid"));
});

test("non-JSON and uncloneable values reject through the closed stepper error surface", async (t) => {
  const fixture = await compiled(t);
  assert.throws(() => beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs: {
      ...missionInputs,
      "repository-state": { observedAt: new Date("2026-08-31T00:00:00.000Z") },
    },
  }), expectCode("execution-invalid"));
  assert.throws(() => beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs: {
      ...missionInputs,
      "repository-state": { inspect: () => true },
    },
  }), expectCode("execution-invalid"));

  const execution = beginTypedMissionExecution({
    registry: fixture.registry,
    method: fixture.method,
    missionInputs,
  });
  const step = nextTypedMissionExecutionStep({ registry: fixture.registry, execution });
  const invalidOutput = {
    schemaVersion: 1,
    capabilityId: step.capabilityId,
    missionId: step.missionId,
    slots: {
      "visual-direction": { observedAt: new Date("2026-08-31T00:00:00.000Z") },
      "visual-system": { tokens: [] },
      "specialist-handoff": { target: "eternities-forge" },
      "acceptance-boundary": { invariants: [], rejectionCriteria: [] },
    },
  };
  assert.throws(() => commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step,
    output: invalidOutput,
  }), expectCode("output-invalid"));
  assert.equal(nextTypedMissionExecutionStep({ registry: fixture.registry, execution }), step);
});
