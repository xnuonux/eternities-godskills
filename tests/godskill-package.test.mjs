import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LAYER_FILES, canonicalJson } from '../src/capability-layer-abi.mjs';
import { sha256 } from '../src/io.mjs';
import {
  GODSKILL_PACKAGE_PROTOCOL,
  buildGodskillPackageManifest,
  verifyGodskillPackageDirectory,
} from '../src/godskill-package.mjs';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');

const sourceDefinitions = [
  {
    id: 'layer-policy',
    sourcePath: 'policies/capability-layer-abi.v1.json',
    packagePath: 'sources/layer-policy.json',
  },
  {
    id: 'entrypoint',
    sourcePath: 'skills/eternities-aegis/SKILL.md',
    packagePath: 'sources/entrypoint.SKILL.md',
  },
  {
    id: 'contract',
    sourcePath: 'skills/eternities-aegis/references/capability-contract.json',
    packagePath: 'sources/contract.json',
  },
  {
    id: 'operatingContract',
    sourcePath: 'skills/eternities-aegis/references/operating-contract.md',
    packagePath: 'sources/operating-contract.md',
  },
  {
    id: 'routingCard',
    sourcePath: 'skills/eternities-aegis/references/routing-card.json',
    packagePath: 'sources/routing-card.json',
  },
];

async function loadBuildInput(definitions = sourceDefinitions) {
  const policyBytes = await readFile(path.join(repositoryRoot, 'policies/godskill-package-v1.json'));
  const layerManifestBytes = await readFile(
    path.join(repositoryRoot, 'artifacts/capability-layers/eternities-aegis/manifest.v1.json'),
  );
  const layerFiles = Object.fromEntries(await Promise.all(
    LAYER_FILES
      .filter((fileName) => fileName !== 'manifest.v1.json')
      .map(async (fileName) => [
        fileName,
        await readFile(path.join(repositoryRoot, 'artifacts/capability-layers/eternities-aegis', fileName)),
      ]),
  ));
  const sourceArtifacts = await Promise.all(definitions.map(async (definition) => ({
    ...definition,
    bytes: await readFile(path.join(repositoryRoot, definition.sourcePath)),
  })));
  const promotionEvidenceBytes = await readFile(
    path.join(repositoryRoot, 'receipts/promotions/eternities-aegis-v4.json'),
  );
  return {
    policyBytes,
    layerManifestBytes,
    layerFiles,
    sourceArtifacts,
    promotionEvidenceBytes,
  };
}

async function loadFixture(definitions = sourceDefinitions) {
  return buildGodskillPackageManifest(await loadBuildInput(definitions));
}

async function writeFixture(t, fixture) {
  const packageDirectory = await mkdtemp(path.join(os.tmpdir(), 'godskill-package-'));
  t.after(() => rm(packageDirectory, { recursive: true, force: true }));
  for (const [relativePath, value] of Object.entries(fixture.files)) {
    const target = path.join(packageDirectory, ...relativePath.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, value);
  }
  return packageDirectory;
}

async function expectVerificationFailure(packageDirectory, fixture, message = undefined, options = {}) {
  await assert.rejects(
    verifyGodskillPackageDirectory({
      packageDirectory,
      expectedPackageDigest: fixture.manifest.packageDigest,
      expectedPolicyDigest: fixture.manifest.policy.sha256,
      ...options,
    }),
    message,
  );
}

test('godskill package protocol exposes an inert provider-neutral boundary', () => {
  assert.equal(GODSKILL_PACKAGE_PROTOCOL, 'eternities-godskill-package-v1');
});

