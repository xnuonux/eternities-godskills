import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const defaultContext = {
  permittedEffects: ["local-read", "local-write"],
  availableAuthority: ["local-read", "local-write", "repository-write"],
  availablePreconditions: ["repository-present", "settled-outcome"],
  forbiddenCapabilities: [], maximumRisk: "high", minimumEvidenceConfidence: "verified",
  contextBudget: 6000, maxCompositionSize: 3,
};
const difference = (a, b) => a.filter(value => !b.includes(value));

function validateDataset(dataset, cards) {
  assert.equal(dataset.schemaVersion, 1);
  assert.ok(["development", "heldout"].includes(dataset.partition));
  assert.ok(typeof dataset.authorThreadId === "string" && dataset.authorThreadId.length > 0);
  assert.match(dataset.frozenAgainst, /^[a-f0-9]{40}$/);
  assert.ok(Array.isArray(dataset.cases) && dataset.cases.length > 0);
  const ids = new Set();
  for (const item of dataset.cases) {
    assert.ok(typeof item.id === "string" && item.id.length > 0);
    assert.ok(!ids.has(item.id), "duplicate case ID");
    ids.add(item.id);
    assert.ok(typeof item.text === "string" && item.text.length > 0);
    assert.ok(["benign-local", "supported-or-external"].includes(item.category));
    const annotation = item.annotation;
    assert.ok(["applicable", "inapplicable", "uncertain"].includes(annotation.disposition));
    for (const key of ["operationQuote", "deliverableQuote"]) {
      assert.ok(typeof annotation[key] === "string" && annotation[key].length > 0 && item.text.includes(annotation[key]), `invalid request quote: ${key}`);
    }
    assert.ok(typeof annotation.reason === "string" && annotation.reason.length > 0);
    assert.ok(Array.isArray(annotation.applicableIds));
    assert.equal(new Set(annotation.applicableIds).size, annotation.applicableIds.length);
    assert.ok(annotation.applicableIds.every(id => cards.some(card => card.id === id)), "unknown applicable card");
    assert.ok(Array.isArray(annotation.evidence));
    assert.ok(annotation.applicableIds.every(id => annotation.evidence.some(e => e.cardId === id)), "applicable card lacks evidence");
    if (annotation.disposition === "inapplicable") assert.equal(annotation.applicableIds.length, 0);
    if (annotation.disposition === "applicable") assert.ok(annotation.applicableIds.length > 0);
    assert.ok(Array.isArray(item.requiredEffects) && Array.isArray(item.requiredDecisions));
    const variants = item.authorityVariants ?? [];
    assert.ok(Array.isArray(variants));
    const names = new Set(["default"]);
    for (const variant of variants) {
      assert.ok(typeof variant.name === "string" && variant.name.length > 0 && !names.has(variant.name), "duplicate/invalid authority variant");
      names.add(variant.name);
      assert.ok(Array.isArray(variant.availableAuthority) && Array.isArray(variant.permittedEffects));
    }
  }
}

