import { createPublicKey, verify as verifySignature } from "node:crypto";

import {
  canonicalDigest,
  deepFreeze,
  digestString,
  exactKeys,
  nonEmptyString,
} from "./adaptive-evidence-contracts.mjs";
import { sha256 } from "./io.mjs";

const ATTESTATION_PURPOSE = "adaptive-evidence-portfolio-preregistration";
const TRUST_ROOT_PURPOSE = "adaptive-evidence-portfolio-preregistration-witness";
const IDENTIFIER = /^[a-z0-9][a-z0-9-]{0,127}$/;
const AUTHENTIC_AUTHORITIES = new WeakSet();
const RECORD_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "purpose",
  "registryId",
  "sequence",
  "previousWitnessDigest",
  "planDigest",
  "portfolioPolicyDigest",
  "authorityTrustRootDigest",
  "witnessedAt",
  "dispatchNotStarted",
]);

function identifier(value, label) {
  nonEmptyString(value, label);
  if (!IDENTIFIER.test(value)) throw new Error(`${label} must be a bounded lowercase identifier`);
  return value;
}

function exactIso(value, label) {
  nonEmptyString(value, label);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new TypeError(`${label} must be an exact ISO timestamp`);
  }
  return value;
}

function validateRecord(record) {
  exactKeys(record, RECORD_KEYS, "portfolio plan witness record");
  if (record.schemaVersion !== 1 || record.purpose !== ATTESTATION_PURPOSE) {
    throw new Error("portfolio plan witness record identity is invalid");
  }
  identifier(record.id, "portfolio plan witness id");
  identifier(record.registryId, "portfolio plan witness registry id");
  if (!Number.isInteger(record.sequence) || record.sequence < 0) {
    throw new TypeError("portfolio plan witness sequence must be a non-negative integer");
  }
  if (record.sequence === 0) {
    if (record.previousWitnessDigest !== null) {
      throw new Error("portfolio plan witness sequence zero cannot have a previous witness digest");
    }
  } else {
    digestString(record.previousWitnessDigest, "portfolio plan previous witness digest");
  }
  digestString(record.planDigest, "portfolio plan witness plan digest");
  digestString(record.portfolioPolicyDigest, "portfolio plan witness policy digest");
  digestString(record.authorityTrustRootDigest, "portfolio witness authority trust root digest");
  exactIso(record.witnessedAt, "portfolio plan witnessedAt");
  if (record.dispatchNotStarted !== true) {
    throw new Error("portfolio plan witness must attest that dispatch has not started");
  }
  return record;
}

export function portfolioWitnessRecordDigest(record) {
  return canonicalDigest(validateRecord(record));
}

export function portfolioWitnessAttestationMessage({
  algorithm,
  purpose,
  subjectDigest,
  keyId,
} = {}) {
  if (algorithm !== "ed25519") throw new Error("portfolio witness algorithm is invalid");
  if (purpose !== ATTESTATION_PURPOSE) throw new Error("portfolio witness purpose is invalid");
  digestString(subjectDigest, "portfolio witness attestation subject digest");
  identifier(keyId, "portfolio witness attestation key id");
  return Buffer.from(
    `eternities-adaptive-evidence-portfolio-witness-v1\n${purpose}\n${subjectDigest}\n${keyId}\n`,
    "utf8",
  );
}

function compileTrustRoot({ trustRootId, registryId, trustedKeys }) {
  identifier(trustRootId, "portfolio witness trust root id");
  identifier(registryId, "portfolio witness registry id");
  if (!(trustedKeys instanceof Map) || trustedKeys.size === 0 || trustedKeys.size > 32) {
    throw new TypeError("portfolio witness trustedKeys must be a non-empty Map of at most 32 keys");
  }
  const keys = [];
  const usable = new Map();
  for (const [keyId, supplied] of [...trustedKeys.entries()]
    .sort(([left], [right]) => left.localeCompare(right))) {
    identifier(keyId, "portfolio witness trusted key id");
    const publicKey = supplied?.type === "public" ? supplied : createPublicKey(supplied);
    if (publicKey.asymmetricKeyType !== "ed25519") {
      throw new Error(`portfolio witness trusted key ${keyId} is not Ed25519`);
    }
    const publicKeyBytes = publicKey.export({ type: "spki", format: "der" });
    keys.push({
      keyId,
      algorithm: "ed25519",
      publicKeySha256: sha256(publicKeyBytes),
    });
    usable.set(keyId, publicKey);
  }
  const body = {
    schemaVersion: 1,
    id: trustRootId,
    purpose: TRUST_ROOT_PURPOSE,
    registryId,
    keys,
  };
  return {
    trustRoot: deepFreeze({ ...body, trustRootDigest: canonicalDigest(body) }),
    usable,
  };
}