test('build is deterministic and emits a closed package manifest', async () => {
  const first = await loadFixture();
  const second = await loadFixture();
  assert.equal(first.packageDigest, second.packageDigest);
  assert.deepEqual(first.manifest, second.manifest);
  assert.deepEqual(Object.keys(first.files).sort(), [
    'evidence/promotion-receipt.v4.json',
    'layers/guardrails.v1.json',
    'layers/input.schema.json',
    'layers/manifest.v1.json',
    'layers/method.v1.md',
    'layers/output.schema.json',
    'layers/reviewer.v1.md',
    'layers/route-card.v1.json',
    'layers/verifier.v1.json',
    'manifest.v1.json',
    'policy/package.v1.json',
    'sources/contract.json',
    'sources/entrypoint.SKILL.md',
    'sources/layer-policy.json',
    'sources/operating-contract.md',
    'sources/routing-card.json',
  ]);
  assert.equal(
    first.files['manifest.v1.json'].toString('utf8'),
    canonicalJson(first.manifest),
  );
  assert.equal(first.manifest.capabilityGrantsAuthority, false);
  assert.equal(first.manifest.verification.sourceExecutionAllowed, false);
  assert.equal(first.manifest.verification.externalMutationAllowed, false);
});

test('source input order cannot change the package identity', async () => {
  const ordered = await loadFixture();
  const reversed = await loadFixture([...sourceDefinitions].reverse());
  assert.equal(ordered.packageDigest, reversed.packageDigest);
  assert.deepEqual(ordered.manifest.provenance, reversed.manifest.provenance);
});

test('builder rejects a layer byte substitution before emitting a package', async () => {
  const input = await loadBuildInput();
  input.layerFiles['guardrails.v1.json'] = Buffer.from('substituted layer bytes', 'utf8');
  assert.throws(
    () => buildGodskillPackageManifest(input),
    /layer digest or bytes do not match|compiled layer bytes do not match/,
  );
});

test('a canonical Aegis package verifies against exact package and policy roots', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  const result = await verifyGodskillPackageDirectory({
    packageDirectory,
    expectedPackageDigest: fixture.manifest.packageDigest,
    expectedPolicyDigest: fixture.manifest.policy.sha256,
    sourceRoot: repositoryRoot,
  });
  assert.deepEqual(result, {
    valid: true,
    protocolId: GODSKILL_PACKAGE_PROTOCOL,
    packageId: 'eternities-aegis',
    packageVersion: 1,
    capabilityVersion: 4,
    packageDigest: fixture.manifest.packageDigest,
    policyDigest: fixture.manifest.policy.sha256,
    contentCount: 15,
    evidenceLevel: 'agentic-ci-source-to-sink-candidate-certified',
    sourceExecutionAllowed: false,
    externalMutationAllowed: false,
    authorityExpansionAllowed: false,
  });
});

test('checked package and receipt reverify from the repository checkout', async () => {
  const receipt = JSON.parse(await readFile(
    path.join(repositoryRoot, 'receipts/godskill-package-v1.json'),
    'utf8',
  ));
  const packageDirectory = path.join(
    repositoryRoot,
    'artifacts/godskill-packages/eternities-aegis-v1',
  );
  const result = await verifyGodskillPackageDirectory({
    packageDirectory,
    expectedPackageDigest: receipt.packageDigest,
    expectedPolicyDigest: receipt.policyDigest,
    sourceRoot: repositoryRoot,
  });
  const manifestBytes = await readFile(path.join(packageDirectory, 'manifest.v1.json'));
  assert.equal(result.valid, true);
  assert.equal(result.packageDigest, receipt.packageDigest);
  assert.equal(manifestBytes.length, receipt.manifestBytes);
  assert.equal(sha256(manifestBytes), receipt.manifestSha256);
  assert.equal(receipt.status, 'verified-build');
  assert.equal(receipt.fullRepositorySuite.failed, 0);
});

test('verification reads inert data only and never loads package source', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  const reads = [];
  await verifyGodskillPackageDirectory({
    packageDirectory,
    expectedPackageDigest: fixture.manifest.packageDigest,
    expectedPolicyDigest: fixture.manifest.policy.sha256,
    read: async (filePath) => {
      reads.push(filePath);
      return readFile(filePath);
    },
  });
  assert.ok(reads.length > 0);
  assert.equal(reads.some((filePath) => /\.(?:mjs|js|cjs)$/i.test(filePath)), false);
});

