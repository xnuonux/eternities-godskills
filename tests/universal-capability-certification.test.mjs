import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const certificate = JSON.parse(fs.readFileSync(path.join(root, "receipts/universal-capability-construction-v1.json")));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

test("terminal certificate accounts for all 48 construction targets", () => {
  assert.equal(certificate.status, "certified");
  assert.deepEqual(certificate.counts, {
    constructionTargets: 48,
    operationalSkills: 22,
    godskillExtensions: 26,
    topLevelGodskills: 21,
    portableCapabilities: 43,
    ownerRegistries: 13,
  });
  assert.equal(certificate.gates.operationalPromotions, 22);
  assert.equal(certificate.gates.extensionPromotions, 26);
  assert.equal(certificate.gates.unresolvedTargets, 0);
  assert.equal(certificate.gates.authorityExpansion, false);
  assert.equal(certificate.gates.sourceInstructionsExecuted, false);
  assert.equal(certificate.gates.externalActivation, false);
});

test("terminal construction certificate remains a closed historical checkpoint", () => {
  assert.equal(certificate.adversarialReview.unresolvedCritical, 0);
  assert.equal(certificate.adversarialReview.unresolvedImportant, 0);
  assert.equal(certificate.godagentsCompatibility.capabilityGrantsAuthority, false);
  const current = JSON.parse(fs.readFileSync(path.join(root, "receipts/godskills-system-certification-v3.json")));
  const portable = JSON.parse(fs.readFileSync(path.join(root, "receipts/portable-capability-manifest-v1.json")));
  assert.equal(current.status, "certified");
  assert.equal(portable.counts.topLevelGodskills, 22);
  assert.equal(portable.counts.capabilities, 44);
});

test("terminal certificate is content addressed and states proof limits", () => {
  const { certificateDigest, ...body } = certificate;
  assert.equal(certificateDigest, sha256(JSON.stringify(body)));
  assert.ok(certificate.proofLimits.includes("no-arbitrary-live-agent-routing-proof"));
  assert.ok(certificate.proofLimits.includes("no-universal-domain-correctness-proof"));
});