export function createPortfolioWitnessAuthority(options = {}) {
  exactKeys(
    options,
    ["trustRootId", "registryId", "trustedKeys"],
    "portfolio witness authority input",
  );
  const { trustRoot, usable } = compileTrustRoot(options);

  function verifyPlanWitness(input = {}) {
    exactKeys(
      input,
      ["witness", "plan", "expectedPolicyDigest"],
      "portfolio plan witness verification input",
    );
    const { witness, plan, expectedPolicyDigest } = input;
    exactKeys(
      witness,
      ["record", "attestation", "semanticVerificationRequired", "witnessDigest"],
      "portfolio plan witness",
    );
    if (witness.semanticVerificationRequired !== true) {
      throw new Error("portfolio plan witness requires runtime semantic verification");
    }
    digestString(witness.witnessDigest, "portfolio plan witness digest");
    const witnessBody = {
      record: witness.record,
      attestation: witness.attestation,
      semanticVerificationRequired: true,
    };
    if (canonicalDigest(witnessBody) !== witness.witnessDigest) {
      throw new Error("portfolio plan witness digest does not match its body");
    }
    const record = validateRecord(witness.record);
    digestString(expectedPolicyDigest, "portfolio witness expected policy digest");
    if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
      throw new TypeError("portfolio witness plan must be an object");
    }
    digestString(plan.planDigest, "portfolio witness expected plan digest");
    digestString(plan.policyDigest, "portfolio witness plan policy digest");
    exactIso(plan.registeredAt, "portfolio witness plan registeredAt");
    if (record.registryId !== trustRoot.registryId
        || record.authorityTrustRootDigest !== trustRoot.trustRootDigest) {
      throw new Error("portfolio plan witness is not bound to the host-pinned registry trust root");
    }
    if (record.planDigest !== plan.planDigest
        || record.portfolioPolicyDigest !== expectedPolicyDigest
        || plan.policyDigest !== expectedPolicyDigest) {
      throw new Error("portfolio plan witness is not bound to the expected plan and policy");
    }
    if (new Date(record.witnessedAt) < new Date(plan.registeredAt)) {
      throw new Error("portfolio plan witness chronology predates plan registration");
    }
    exactKeys(
      witness.attestation,
      ["algorithm", "purpose", "subjectDigest", "keyId", "signature"],
      "portfolio plan witness attestation",
    );
    const subjectDigest = portfolioWitnessRecordDigest(record);
    if (witness.attestation.subjectDigest !== subjectDigest
        || witness.attestation.purpose !== ATTESTATION_PURPOSE) {
      throw new Error("portfolio plan witness attestation does not match its signed subject");
    }
    const publicKey = usable.get(witness.attestation.keyId);
    if (!publicKey) throw new Error("portfolio plan witness key is not trusted");
    if (typeof witness.attestation.signature !== "string"
        || !/^[A-Za-z0-9+/]{86}==$/.test(witness.attestation.signature)) {
      throw new Error("portfolio plan witness signature is not canonical base64");
    }
    const signature = Buffer.from(witness.attestation.signature, "base64");
    const message = portfolioWitnessAttestationMessage(witness.attestation);
    if (signature.length !== 64
        || signature.toString("base64") !== witness.attestation.signature
        || !verifySignature(null, message, publicKey, signature)) {
      throw new Error("portfolio plan witness signature is invalid");
    }
    return deepFreeze({
      valid: true,
      witnessDigest: witness.witnessDigest,
      planDigest: record.planDigest,
      witnessedAt: record.witnessedAt,
      registryId: record.registryId,
      sequence: record.sequence,
      authorityKeyId: witness.attestation.keyId,
      authorityTrustRootDigest: trustRoot.trustRootDigest,
    });
  }

  const authority = Object.freeze({
    trustRoot,
    trustRootDigest: trustRoot.trustRootDigest,
    registryId: trustRoot.registryId,
    verifyPlanWitness,
  });
  AUTHENTIC_AUTHORITIES.add(authority);
  return authority;
}

export function verifyPortfolioPlanWitness(options = {}) {
  exactKeys(
    options,
    ["authority", "witness", "plan", "expectedPolicyDigest", "expectedTrustRootDigest"],
    "host-pinned portfolio plan witness verification input",
  );
  digestString(options.expectedTrustRootDigest, "expected portfolio witness trust root digest");
  if (!AUTHENTIC_AUTHORITIES.has(options.authority)) {
    throw new Error("portfolio plan witness authority was not constructed by the authentic verifier");
  }
  if (options.authority.trustRootDigest !== options.expectedTrustRootDigest) {
    throw new Error("portfolio plan witness authority is not the host-pinned trust root");
  }
  return options.authority.verifyPlanWitness({
    witness: options.witness,
    plan: options.plan,
    expectedPolicyDigest: options.expectedPolicyDigest,
  });
}

const digestSchema = () => ({ type: "string", pattern: "^[a-f0-9]{64}$" });
const stringSchema = () => ({ type: "string", minLength: 1 });
const closedObject = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  required,
  properties,
});

export function buildPortfolioWitnessSchema() {
  const record = closedObject({
    schemaVersion: { const: 1 },
    id: stringSchema(),
    purpose: { const: ATTESTATION_PURPOSE },
    registryId: stringSchema(),
    sequence: { type: "integer", minimum: 0 },
    previousWitnessDigest: { anyOf: [digestSchema(), { type: "null" }] },
    planDigest: digestSchema(),
    portfolioPolicyDigest: digestSchema(),
    authorityTrustRootDigest: digestSchema(),
    witnessedAt: { type: "string", format: "date-time" },
    dispatchNotStarted: { const: true },
  });
  record.allOf = [
    {
      if: { properties: { sequence: { const: 0 } }, required: ["sequence"] },
      then: { properties: { previousWitnessDigest: { type: "null" } } },
      else: { properties: { previousWitnessDigest: digestSchema() } },
    },
  ];
  const attestation = closedObject({
    algorithm: { const: "ed25519" },
    purpose: { const: ATTESTATION_PURPOSE },
    subjectDigest: digestSchema(),
    keyId: stringSchema(),
    signature: { type: "string", pattern: "^[A-Za-z0-9+/]{86}==$" },
  });
  return deepFreeze({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://eternities.ai/schemas/adaptive-evidence-portfolio-v1/witness.schema.json",
    title: "Adaptive Evidence Portfolio v1 Preregistration Witness",
    $comment: "Structural validation only. A host-pinned createPortfolioWitnessAuthority(...).verifyPlanWitness call is required before any trial completion or reduction.",
    ...closedObject({
      record,
      attestation,
      semanticVerificationRequired: { const: true },
      witnessDigest: digestSchema(),
    }),
  });
}