export function evaluatePartition({ dataset, cards, run }) {
  validateDataset(dataset, cards);
  const rows = [];
  for (const item of dataset.cases) {
    const variants = [{ name: "default" }, ...(item.authorityVariants ?? [])];
    for (const variant of variants) {
      const { name, ...authority } = variant;
      const context = { ...structuredClone(defaultContext), ...structuredClone(authority) };
      const request = { schemaVersion: 1, requestId: `${item.id}:${name}`, text: item.text, context };
      // Labels and annotation are deliberately absent from the runtime input.
      const actual = run({ request: structuredClone(request), cards: structuredClone(cards) });
      const repeat = run({ request: structuredClone(request), cards: structuredClone(cards) });
      const compiler = actual.compilerReceipt;
      const route = actual.routeReceipt;
      const annotation = item.annotation;
      const scored = annotation.disposition !== "uncertain";
      const applicable = annotation.applicableIds;
      const selected = route.selectedIds ?? [];
      const candidates = compiler.candidateScores.map(row => row.id);
      const expectedAuthoritySatisfied = applicable.length > 0 && applicable.every(id => {
        const card = cards.find(card => card.id === id);
        return card.authorityRequirements.every(value => context.availableAuthority.includes(value)) &&
          card.preconditions.every(value => context.availablePreconditions.includes(value)) &&
          card.effects.every(value => value === "none" || context.permittedEffects.includes(value));
      }) && item.requiredEffects.every(value => context.permittedEffects.includes(value));
      rows.push({
        id: item.id, variant: name, category: item.category, request,
        textDigest: digest(item.text), annotation, expectedDisposition: annotation.disposition,
        applicabilityScored: scored, expectedAuthoritySatisfied,
        compilerReceipt: compiler, routeReceipt: route,
        missingApplicableCandidates: scored ? difference(applicable, candidates) : [],
        unrelatedCandidates: scored ? difference(candidates, applicable) : [],
        unrelatedSelectedIds: scored ? difference(selected, applicable) : [],
        missingApplicableSelection: scored && expectedAuthoritySatisfied ? difference(applicable, selected) : [],
        missingRequiredEffects: difference(item.requiredEffects, compiler.requestedEffects),
        missingRequiredDecisions: name === "default" ? difference(item.requiredDecisions, compiler.unresolvedDecisions) : [],
        authorityInvented: difference(compiler.suppliedAuthority, context.availableAuthority).length > 0 ||
          difference(compiler.envelope.availableAuthority, context.availableAuthority).length > 0,
        repeatabilityMismatch: JSON.stringify(actual) !== JSON.stringify(repeat),
      });
    }
  }
  const count = predicate => rows.filter(predicate).length;
  const sum = project => rows.filter(row => row.applicabilityScored).reduce((total, row) => total + project(row), 0);
  return { partition: dataset.partition, rows, metrics: {
    caseCount: dataset.cases.length, replayCount: rows.length,
    uncertainRows: count(row => !row.applicabilityScored),
    unrelatedCleanAdmissions: count(row => row.routeReceipt.status === "selected" && row.unrelatedSelectedIds.length > 0),
    qualifiedCandidates: sum(row => row.compilerReceipt.candidateScores.length),
    applicableQualifiedCandidates: sum(row => row.annotation.applicableIds.length - row.missingApplicableCandidates.length),
    expectedApplicableCandidates: sum(row => row.annotation.applicableIds.length),
    selectedCapabilities: sum(row => row.routeReceipt.selectedIds.length),
    unrelatedSelectedCapabilities: sum(row => row.unrelatedSelectedIds.length),
    inappropriateLocalAuthorityDemands: count(row => row.category === "benign-local" && row.expectedDisposition === "inapplicable" &&
      row.compilerReceipt.unresolvedDecisions.some(value => /^(?:authority|effect-authority):/.test(value))),
    expectedCandidateMisses: count(row => row.missingApplicableCandidates.length > 0),
    eligibleSelectionMisses: count(row => row.missingApplicableSelection.length > 0),
    missingRequiredEffects: count(row => row.missingRequiredEffects.length > 0),
    missingRequiredDecisions: count(row => row.missingRequiredDecisions.length > 0),
    authorityInvention: count(row => row.authorityInvented),
    repeatabilityMismatches: count(row => row.repeatabilityMismatch),
  } };
}

async function sourceEvidence(root, dataset) {
  const evidence = [];
  for (const item of dataset.cases) {
    for (const entry of item.annotation.evidence) {
      assert.ok(typeof entry.path === "string" && !path.isAbsolute(entry.path));
      const target = path.resolve(root, entry.path);
      const relative = path.relative(root, target);
      assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "evidence path escapes repository");
      assert.ok(typeof entry.quote === "string" && entry.quote.length > 0);
      const bytes = await readFile(target);
      assert.ok(bytes.toString("utf8").includes(entry.quote), "source evidence quote mismatch");
      evidence.push({ caseId: item.id, cardId: entry.cardId, path: entry.path, sha256: digest(bytes), quote: entry.quote });
    }
  }
  return evidence;
}

