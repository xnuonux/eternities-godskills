import { randomUUID, sign as signMessage, verify as verifySignature } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { sha256 } from "./io.mjs";

const PACKET_FIELDS = [
  "schemaVersion", "taskRef", "sessionRef", "revision", "parentDigest", "createdAt",
  "objective", "provenState", "completedWork", "openWork", "blockers", "authority",
  "evidencePointers", "nextAction", "status", "contextBudget", "estimatedTokens",
  "packetDigest",
];
const INPUT_FIELDS = PACKET_FIELDS.filter((field) => !["schemaVersion", "estimatedTokens", "packetDigest"].includes(field));
const STATUSES = new Set(["active", "blocked", "complete"]);

function exactFields(value, allowed, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...allowed].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} fields must be exact`);
  }
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) {
    throw new Error(`${label} must be a trimmed non-empty string`);
  }
  return value;
}

function identifier(value, label) {
  nonEmptyString(value, label);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/.test(value)) {
    throw new Error(`${label} must be a bounded identifier`);
  }
  return value;
}

function digest(value, label) {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label} must be a lowercase SHA-256 digest`);
  return value;
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.trim() === "" || entry !== entry.trim())) {
    throw new Error(`${label} must be an array of trimmed non-empty strings`);
  }
  if (new Set(value).size !== value.length) throw new Error(`${label} must not contain duplicates`);
  return [...value];
}

