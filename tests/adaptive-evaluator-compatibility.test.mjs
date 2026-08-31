import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const PRE_PHASE_COMMIT = "95cd9c32be67f2438da200250f8024f14edd8dd7";
const RUNTIME_PATH = "runtime/adaptive-evaluator-packages-v1.md";

const FROZEN_FILES = Object.freeze({
  "artifacts/adaptive-activation/evidence.v1.json": "b55a5cb4f7ff039cc7f4027c165b2f151bad723d9030913076a4225342fbe8c5",
  "evidence/adaptive-evidence-v2/aegis-matrix/artifacts/combined.json": "d23b9fc591069f6ee98b110b374c121574337519b4114155cd5a482ad5c110cf",
  "evidence/adaptive-evidence-v2/aegis-matrix/artifacts/guardrail.json": "b5cedd87ba90c85a6019cc4b654da8feeda501c917440540b86f1bcc5533c91c",
  "evidence/adaptive-evidence-v2/aegis-matrix/artifacts/method.json": "cf562c5c635e3a69e9a04e540d772a3477d71056a542ff9ce318518552c3a17a",
  "evidence/adaptive-evidence-v2/aegis-matrix/artifacts/raw.json": "2cdb7cef6289920e0f515bfef612b2f00c100c906af6209f2ab3740a0628edac",
  "evidence/adaptive-evidence-v2/aegis-matrix/artifacts/reviewer.json": "d42fc11653263533a023ca4ecbef4811af31d7432aaddc963729088fb88cdb63",
  "evidence/adaptive-evidence-v2/aegis-matrix/comparison-policy.json": "1ba575f0c01e40b1b150847eae8f4aeca7e27ecab151548f5a2fd948b1da6b41",
  "evidence/adaptive-evidence-v2/aegis-matrix/ledger.json": "f6ff1d6f4bec33b467e091aa5a454534d777c5c5769762435e3d0ab4da79ca9a",
  "evidence/adaptive-evidence-v2/aegis-matrix/observations/combined.json": "99800d22874203424dd8c5047c951a1b4e24a9f2e12c0aa8aeb882fbe37be886",
  "evidence/adaptive-evidence-v2/aegis-matrix/observations/guardrail.json": "3c0caab8c710f34a9c512f00c37c88812ac417dba8e2230d21a4503967a7aa5d",
  "evidence/adaptive-evidence-v2/aegis-matrix/observations/method.json": "6fbb899513903e3792b243e6fe41c51bb369d6a9196ac65a3b5e06d04e5aeec0",
  "evidence/adaptive-evidence-v2/aegis-matrix/observations/raw.json": "7173efd15a35fee1f63ad39387a3190c8a6a02069240e3736d4f0667f757c949",
  "evidence/adaptive-evidence-v2/aegis-matrix/observations/reviewer.json": "b12cfc986d408e2a3491e4e542ebe023568920361ad4db493807cb957022d52b",
  "evidence/adaptive-evidence-v2/aegis-matrix/profile.json": "a6f7ab2abfaf82e3894ff9932ac6b03c6c52469567f2e305701234777e46e0e2",
  "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json": "71dc6ba5957d7183e4e0f6d99c650d3244cc3e6808c111706b4c74df09f49aa7",
  "policies/adaptive-activation.v1.json": "b87bbfaddecb42417e57202173220bf240204d27b7de5fffc9e609eb18138939",
  "receipts/adaptive-evidence-v2.json": "7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a",
  "scripts/evaluate-aegis-matrix.mjs": "38dc6b3c5d1f8687feb0c0f05f47094b80b2e9ec76688d1a90af060be5f03d0b",
  "src/adaptive-activation.mjs": "9844aee1147f7129f3e37067424ccebb88ff478de1b7a9a9fb7306d5f2fdbd82",
});

const FROZEN_MANIFESTS = Object.freeze({
  "artifacts/capability-layers/eternities-aegis/manifest.v1.json": "311da3e3748f755469d68afb0539128776a4b03a509017e0604f0d8ba8295eb8",
  "artifacts/capability-layers/eternities-forge/manifest.v1.json": "6c3581a12c39b53696b29c3e4b8bac58fede466f7a760b9bd50743cfb7b00aa4",
  "artifacts/capability-layers/eternities-muse/manifest.v1.json": "4a8a02b6a92cfe1ba7d3fc49be34f68b91c20479b1d8ebf3f9d384b3ef9742b8",
});

