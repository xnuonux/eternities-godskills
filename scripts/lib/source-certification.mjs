import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { canonicalJson } from "../../src/capability-layer-abi.mjs";
import { sha256 } from "../../src/io.mjs";
import { discoverLocalModuleClosure } from "../../src/static-module-closure.mjs";

const execFileAsync = promisify(execFile);
const COMMIT = /^[a-f0-9]{40}$/;

function controlledGitEnvironment() {
  const environment = { ...process.env };
  for (const name of [
    "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_COMMON_DIR",
  ]) delete environment[name];
  return environment;
}

async function git(root, args, options = {}) {
  return execFileAsync("git", ["-C", root, ...args], {
    windowsHide: true,
    env: controlledGitEnvironment(),
    ...options,
  });
}

export function valueDigest(value) {
  return sha256(canonicalJson(value));
}

export async function gitText(root, commit, relativePath) {
  const { stdout } = await git(root, ["show", `${commit}:${relativePath}`], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

export async function assertCommit(root, commit) {
  if (!COMMIT.test(commit)) throw new Error("certification source commit is invalid");
  await git(root, ["cat-file", "-e", `${commit}^{commit}`]);
}

export async function manifestAtCommit(root, commit, paths) {
  const entries = [];
  for (const relativePath of paths) {
    const text = await gitText(root, commit, relativePath);
    entries.push({
      path: relativePath,
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, "utf8"),
    });
  }
  return Object.freeze({
    paths: [...paths],
    entries,
    digest: valueDigest(entries),
  });
}

export async function moduleClosureAtCommit(root, commit, roots) {
  const repositoryRoot = path.resolve(root);
  return discoverLocalModuleClosure({
    repositoryRoot,
    roots,
    io: {
      async realpath(target) {
        return path.resolve(target);
      },
      async readFile(target) {
        const absolute = path.resolve(target);
        const relative = path.relative(repositoryRoot, absolute).replaceAll("\\", "/");
        if (relative === "" || relative.startsWith("../") || path.isAbsolute(relative)) {
          throw new Error("source closure path escaped repository root");
        }
        return Buffer.from(await gitText(root, commit, relative), "utf8");
      },
    },
  });
}

export function runTests(files, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, ["--test", "--test-reporter=tap", ...files], {
      cwd,
      shell: false,
      windowsHide: true,
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", rejectPromise);
    child.once("close", (code) => {
      const number = (name) => Number(
        output.match(new RegExp(`(?:^|\\n)# ${name} (\\d+)(?:\\r?$|\\n)`))?.[1],
      );
      const tests = number("tests");
      if (code !== 0 || !Number.isInteger(tests) || tests < 1
          || number("pass") !== tests || number("fail") !== 0 || number("skipped") !== 0) {
        rejectPromise(new Error(`certification test gate failed with code ${code}`));
        return;
      }
      resolvePromise(Object.freeze({ status: "pass", tests }));
    });
  });
}

async function dirtyPaths(root) {
  const outputs = await Promise.all([
    git(root, ["diff", "--name-only"], { encoding: "utf8" }),
    git(root, ["diff", "--cached", "--name-only"], { encoding: "utf8" }),
    git(root, ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" }),
  ]);
  return [...new Set(outputs.flatMap(({ stdout }) => (
    stdout.split(/\r?\n/).filter(Boolean)
  )))].sort();
}

export async function requireCleanExcept(root, allowed) {
  const unexpected = (await dirtyPaths(root)).filter((relativePath) => !allowed.includes(relativePath));
  if (unexpected.length > 0) {
    throw new Error(`source worktree has unexpected changes: ${unexpected.join(", ")}`);
  }
}

export async function headCommit(root) {
  return (await git(root, ["rev-parse", "HEAD"], { encoding: "utf8" })).stdout.trim();
}

function reviewPathspec(excludedPaths) {
  return ["--", ".", ...excludedPaths.map((relativePath) => `:(exclude)${relativePath}`)];
}

async function reviewedDiff(root, range, excludedPaths) {
  const pathspec = reviewPathspec(excludedPaths);
  const [{ stdout: bytes }, { stdout: names }] = await Promise.all([
    git(root, ["diff", "--no-ext-diff", "--binary", range, ...pathspec], {
      maxBuffer: 32 * 1024 * 1024,
    }),
    git(root, ["diff", "--name-only", "--no-renames", range, ...pathspec], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    }),
  ]);
  return Object.freeze({
    reviewedDiffSha256: sha256(bytes),
    reviewedPaths: names.split(/\r?\n/).filter(Boolean).sort(),
  });
}

export async function reviewedWorkingDiff(root, { excludedPaths = [] } = {}) {
  const parentCommit = await headCommit(root);
  return Object.freeze({
    parentCommit,
    ...await reviewedDiff(root, parentCommit, excludedPaths),
  });
}

export async function reviewedDiffAtCommit(root, commit, { excludedPaths = [] } = {}) {
  await assertCommit(root, commit);
  const parentCommit = (await git(
    root,
    ["rev-parse", `${commit}^`],
    { encoding: "utf8" },
  )).stdout.trim();
  return Object.freeze({
    parentCommit,
    ...await reviewedDiff(root, `${parentCommit}..${commit}`, excludedPaths),
  });
}

export async function resolveSourceCommit({ root, head, receiptPath, releaseOnlyPaths }) {
  try {
    const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    const sourceCommit = receipt.source?.commit;
    await assertCommit(root, sourceCommit);
    await git(root, ["merge-base", "--is-ancestor", sourceCommit, head]);
    const changed = (await git(
      root,
      ["diff", "--name-only", "--no-renames", `${sourceCommit}..${head}`],
      { encoding: "utf8" },
    )).stdout.split(/\r?\n/).filter(Boolean);
    return changed.every((relativePath) => releaseOnlyPaths.includes(relativePath))
      ? sourceCommit
      : head;
  } catch (error) {
    if (error?.code === "ENOENT") return head;
    throw error;
  }
}
