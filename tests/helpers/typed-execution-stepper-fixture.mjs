import {
  compileTypedMissionMethod,
  executeTypedMissionMethod,
} from "../../src/typed-composition.mjs";
import {
  beginTypedMissionExecution,
  commitTypedMissionExecutionStep,
  nextTypedMissionExecutionStep,
} from "../../src/typed-execution-stepper.mjs";
import {
  buildFixture,
  canaryExecutors,
  canonicalJson,
  json,
  logicalDigest,
  missionInputs,
} from "./typed-composition-fixture.mjs";

function readyEvidence(step) {
  return {
    protocolId: step.protocolId,
    status: step.status,
    missionId: step.missionId,
    methodDigest: step.methodDigest,
    missionInputDigest: step.missionInputDigest,
    order: step.order,
    nodeId: step.nodeId,
    phase: step.phase,
    capabilityId: step.capabilityId,
    activationDecisionDigest: step.activationDecisionDigest,
    inputDigest: step.inputDigest,
    stepDigest: step.stepDigest,
    authorityExpanded: step.authorityExpanded,
  };
}

export async function buildDeterministicTypedExecutionStepperFixture() {
  const fixture = await buildFixture();
  const method = compileTypedMissionMethod(fixture);
  const parent = await json("receipts/typed-composition-v1.json");
  const { executors } = canaryExecutors();

  const execution = beginTypedMissionExecution({
    registry: fixture.registry,
    method,
    missionInputs,
  });
  const muse = nextTypedMissionExecutionStep({ registry: fixture.registry, execution });
  const museOutput = await executors[muse.capabilityId](muse.input);
  const forge = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step: muse,
    output: museOutput,
  });
  const forgeOutput = await executors[forge.capabilityId](forge.input);
  const completed = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution,
    step: forge,
    output: forgeOutput,
  });
  const reference = await executeTypedMissionMethod({
    registry: fixture.registry,
    method,
    missionInputs,
    executors: canaryExecutors().executors,
  });

  const invalid = beginTypedMissionExecution({
    registry: fixture.registry,
    method,
    missionInputs,
  });
  const invalidStep = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: invalid });
  let invalidOutputCode = null;
  try {
    commitTypedMissionExecutionStep({
      registry: fixture.registry,
      execution: invalid,
      step: invalidStep,
      output: { broken: true },
    });
  } catch (error) {
    invalidOutputCode = error?.code ?? null;
  }
  const unchanged = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: invalid });

  const recovered = beginTypedMissionExecution({
    registry: fixture.registry,
    method,
    missionInputs,
  });
  const recoveredMuse = nextTypedMissionExecutionStep({ registry: fixture.registry, execution: recovered });
  const recoveredForge = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: recovered,
    step: recoveredMuse,
    output: structuredClone(museOutput),
  });
  const externalExecutionsAfterRecovery = { "eternities-muse": 0, "eternities-forge": 0 };
  externalExecutionsAfterRecovery[recoveredForge.capabilityId] += 1;
  const recoveredCompletion = commitTypedMissionExecutionStep({
    registry: fixture.registry,
    execution: recovered,
    step: recoveredForge,
    output: await executors[recoveredForge.capabilityId](recoveredForge.input),
  });

  const exposed = canonicalJson({
    execution,
    muse: readyEvidence(muse),
    forge: readyEvidence(forge),
    completion: recoveredCompletion,
  });
  const unsigned = {
    schemaVersion: 1,
    protocolId: "eternities-typed-execution-stepper-fixture-v1",
    parent: {
      receiptDigest: parent.receiptDigest,
      methodDigest: method.methodDigest,
      executionDigest: reference.receipt.executionDigest,
    },
    execution: structuredClone(execution),
    steps: [readyEvidence(muse), readyEvidence(forge)],
    validation: {
      invalidOutputCode,
      invalidOutputDidNotAdvance: unchanged === invalidStep,
      freshReplayMuseDigestMatched: recoveredMuse.stepDigest === muse.stepDigest,
      freshReplayForgeDigestMatched: recoveredForge.stepDigest === forge.stepDigest,
      externalExecutionsAfterRecovery,
    },
    completion: {
      completionDigest: completed.completionDigest,
      executionDigest: completed.result.receipt.executionDigest,
      referenceParity: canonicalJson(completed.result) === canonicalJson(reference),
      recoveryParity: canonicalJson(recoveredCompletion.result) === canonicalJson(reference),
      nodeExecutions: completed.result.receipt.nodeExecutions.length,
      handoffs: completed.result.receipt.handoffs.length,
      authorityExpanded: completed.authorityExpanded,
    },
    disclosure: {
      methodBodiesEmbedded: 0,
      sourceBodiesTransported: 0,
      bodyMarkerMatches: (exposed.match(/## (?:forge|muse) loop/gi) ?? []).length,
    },
  };
  return Object.freeze({ ...unsigned, fixtureDigest: logicalDigest(unsigned) });
}
