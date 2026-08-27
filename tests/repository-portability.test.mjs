import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const repositoryRoot = new URL("../", import.meta.url);

test("repository text is checked out with canonical LF endings", async () => {
  const attributes = await readFile(new URL(".gitattributes", repositoryRoot), "utf8");

  assert.match(attributes, /^\* text=auto eol=lf$/m);
});
