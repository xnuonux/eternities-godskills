import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "./io.mjs";

function assertInside(root, target) {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return relative;
  }
  throw new Error(`source path escapes canonical warehouse root: ${target}`);
}

function windowsRelative(value) {
  return value.split(path.sep).join("\\");
}

function lineCount(text) {
  return text.length === 0 ? 0 : text.split(/\r\n|\n|\r/).length;
}

export async function auditBody(warehouseRoot, record) {
  if (!record || typeof record !== "object") throw new TypeError("record must be an object");
  if (typeof record.id !== "string" || record.id === "") {
    throw new Error("record.id must be a non-empty string");
  }
  if (typeof record.sourcePath !== "string" || record.sourcePath === "") {
    throw new Error("record.sourcePath must be a non-empty string");
  }

  const canonicalRoot = await realpath(path.resolve(warehouseRoot));
  const lexicalTarget = path.resolve(canonicalRoot, record.sourcePath);
  const relative = assertInside(canonicalRoot, lexicalTarget);
  const base = {
    schemaVersion: 1,
    sourceId: record.id,
    resolvedRelativePath: windowsRelative(relative),
  };

  let canonicalTarget;
  try {
    canonicalTarget = await realpath(lexicalTarget);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        ...base,
        status: "missing",
        present: false,
        bodySha256: null,
        byteSize: null,
        lineCount: null,
        errorCode: "ENOENT",
      };
    }
    return {
      ...base,
      status: "unreadable",
      present: false,
      bodySha256: null,
      byteSize: null,
      lineCount: null,
      errorCode: error?.code ?? "UNKNOWN",
    };
  }

  assertInside(canonicalRoot, canonicalTarget);
  try {
    const bytes = await readFile(canonicalTarget);
    const text = bytes.toString("utf8");
    return {
      ...base,
      status: "inspected",
      present: true,
      bodySha256: sha256(bytes),
      byteSize: bytes.byteLength,
      lineCount: lineCount(text),
      errorCode: null,
    };
  } catch (error) {
    return {
      ...base,
      status: "unreadable",
      present: true,
      bodySha256: null,
      byteSize: null,
      lineCount: null,
      errorCode: error?.code ?? "UNKNOWN",
    };
  }
}

export async function auditBodies(warehouseRoot, records, { concurrency = 32 } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("concurrency must be a positive integer");
  }
  const ordered = [...records].sort((left, right) => left.id.localeCompare(right.id));
  const results = [];
  for (let offset = 0; offset < ordered.length; offset += concurrency) {
    const batch = ordered.slice(offset, offset + concurrency);
    results.push(...(await Promise.all(batch.map((record) => auditBody(warehouseRoot, record)))));
  }
  return results;
}