const FROZEN_SKILLS = Object.freeze({
  "skills/api-rate-limit-recovery/SKILL.md": "8a165944ba00664472fea80bf2f35e1c5669a61cc5e3b577e6ffd9634fec7044",
  "skills/approval-bound-private-session-mining/SKILL.md": "8f1f7517713f7b5d09f93415c5b7a03ab9b9c8e37eca01c6a780b0007754b419",
  "skills/bounded-service-shutdown/SKILL.md": "6e4d0bc284a44fbe8a96008052007f476a9b94d1af6625c53f2574e31883eab7",
  "skills/bounded-verified-object-ingestion/SKILL.md": "49b5256753b3454bcbb3e45343729ffff04e1e335fb67c9f704fd655eb0d7a3f",
  "skills/columnar-ingestion-rollup-and-query-layout-design/SKILL.md": "bb733d96f158f8b3a735a2c5b035cbf98e02c31a86f01cfc1bb4dc2be1488f79",
  "skills/confirmed-destructive-reconstruction/SKILL.md": "664ef8b6d36e67a6f2a978254a6e13197deadbdde3b330d9dc6ef89444eb4abc",
  "skills/diagnostic-statistical-model-inference/SKILL.md": "c2329e49529ee7610932e6377a1a226880ec8f5d8cc40a724e2729de68d15004",
  "skills/docx-package-redline-and-render-verification/SKILL.md": "c8ef749b3d777592b68d8d080917ea979be03fad9ae3f9e0933aa78f1fccd2b6",
  "skills/eternities-aegis/SKILL.md": "91b2029f6866272d30e3d685dce32700e910889830133e107a9009eb2269c8b7",
  "skills/eternities-agora/SKILL.md": "f4399a65e90fae3a18e785ddc8a4c15efd052b01fd02cc9efb6c60dc8163d98f",
  "skills/eternities-arcadia/SKILL.md": "a5a726826cecd0f3d2b1789e30c00d296a0085f82c5227dc3f35b59194653559",
  "skills/eternities-architect/SKILL.md": "3edb67a8aa6ef6717cd1abb3aa0658215ab76ec9009895d29bd6068612ee7a05",
  "skills/eternities-athena/SKILL.md": "68e961e8a658df393df64e4b14e5b770edce73f2531577edf985a7ec3946d56b",
  "skills/eternities-atlas/SKILL.md": "ef2cf619137f3a3ec3025b33390336659055cf5c95b9fa5f28687e691b36c341",
  "skills/eternities-beacon/SKILL.md": "4e534765f4be8c79b6302aa986c8c8944d89048e616129a36c2348e1969f3ac4",
  "skills/eternities-chorus/SKILL.md": "0054c131d94cc0f842ad2e5107135bc4379fbd0ba716ef00a4b1a98bab5b2d51",
  "skills/eternities-daedalus/SKILL.md": "f37a505ea9a21657a7d2b3907475a467d48b835c023378252100ba3536bab601",
  "skills/eternities-forge/SKILL.md": "0e5e5e876315bec35fde1c631cc6010b894b9af30cc59fdff8258f8ac580fcc7",
  "skills/eternities-hephaestus/SKILL.md": "fcdfca34b569af7ace8b89714e348b0d8767f99279663b4bbe336b4bf8860cfd",
  "skills/eternities-herald/SKILL.md": "7bf0df8857b68347dc14224f0e15ab5b47f4ebb972ac442f8ff34735eb609a8e",
  "skills/eternities-hermes/SKILL.md": "ff15c0ff4b723f6fe3af2b0b0660a9e0a6a1c885be67e6933206d3d91fb816c1",
  "skills/eternities-logos/SKILL.md": "bd94cdf5cdaec4534bd2f17bcf5006816c4f9e6f95dbf93f0ad3c670bdd762f2",
  "skills/eternities-mnemosyne/SKILL.md": "69e1bae6e496f6bf5dac6492be32cf3b4d1504d8ce86a5c6f7da8a9a0fbe2078",
  "skills/eternities-muse/SKILL.md": "e9af729ad561afb811971e4180512d4a46096f2ce245520b7db0f49c36dd79f8",
  "skills/eternities-omnibus/SKILL.md": "9d140beddc151810f560fdf06007cecd10dcabba9693ef047aca15525171a01a",
  "skills/eternities-oracle/SKILL.md": "3c9851711492a276eaaac2672207774ea8da793d630a51b21623e2564a624d6c",
  "skills/eternities-orpheus/SKILL.md": "59df9f08bb022f21a31f8da64566ffdf7177440623cbb165f77bd57c7e46c1f3",
  "skills/eternities-phoenix/SKILL.md": "8f7d4f0ace48604a9b556747404ac7efb3cd5f64dfabbc1c8add92c0b00a98f1",
  "skills/eternities-prometheus/SKILL.md": "ed053d7799f4eef67d1095237b40aeda0643362fa5ffccdbb1a9fa86458c6a3b",
  "skills/formula-preserving-workbook-engineering/SKILL.md": "57fe9f91a1e87fd435325ef4c6c9a1bc72711f6447cab26030553572690a13ed",
  "skills/fp-ts-functional-refactoring/SKILL.md": "88feb9b199b31c0d92753c51e14335d3cc04d6e78e5dffaf49c39b01c45e07a9",
  "skills/genomic-coordinate-assembly-and-variant-gates/SKILL.md": "c31327c833b4fead7de05dddd179b1ad593de95967e62533964127db5802f560",
  "skills/interface-localization-and-bidirectionality/SKILL.md": "c783eba17d9def75e40c95a10533a3025fd71a9abf7632317b75ba8890726855",
  "skills/invariant-guard/SKILL.md": "662fbe7019395bbda3be470cba36b67b2e00a2a036fd40ab79b93a18fd06b8ff",
  "skills/lazy-tabular-transformation-and-validation/SKILL.md": "2179e227170ff51dee0190ce53f50eb3e37a23c99a961a74443af9baeb9ca15f",
  "skills/measured-paid-creative-iteration/SKILL.md": "ae6d17c5753770b5a9e82935ba1cd0b6620fb597c8e82d95246c7161aa8600ad",
  "skills/performance-release-gating/SKILL.md": "c0d534a563f4b9f065e108fbceba4d98e311093139a9abe2e4e8f4ae5493ea71",
  "skills/physics-constrained-numerical-validation/SKILL.md": "5acc6fc0cb17c3c7778728f544e28c8812d717426b7e56f69f4fb9db0ad35b56",
  "skills/release-script-safety/SKILL.md": "e9379597b00cbfe72bc0d40824aaab9ee9b333d9560e79595567769898fbb5fa",
  "skills/semantic-implementation-diff/SKILL.md": "38fb8822b3cc9b8d18ab6101b8f6063272db5fe174afe008a6154bcd3b5f2bd8",
  "skills/sovereign-skill-refinery/SKILL.md": "71b39ba6963e030018c7830539e0ebe06dd902ffb4239fcd0f768a90d1791a4c",
  "skills/symbolic-mathematics-python/SKILL.md": "dcfa1c429927870d2e6a1f769428c71aa24c4cffffcedb5c059a2aa79f82838a",
  "skills/venture-falsification-and-planning/SKILL.md": "5102353487c367bbe99b0485c8669cf1269aed99fa3c829adffbea994f5caef9",
  "skills/web-performance-optimization/SKILL.md": "6420ad975cf47878da9bca50202864b7e896d86ca6fdd68896168fc8f571f6b4",
});