test('rejects unsafe, duplicate, or substituted manifest entries', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  const manifestPath = path.join(packageDirectory, 'manifest.v1.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  manifest.content[0].path = '../outside.json';
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /safe package-relative path|canonical inventory/);

  manifest.content[0].path = fixture.manifest.content[0].path;
  manifest.content[1].role = manifest.content[0].role;
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /duplicate/);

  manifest.content[1].role = fixture.manifest.content[1].role;
  manifest.content[1].path = fixture.manifest.content[0].path;
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /duplicate/);

  await writeFile(manifestPath, fixture.files['manifest.v1.json']);
  await writeFile(
    path.join(packageDirectory, 'layers', 'method.v1.md'),
    Buffer.from('substituted package bytes', 'utf8'),
  );
  await expectVerificationFailure(packageDirectory, fixture, /digest or byte count/);
});

test('rejects noncanonical JSON, extras, and missing package files', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  const manifestPath = path.join(packageDirectory, 'manifest.v1.json');
  await writeFile(manifestPath, JSON.stringify(fixture.manifest, null, 2) + '\n');
  await expectVerificationFailure(packageDirectory, fixture, /not canonical JSON/);

  await writeFile(manifestPath, fixture.files['manifest.v1.json']);
  await writeFile(path.join(packageDirectory, 'extra.txt'), 'unexpected');
  await expectVerificationFailure(packageDirectory, fixture, /file inventory/);

  await unlink(path.join(packageDirectory, 'extra.txt'));
  await unlink(path.join(packageDirectory, 'layers', 'method.v1.md'));
  await expectVerificationFailure(packageDirectory, fixture, /file inventory/);
});

test('rejects stale trust roots, protocol drift, authority widening, and attestation drift', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  await expectVerificationFailure(packageDirectory, fixture, /trusted package digest/, {
    expectedPackageDigest: '0'.repeat(64),
  });
  await expectVerificationFailure(packageDirectory, fixture, /trusted policy digest/, {
    expectedPolicyDigest: '1'.repeat(64),
  });

  const manifestPath = path.join(packageDirectory, 'manifest.v1.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.protocolId = 'different-protocol-v1';
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /identity or authority/);

  manifest.protocolId = fixture.manifest.protocolId;
  manifest.capabilityGrantsAuthority = true;
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /identity or authority/);

  manifest.capabilityGrantsAuthority = false;
  manifest.verification.externalMutationAllowed = true;
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /verification boundary/);

  manifest.verification.externalMutationAllowed = false;
  manifest.attestation.subjectDigest = '2'.repeat(64);
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /attestation subject/);
});

test('rejects unsupported effects and stale evidence identity', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  const manifestPath = path.join(packageDirectory, 'manifest.v1.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.compatibility.effects = ['execute'];
  await writeFile(manifestPath, canonicalJson(manifest));
  await expectVerificationFailure(packageDirectory, fixture, /compatibility effects/);

  await writeFile(manifestPath, fixture.files['manifest.v1.json']);
  await writeFile(
    path.join(packageDirectory, 'evidence', 'promotion-receipt.v4.json'),
    Buffer.from('{"skillName":"different-skill"}\n', 'utf8'),
  );
  await expectVerificationFailure(packageDirectory, fixture, /digest or byte count/);
});

test('rejects symbolic links instead of following them', async (t) => {
  const fixture = await loadFixture();
  const packageDirectory = await writeFixture(t, fixture);
  const linkPath = path.join(packageDirectory, 'linked-file');
  try {
    await symlink(path.join(packageDirectory, 'manifest.v1.json'), linkPath, 'file');
  } catch (error) {
    t.skip('symbolic-link creation is unavailable on this Windows account');
    return;
  }
  await expectVerificationFailure(packageDirectory, fixture, /symbolic links/);
});