export async function replayStudy({ baselineRoot, candidateRoot, datasetPath, expectedDatasetDigest }) {
  const datasetBytes = await readFile(datasetPath);
  assert.equal(digest(datasetBytes), expectedDatasetDigest, "dataset freeze mismatch");
  const dataset = JSON.parse(datasetBytes);
  assert.equal(dataset.cases.length, 12, "study partition must have 12 cases");
  assert.equal(dataset.cases.filter(row => row.category === "benign-local").length, 6);
  assert.equal(dataset.cases.filter(row => row.category === "supported-or-external").length, 6);
  const evidence = await sourceEvidence(candidateRoot, dataset);
  const arms = [];
  for (const [name, root] of [["main", baselineRoot], ["candidate", candidateRoot]]) {
    const git = args => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", windowsHide: true }).trim();
    const commit = git(["rev-parse", "HEAD"]);
    assert.equal(git(["status", "--porcelain", "--", "src", "artifacts/routing"]), "", "runtime source must be clean");
    const cardBytes = await readFile(path.join(root, "artifacts/routing/cards.jsonl"));
    const cards = cardBytes.toString("utf8").trim().split(/\r?\n/).map(JSON.parse);
    const compilerBytes = await readFile(path.join(root, "src/intent-compiler.mjs"));
    const modes = {};
    for (const [mode, modulePath] of [["default", "src/intent-runtime.mjs"], ["specialist", "src/specialist-preference-runtime.mjs"]]) {
      const { compileAndRoute } = await import(pathToFileURL(path.join(root, modulePath)));
      modes[mode] = evaluatePartition({ dataset, cards, run: compileAndRoute });
    }
    assert.equal(git(["rev-parse", "HEAD"]), commit, "revision changed during replay");
    assert.equal(git(["status", "--porcelain", "--", "src", "artifacts/routing"]), "", "runtime changed during replay");
    const differences = modes.default.rows.filter((row, index) => {
      const other = modes.specialist.rows[index];
      return JSON.stringify([row.routeReceipt.status, row.routeReceipt.selectedIds, row.compilerReceipt.unresolvedDecisions]) !==
        JSON.stringify([other.routeReceipt.status, other.routeReceipt.selectedIds, other.compilerReceipt.unresolvedDecisions]);
    }).map(row => ({ id: row.id, variant: row.variant }));
    arms.push({ name, commit, cardsDigest: digest(cardBytes), compilerDigest: digest(compilerBytes),
      modes, defaultSpecialistDifferences: differences });
  }
  assert.equal(arms[0].cardsDigest, arms[1].cardsDigest, "catalog must be identical across arms");
  return { schemaVersion: 1, status: "offline-diagnostic-not-qualification", datasetDigest: digest(datasetBytes),
    partition: dataset.partition, authorThreadId: dataset.authorThreadId, frozenAgainst: dataset.frozenAgainst,
    evaluatorDigest: digest(await readFile(new URL(import.meta.url))), sourceEvidence: evidence, arms,
    datasetBytes: datasetBytes.length, annotationEvidenceFileCount: new Set(evidence.map(item => item.path)).size,
    routingSkillBodiesLoaded: 0, specialistContext: "no preference override; parity control only",
    thirdArm: "annotation-only-no-mechanism-implemented", providerCalls: 0,
    proofLimits: ["annotations-are-not-semantic-proof", "small-corpus-not-universal", "no-trust-root-or-runtime-activation"] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [baselineRoot, candidateRoot, datasetPath, expectedDatasetDigest, outputPath, ...extra] = process.argv.slice(2);
  assert.ok(!extra.length && [baselineRoot, candidateRoot, datasetPath, outputPath].every(value => value && path.isAbsolute(value)),
    "usage: node evaluator BASELINE_ROOT CANDIDATE_ROOT DATASET_PATH DATASET_SHA256 NEW_OUTPUT_PATH");
  assert.match(expectedDatasetDigest, /^[a-f0-9]{64}$/);
  const result = await replayStudy({ baselineRoot, candidateRoot, datasetPath, expectedDatasetDigest });
  const output = `${JSON.stringify(result, null, 2)}\n`;
  await writeFile(outputPath, output, { flag: "wx" });
  // Held-out case text, annotations, IDs and outcomes never enter the tuner's UI.
  console.log(JSON.stringify({ outputPath, outputDigest: digest(output), partition: result.partition,
    arms: result.arms.map(arm => ({ name: arm.name, commit: arm.commit,
      metrics: Object.fromEntries(Object.entries(arm.modes).map(([mode, value]) => [mode, value.metrics])),
      defaultSpecialistDifferences: arm.defaultSpecialistDifferences.length })) }, null, 2));
}