async function assertHashes(records) {
  for (const [relativePath, expected] of Object.entries(records)) {
    assert.equal(sha256(await readFile(new URL(relativePath, root))), expected,
      `${relativePath} drifted from ${PRE_PHASE_COMMIT}`);
  }
}

async function immediateSkillEntrypoints() {
  const entries = await readdir(new URL("skills/", root), { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const relativePath = `skills/${entry.name}/SKILL.md`;
    try {
      await readFile(new URL(relativePath, root));
      found.push(relativePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return found.sort();
}

async function capabilityManifests() {
  const entries = await readdir(new URL("artifacts/capability-layers/", root), {
    withFileTypes: true,
  });
  return entries.filter((entry) => entry.isDirectory())
    .map((entry) => `artifacts/capability-layers/${entry.name}/manifest.v1.json`)
    .sort();
}

test("all pre-phase activation, evidence, skill, and capability bytes remain frozen", async () => {
  assert.equal(Object.keys(FROZEN_FILES).length, 19);
  assert.equal(Object.keys(FROZEN_SKILLS).length, 44);
  assert.equal(Object.keys(FROZEN_MANIFESTS).length, 3);
  assert.deepEqual(await immediateSkillEntrypoints(), Object.keys(FROZEN_SKILLS).sort());
  assert.deepEqual(await capabilityManifests(), Object.keys(FROZEN_MANIFESTS).sort());
  await assertHashes({ ...FROZEN_FILES, ...FROZEN_SKILLS, ...FROZEN_MANIFESTS });
});

test("runtime record closes execution, shadow, and future evidence boundaries", async () => {
  const runtime = await readFile(new URL(RUNTIME_PATH, root), "utf8").catch((error) =>
    assert.fail(`adaptive evaluator runtime record is unavailable: ${error.message}`));
  for (const pattern of [
    /rebuild sequence/i,
    /pinned entrypoint/i,
    /request.*result contract/is,
    /source.*oracle.*ground/is,
    /fail.closed/i,
    /retrospective-shadow-ineligible/i,
    /matchedComparisons.*task-local oracle cases/is,
    /not independent trials/i,
    /future preregistration sequence/i,
  ]) assert.match(runtime, pattern);

  const receipt = JSON.parse(await readFile(
    new URL("receipts/adaptive-evaluator-packages-v1.json", root),
    "utf8",
  ));
  assert.equal(receipt.runtime.path, RUNTIME_PATH);
  assert.equal(receipt.runtime.sha256, sha256(runtime));
  assert.equal(receipt.runtime.bytes, Buffer.byteLength(runtime));
});