function sortedStringList(value, label) {
  const result = stringList(value, label);
  const sorted = [...result].sort((left, right) => left.localeCompare(right, "en"));
  if (result.some((entry, index) => entry !== sorted[index])) throw new Error(`${label} must be lexically sorted`);
  return result;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function canonicalBytes(value) {
  return Buffer.from(JSON.stringify(stableValue(value)), "utf8");
}

export function estimateTokens(value) {
  return Math.ceil(canonicalBytes(value).length / 4);
}

function validateAuthority(value) {
  exactFields(value, ["available", "excluded"], "checkpoint.authority");
  const authority = {
    available: sortedStringList(value.available, "checkpoint.authority.available"),
    excluded: sortedStringList(value.excluded, "checkpoint.authority.excluded"),
  };
  const excluded = new Set(authority.excluded);
  if (authority.available.some((entry) => excluded.has(entry))) throw new Error("checkpoint authority available and excluded sets overlap");
  return authority;
}

function canonicalLocator(value, label) {
  nonEmptyString(value, label);
  if (value.length > 512 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`${label} must be a bounded single-line locator`);
  const uri = /^[a-z][a-z0-9+.-]*:[^\s]+$/i.test(value);
  const pathLike = /[\\/]/.test(value) && !/[<>|?*"\r\n]/.test(value);
  if (!uri && !pathLike) throw new Error(`${label} must be a URI or path-like pointer`);
  return value;
}

function validateEvidencePointers(value) {
  if (!Array.isArray(value)) throw new Error("checkpoint.evidencePointers must be an array");
  const rows = value.map((entry, index) => {
    exactFields(entry, ["id", "locator", "digest"], `checkpoint.evidencePointers[${index}]`);
    identifier(entry.id, `checkpoint.evidencePointers[${index}].id`);
    canonicalLocator(entry.locator, `checkpoint.evidencePointers[${index}].locator`);
    digest(entry.digest, `checkpoint.evidencePointers[${index}].digest`);
    return { id: entry.id, locator: entry.locator, digest: entry.digest };
  });
  if (new Set(rows.map(({ id }) => id)).size !== rows.length) throw new Error("checkpoint evidence ids must be unique");
  const sorted = [...rows].sort((left, right) => left.id.localeCompare(right.id, "en"));
  if (rows.some((entry, index) => entry.id !== sorted[index].id)) throw new Error("checkpoint evidence pointers must be sorted by id");
  return rows;
}

function coreFromInput(input) {
  exactFields(input, INPUT_FIELDS, "checkpoint input");
  identifier(input.taskRef, "checkpoint.taskRef");
  identifier(input.sessionRef, "checkpoint.sessionRef");
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error("checkpoint.revision must be a positive safe integer");
  if (input.parentDigest !== null) digest(input.parentDigest, "checkpoint.parentDigest");
  if (input.revision === 1 && input.parentDigest !== null) throw new Error("first checkpoint parentDigest must be null");
  if (input.revision > 1 && input.parentDigest === null) throw new Error("later checkpoint parentDigest is required");
  nonEmptyString(input.createdAt, "checkpoint.createdAt");
  const timestamp = new Date(input.createdAt);
  if (Number.isNaN(timestamp.valueOf()) || timestamp.toISOString() !== input.createdAt) throw new Error("checkpoint.createdAt must be canonical ISO time");
  if (!STATUSES.has(input.status)) throw new Error("checkpoint.status is unknown");
  if (!Number.isSafeInteger(input.contextBudget) || input.contextBudget < 1) throw new Error("checkpoint.contextBudget must be a positive safe integer");
  const core = {
    schemaVersion: 1,
    taskRef: input.taskRef,
    sessionRef: input.sessionRef,
    revision: input.revision,
    parentDigest: input.parentDigest,
    createdAt: input.createdAt,
    objective: nonEmptyString(input.objective, "checkpoint.objective"),
    provenState: stringList(input.provenState, "checkpoint.provenState"),
    completedWork: stringList(input.completedWork, "checkpoint.completedWork"),
    openWork: stringList(input.openWork, "checkpoint.openWork"),
    blockers: stringList(input.blockers, "checkpoint.blockers"),
    authority: validateAuthority(input.authority),
    evidencePointers: validateEvidencePointers(input.evidencePointers),
    nextAction: nonEmptyString(input.nextAction, "checkpoint.nextAction"),
    status: input.status,
    contextBudget: input.contextBudget,
  };
  const estimatedTokens = estimateTokens(core);
  if (estimatedTokens > input.contextBudget) throw new Error("checkpoint exceeds its declared context budget");
  return { ...core, estimatedTokens };
}

export function createCheckpoint(input) {
  const core = coreFromInput(input);
  let estimatedTokens = core.estimatedTokens;
  let packet;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const body = { ...core, estimatedTokens };
    packet = { ...body, packetDigest: sha256(canonicalBytes(body)) };
    const actual = estimateTokens(packet);
    if (actual === estimatedTokens) break;
    estimatedTokens = actual;
  }
  if (packet.estimatedTokens !== estimateTokens(packet)) throw new Error("checkpoint token estimate did not converge");
  if (packet.estimatedTokens > packet.contextBudget) throw new Error("checkpoint exceeds its declared context budget");
  return packet;
}

function validateCheckpoint(packet) {
  exactFields(packet, PACKET_FIELDS, "checkpoint");
  if (packet.schemaVersion !== 1) throw new Error("checkpoint.schemaVersion must be 1");
  const input = Object.fromEntries(INPUT_FIELDS.map((field) => [field, packet[field]]));
  const expected = createCheckpoint(input);
  if (packet.packetDigest !== expected.packetDigest) throw new Error("checkpoint digest mismatch");
  if (packet.estimatedTokens !== expected.estimatedTokens) throw new Error("checkpoint estimated token count mismatch");
  return packet;
}

export function continuityAttestationMessage({ algorithm, purpose, subjectDigest, keyId }) {
  if (algorithm !== "ed25519") throw new Error("continuity attestation algorithm must be ed25519");
  if (purpose !== "task-continuity-checkpoint") throw new Error("continuity attestation purpose is invalid");
  digest(subjectDigest, "continuity attestation subjectDigest");
  identifier(keyId, "continuity attestation keyId");
  return Buffer.from(`eternities-continuity-v1\n${purpose}\n${subjectDigest}\n${keyId}\n`, "utf8");
}

export function attestCheckpoint(packet, { keyId, privateKey }) {
  validateCheckpoint(packet);
  const unsigned = {
    algorithm: "ed25519",
    purpose: "task-continuity-checkpoint",
    subjectDigest: packet.packetDigest,
    keyId: identifier(keyId, "continuity attestation keyId"),
  };
  return {
    packet,
    attestation: {
      ...unsigned,
      signature: signMessage(null, continuityAttestationMessage(unsigned), privateKey).toString("base64"),
    },
  };
}

export function verifyCheckpointEnvelope(envelope, { trustedKeys, expectedTaskRef } = {}) {
  exactFields(envelope, ["packet", "attestation"], "continuity envelope");
  const packet = validateCheckpoint(envelope.packet);
  if (expectedTaskRef !== undefined && packet.taskRef !== expectedTaskRef) throw new Error("checkpoint taskRef mismatch");
  if (!(trustedKeys instanceof Map)) throw new TypeError("trustedKeys must be a Map");
  const attestation = envelope.attestation;
  exactFields(attestation, ["algorithm", "purpose", "subjectDigest", "keyId", "signature"], "continuity attestation");
  if (attestation.subjectDigest !== packet.packetDigest) throw new Error("continuity attestation digest binding mismatch");
  const publicKey = trustedKeys.get(attestation.keyId);
  if (!publicKey) throw new Error("continuity attestation key is not trusted");
  if (typeof attestation.signature !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(attestation.signature)) {
    throw new Error("continuity attestation signature must be canonical base64");
  }
  const signature = Buffer.from(attestation.signature ?? "", "base64");
  if (signature.length !== 64 || signature.toString("base64") !== attestation.signature ||
      !verifySignature(null, continuityAttestationMessage(attestation), publicKey, signature)) {
    throw new Error("continuity attestation signature is invalid");
  }
  return packet;
}

function verifyChain(envelopes, trustedKeys, expectedTaskRef) {
  let previous = null;
  for (const envelope of envelopes) {
    const packet = verifyCheckpointEnvelope(envelope, { trustedKeys, expectedTaskRef });
    if (previous === null) {
      if (packet.revision !== 1 || packet.parentDigest !== null) throw new Error("checkpoint chain must begin at revision 1");
    } else {
      if (packet.revision !== previous.revision + 1) throw new Error("checkpoint revision is not monotonic");
      if (packet.parentDigest !== previous.packetDigest) throw new Error("checkpoint parent digest mismatch");
      if (new Date(packet.createdAt) < new Date(previous.createdAt)) throw new Error("checkpoint time moved backwards");
      const previousAvailable = new Set(previous.authority.available);
      const currentExcluded = new Set(packet.authority.excluded);
      if (packet.authority.available.some((entry) => !previousAvailable.has(entry))) throw new Error("checkpoint authority cannot expand across revisions");
      if (previous.authority.excluded.some((entry) => !currentExcluded.has(entry))) throw new Error("checkpoint authority exclusions cannot be removed");
    }
    previous = packet;
  }
  return previous;
}

async function readLog(logPath) {
  try {
    const text = await readFile(logPath, "utf8");
    if (text === "") return [];
    if (!text.endsWith("\n")) throw new Error("checkpoint log has an incomplete final record");
    return text.trim().split(/\r?\n/).map((line, index) => {
      try { return JSON.parse(line); } catch { throw new Error(`checkpoint log record ${index + 1} is invalid JSON`); }
    });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function processAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === "EPERM"; }
}

async function acquireLock(lockPath, staleLockMs) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");
      const record = { schemaVersion: 1, pid: process.pid, host: os.hostname(), createdAt: new Date().toISOString() };
      await handle.writeFile(JSON.stringify(record), "utf8");
      await handle.sync();
      return handle;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let staleDeadOwner = false;
      try {
        const record = JSON.parse(await readFile(lockPath, "utf8"));
        const created = new Date(record.createdAt).valueOf();
        staleDeadOwner = record.schemaVersion === 1 && record.host === os.hostname() &&
          Number.isSafeInteger(record.pid) && Number.isFinite(created) &&
          Date.now() - created > staleLockMs && !processAlive(record.pid);
      } catch {
        staleDeadOwner = false;
      }
      if (!staleDeadOwner || attempt > 0) throw new Error("checkpoint log is locked by another writer");
      await rm(lockPath, { force: true });
    }
  }
  throw new Error("checkpoint log lock could not be acquired");
}

