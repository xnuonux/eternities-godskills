import assert from "node:assert/strict";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import test from "node:test";

const requiredPolicy = [
  /raw model capability as the floor/i,
  /`native` loads no skill body/i,
  /`guardrail` carries only non-negotiable constraints/i,
  /`method` loads the full selected workflow before work/i,
  /`review` preserves a raw first attempt/i,
  /use `method` only when the user explicitly requests that exact skill or when pinned, reviewed, matched task-class evidence/i,
  /hard process requirement may require a compact guardrail or host-level procedural check, but does not itself authorize full method injection/i,
  /creative generation, preserve native solution search/i,
  /never claim a scheduled review occurred/i,
  /never let activation expand authority/i,
  /never infer superiority from routing accuracy, corpus size, popularity, or structural tests alone/i,
];

test("installed Codex routing keeps raw capability as the floor and activation evidence-bound", async (t) => {
  const agentsPath = process.env.CODEX_AGENTS_PATH ?? join(homedir(), ".codex", "AGENTS.md");
  let instructions;
  try {
    instructions = await readFile(agentsPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      t.skip(`no installed Codex AGENTS.md at ${agentsPath}`);
      return;
    }
    throw error;
  }

  for (const pattern of requiredPolicy) {
    assert.match(instructions, pattern);
  }

  assert.doesNotMatch(
    instructions,
    /(?:always|must) (?:load|invoke|use) (?:a |the )?(?:skill|using-superpowers) (?:before|for) every (?:response|turn)/i,
  );
});
