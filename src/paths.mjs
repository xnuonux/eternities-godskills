import path from "node:path";

export function assertInside(parent, child) {
  const root = path.win32.resolve(parent).replace(/[\\/]+$/, "");
  const candidate = path.win32.resolve(child);
  const foldedRoot = root.toLowerCase();
  const foldedCandidate = candidate.toLowerCase();
  if (
    foldedCandidate !== foldedRoot &&
    !foldedCandidate.startsWith(`${foldedRoot}\\`)
  ) {
    throw new Error(`path is outside canonical root: ${candidate}`);
  }
  return candidate;
}
