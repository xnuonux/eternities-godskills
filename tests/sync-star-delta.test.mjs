import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  applyStarSync,
  buildCloneCommand,
  destinationFor,
  normalizeGitHubRemote,
  planStarSync,
} from "../scripts/sync-star-delta.mjs";

const warehouseRoot = "D:\\03-ARSENAL\\warehouse";

test("GitHub remote normalization preserves exact owner and repository identity", () => {
  assert.equal(
    normalizeGitHubRemote("git@github.com:Microsoft/MarkItDown.git"),
    "microsoft/markitdown",
  );
  assert.equal(
    normalizeGitHubRemote("https://github.com/Leonxlnx/taste-skill.git/"),
    "leonxlnx/taste-skill",
  );
});

test("destination uses collision-safe owner double-underscore repository name", () => {
  assert.equal(
    destinationFor("github/github-mcp-server", warehouseRoot),
    "D:\\03-ARSENAL\\warehouse\\from-stars\\github__github-mcp-server",
  );
});

test("planner skips an exact remote represented at another canonical path", () => {
  const inventory = new Map([
    ["microsoft/markitdown", "D:\\03-ARSENAL\\warehouse\\hunt\\atlas\\microsoft__markitdown"],
  ]);
  const [row] = planStarSync(
    [
      {
        fullName: "microsoft/markitdown",
        cloneUrl: "https://github.com/microsoft/markitdown.git",
        disposition: "ingest",
      },
    ],
    inventory,
    warehouseRoot,
  );
  assert.equal(row.action, "existing");
  assert.match(row.destination, /hunt\\atlas\\microsoft__markitdown$/i);
});

test("planner marks a different remote at the destination as a conflict", () => {
  const destination = destinationFor("github/github-mcp-server", warehouseRoot);
  const inventory = new Map([["other/identity", destination]]);
  const [row] = planStarSync(
    [
      {
        fullName: "github/github-mcp-server",
        cloneUrl: "https://github.com/github/github-mcp-server.git",
        disposition: "ingest",
      },
    ],
    inventory,
    warehouseRoot,
  );
  assert.equal(row.action, "conflict");
});

test("clone command is shallow, tag-free, and never initializes submodules", () => {
  const command = buildCloneCommand({
    cloneUrl: "https://github.com/github/github-mcp-server.git",
    destination: "D:\\03-ARSENAL\\warehouse\\from-stars\\github__github-mcp-server",
  });
  assert.deepEqual(command, [
    "clone",
    "--depth",
    "1",
    "--no-tags",
    "https://github.com/github/github-mcp-server.git",
    "D:\\03-ARSENAL\\warehouse\\from-stars\\github__github-mcp-server",
  ]);
  assert.equal(command.includes("--recurse-submodules"), false);
});

function git(repositoryPath, args) {
  const result = spawnSync("git", ["-C", repositoryPath, ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
}

test("existing interrupted checkouts become explicit failed-verification rows", async () => {
  const repositoryPath = await mkdtemp(path.join(tmpdir(), "godskills-interrupted-clone-"));
  try {
    git(repositoryPath, ["init", "-b", "main"]);
    git(repositoryPath, ["config", "user.email", "tests@eternities.local"]);
    git(repositoryPath, ["config", "user.name", "Eternities Tests"]);
    await writeFile(path.join(repositoryPath, "tracked.txt"), "complete\n", "utf8");
    git(repositoryPath, ["add", "tracked.txt"]);
    git(repositoryPath, ["commit", "-m", "fixture"]);
    git(repositoryPath, ["remote", "add", "origin", "https://github.com/owner/repo.git"]);
    await writeFile(path.join(repositoryPath, "tracked.txt"), "interrupted\n", "utf8");

    const receipt = await applyStarSync([
      {
        fullName: "owner/repo",
        identity: "owner/repo",
        action: "existing",
        destination: repositoryPath,
      },
    ]);

    assert.equal(receipt.rows[0].status, "failed-verification");
    assert.match(receipt.rows[0].error, /worktree is not clean/);
  } finally {
    await rm(repositoryPath, { recursive: true, force: true });
  }
});

test("batch execution checkpoints after every completed row", async () => {
  const checkpoints = [];
  const receipt = await applyStarSync(
    [
      { fullName: "one/repo", action: "conflict", destination: "D:\\one" },
      { fullName: "two/repo", action: "conflict", destination: "D:\\two" },
    ],
    {
      onProgress: async (snapshot) => {
        checkpoints.push({ rows: snapshot.rows.length, complete: snapshot.complete });
      },
    },
  );

  assert.deepEqual(checkpoints, [
    { rows: 1, complete: false },
    { rows: 2, complete: false },
  ]);
  assert.equal(receipt.complete, true);
});