async function durableReplace(logPath, text) {
  const directory = path.dirname(logPath);
  const temporary = path.join(directory, `.${path.basename(logPath)}.${process.pid}.${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await open(temporary, "wx");
    await handle.writeFile(text, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, logPath);
    try {
      const directoryHandle = await open(directory, "r");
      try { await directoryHandle.sync(); } finally { await directoryHandle.close(); }
    } catch (error) {
      if (!["EACCES", "EISDIR", "EINVAL", "EPERM"].includes(error.code)) throw error;
    }
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function appendCheckpoint({ logPath, envelope, trustedKeys, staleLockMs = 5 * 60 * 1000 }) {
  if (typeof logPath !== "string" || logPath.trim() === "") throw new Error("logPath is required");
  if (!Number.isSafeInteger(staleLockMs) || staleLockMs < 0) throw new Error("staleLockMs must be a non-negative safe integer");
  const directory = path.dirname(logPath);
  await mkdir(directory, { recursive: true });
  const lockPath = `${logPath}.lock`;
  const lock = await acquireLock(lockPath, staleLockMs);
  try {
    const current = await readLog(logPath);
    const expectedTaskRef = current[0]?.packet?.taskRef ?? envelope?.packet?.taskRef;
    verifyChain([...current, envelope], trustedKeys, expectedTaskRef);
    await durableReplace(logPath, `${current.map(JSON.stringify).join("\n")}${current.length ? "\n" : ""}${JSON.stringify(envelope)}\n`);
    return envelope.packet;
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

export async function recoverContinuity({ logPath, trustedKeys, expectedTaskRef, maxTokens, now, maxAgeMs, allowedClockSkewMs = 5 * 60 * 1000 } = {}) {
  identifier(expectedTaskRef, "expectedTaskRef");
  if (!Number.isSafeInteger(maxTokens) || maxTokens < 1) throw new Error("maxTokens must be a positive safe integer");
  const envelopes = await readLog(logPath);
  if (envelopes.length === 0) throw new Error("checkpoint log is empty");
  const packet = verifyChain(envelopes, trustedKeys, expectedTaskRef);
  const recoveryTokens = estimateTokens(packet);
  if (recoveryTokens > maxTokens || recoveryTokens > packet.contextBudget) throw new Error("recovered checkpoint exceeds context budget");
  if (!Number.isSafeInteger(allowedClockSkewMs) || allowedClockSkewMs < 0) throw new Error("allowedClockSkewMs must be a non-negative safe integer");
  const current = now === undefined ? new Date() : new Date(now);
  if (Number.isNaN(current.valueOf())) throw new Error("now must be a valid time");
  const created = new Date(packet.createdAt).valueOf();
  if (created > current.valueOf() + allowedClockSkewMs) throw new Error("recovered checkpoint is future-dated beyond allowed clock skew");
  if (maxAgeMs !== undefined) {
    if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs < 0) throw new Error("maxAgeMs must be a non-negative safe integer");
    if (current.valueOf() - created > maxAgeMs) throw new Error("recovered checkpoint is stale");
  }
  return {
    schemaVersion: 1,
    packet,
    recoveryTokens,
    verifiedKeyId: envelopes.at(-1).attestation.keyId,
    proofLimits: ["latest-attested-packet-only", "no-host-action-performed"],
  };
}
