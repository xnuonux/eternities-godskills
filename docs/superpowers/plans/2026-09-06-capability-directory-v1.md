# capability directory v1 implementation plan

> for agentic workers: execute inline. coordinate the existing Godagents task
> only at its actual integration boundary. this plan creates no new agent task.

**Goal:** give every consumer one read-only, typed, bounded way to discover the
existing 44 skills and 26 owner extensions without loading skill bodies.

**Architecture:** project the existing broad cards, operational records, and
extension definitions into an advisory directory. list broad disciplines,
drill into an owner, or retrieve an exact ID. do not add semantic ranking,
authority interpretation, installation, activation, or provider calls here.

**Tech Stack:** existing Node.js 24+ ESM, node:test, node:fs/promises; no new
runtime dependency.

**Spec:** [godskills v1 completion contract](../specs/2026-09-06-godskills-v1-completion.md),
slice 1 and R1/R2/R5 discovery subset only. other release gates remain open.

## global constraints

- preserve all existing executable receipts, policies, routing cards and host pins.
- normal library use must not need D:, the quarry, a keel, Godagents or a provider.
- broad skills, operational skills and extensions are distinct kinds, not 70
  interchangeable standalone methods.
- listing reads metadata and entrypoint existence only, never body contents.
- page size is at most five records and 4,096 serialized UTF-8 bytes.
- no installation, execution, authority grant, method promotion or global config edit.
- use targeted tests while editing; reserve full-suite verification for integration.

## owned files and interfaces

create `src/capability-directory.mjs` for pure projection, validation and paging.
create `scripts/capabilities.mjs` for explicit-root metadata I/O and CLI.
create `tests/capability-directory.test.mjs` for pure contract tests and
`tests/capabilities-cli.test.mjs` for temporary-repository integration tests.
update `package.json` with `capabilities: node scripts/capabilities.mjs` and
replace the dated hand-maintained table in `docs/capability-directory.md` with
usage plus a clearly generated view. update README usage only after verification.

public interfaces, with these exact names:

```js
buildCapabilityDirectory({ broadCards, operationalRecords, extensionRecords,
  installedSkillIds })
// -> { schemaVersion: 1, role: "advisory-catalog", entries: Entry[] }

pageCapabilityDirectory(directory, { kind = null, ownerId = null, id = null,
  offset = 0, limit = 5 } = {})
// -> { role: "advisory-catalog", entries: Entry[], nextOffset: number | null }

readCapabilityDirectory(repositoryRoot)
// async, -> same directory; explicit root, no environment or warehouse lookup

parseCapabilityArguments(argv)
// -> { repositoryRoot, kind, ownerId, id, offset, limit }
```

an `Entry` has exactly `id`, `kind`, `ownerId`, `family`, `summary`,
`entrypoint`, and `definitionPath`. kinds are `broad`, `operational`,
`extension`. broad `ownerId` is null. operational/extension owners must name a
broad entry. skill entrypoints are relative `skills/<id>/SKILL.md`; extension
entrypoints are null and their definitionPath is
`data/godskill-extensions.v1.json`. for skill entries definitionPath is the
corresponding existing cards/records path. family comes from the broad card or
its resolved owner. summaries are descriptive metadata, never instructions.

## task 1: truthful typed projection

**Files:** create `src/capability-directory.mjs` and
`tests/capability-directory.test.mjs`.

- [ ] add a minimal fixture and failing test:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { buildCapabilityDirectory } from "../src/capability-directory.mjs";

function input() {
  return {
    broadCards: [{ id: "owner", family: "engineering", intent: "build software",
      entrypoint: "skills/owner/SKILL.md" }],
    operationalRecords: [{ id: "retry", ownerGodskillId: "owner",
      intent: "recover without duplicate effects" }],
    extensionRecords: [{ id: "review-retry", categoricalOwnerId: "owner",
      intent: "review retry evidence" }],
    installedSkillIds: ["owner", "retry"],
  };
}

test("directory distinguishes methods from owner extensions", () => {
  const d = buildCapabilityDirectory(input());
  assert.equal(d.role, "advisory-catalog");
  assert.deepEqual(d.entries.map(e => e.id), ["owner", "retry", "review-retry"]);
  assert.deepEqual(d.entries.map(e => e.kind), ["broad", "operational", "extension"]);
  assert.equal(d.entries[2].entrypoint, null);
  assert.equal(d.entries[1].ownerId, "owner");
});

test("missing and orphaned capabilities fail instead of disappearing", () => {
  const missing = input();
  missing.installedSkillIds.pop();
  assert.throws(() => buildCapabilityDirectory(missing), /inventory/);
  const orphan = input();
  orphan.operationalRecords[0].ownerGodskillId = "absent";
  assert.throws(() => buildCapabilityDirectory(orphan), /owner/);
});
```

- [ ] run `node --test tests/capability-directory.test.mjs`; confirm missing
  module/export fails before production code exists.
- [ ] implement projection: validate array types and required nonempty strings,
  allow empty operational/extension arrays in a smaller pack, and enforce ID pattern
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`; reject duplicate IDs within or across kinds;
  resolve each owner before deriving family; require exact equality between
  installedSkillIds and the union of broad/operational IDs; whitelist output
  fields; sort by ID without locale dependence. never spread a source object
  into public metadata. reject traversal/absolute entrypoints and missing owners.
- [ ] extend tests with duplicate IDs, an unlisted installed skill, absolute and
  traversal entrypoints, empty descriptions, owner confusion, deterministic
  ordering, source objects containing extra hostile fields, and unchanged inputs.
- [ ] run the targeted file and commit the verified projection.

## task 2: bounded navigation, not a second semantic router

**Files:** modify the two task-1 files.

**Consumes:** the exact directory above. **Produces:**
`pageCapabilityDirectory` with the declared page shape.

- [ ] extend the task-1 import to include `pageCapabilityDirectory`, then add
  a failing navigation test:

```js
test("exact lookup and owner drill-down stay advisory", () => {
  const d = buildCapabilityDirectory(input());
  const page = pageCapabilityDirectory(d, { ownerId: "owner", limit: 1 });
  assert.equal(page.role, "advisory-catalog");
  assert.equal(page.entries[0].id, "retry");
  assert.equal(page.nextOffset, 1);
  assert.equal(pageCapabilityDirectory(d, { id: "missing" }).entries.length, 0);
  assert.throws(() => pageCapabilityDirectory(d, { limit: 6 }), /limit/);
});
```

- [ ] confirm failure, then filter by exact kind/owner/id, sort by ID and page
  after filtering. reject conflicting id-plus-owner/kind filters, negative or
  fractional offsets, noninteger limits, unknown filters and limits outside
  1..5. include whole cards until JSON UTF-8 size reaches 4,096 bytes; never
  truncate a card. if one card cannot fit, return an explicit oversize error.
  `nextOffset` advances by the number returned, not the requested limit.
- [ ] add tests for byte-boundary overflow, multibyte summaries, no omitted or
  duplicated records across pages, empty final page, and exactly five records.
  assert no `selected`, `activated`, `authority` or execution field is emitted.
- [ ] run targeted tests and commit. do not add keyword scoring to fill the
  unrelated semantic gap found by the audit.

## task 3: portable CLI and real inventory reconciliation

**Files:** create `scripts/capabilities.mjs`,
`tests/capabilities-cli.test.mjs`; modify `package.json`.

**Consumes:** `buildCapabilityDirectory` and `pageCapabilityDirectory`.
**Produces:** `readCapabilityDirectory`, `parseCapabilityArguments`, and CLI.

- [ ] begin with a subprocess test invoking the not-yet-existing CLI against a
  temporary fixture root containing only the three metadata sources and two
  empty `SKILL.md` files. require exit 0 and `role === "advisory-catalog"`.
  require a sibling fixture with no warehouse, git metadata or node_modules.
  invoke the CLI by its absolute script path from a different working directory.

```js
import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const exec = promisify(execFile);
const cli = fileURLToPath(new URL("../scripts/capabilities.mjs", import.meta.url));

test("CLI lists a relocated metadata-only repository", async t => {
  const root = await mkdtemp(join(tmpdir(), "capability-directory-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const p of ["artifacts/routing", "data", "skills/owner", "skills/retry"])
    await mkdir(join(root, p), { recursive: true });
  await writeFile(join(root, "artifacts/routing/cards.jsonl"), JSON.stringify({
    id: "owner", family: "engineering", intent: "build software",
    entrypoint: "skills/owner/SKILL.md"
  }) + "\n");
  await writeFile(join(root, "data/operational-capabilities.v1.json"),
    JSON.stringify({ records: [{ id: "retry", ownerGodskillId: "owner",
      intent: "recover without duplicates" }] }));
  await writeFile(join(root, "data/godskill-extensions.v1.json"),
    JSON.stringify({ extensions: [] }));
  for (const id of ["owner", "retry"])
    await writeFile(join(root, "skills", id, "SKILL.md"), "");
  const { stdout } = await exec(process.execPath,
    [cli, "--root", root, "--id", "retry"], { cwd: tmpdir(), windowsHide: true });
  const page = JSON.parse(stdout);
  assert.equal(page.role, "advisory-catalog");
  assert.equal(page.entries[0].id, "retry");
  assert.equal(page.entries[0].entrypoint, "skills/retry/SKILL.md");
});
```

- [ ] confirm missing-script failure, then read only
  `artifacts/routing/cards.jsonl`, `data/operational-capabilities.v1.json`, and
  `data/godskill-extensions.v1.json`; enumerate direct skill directories and
  check their SKILL.md files exist without reading their contents. resolve
  paths against the explicit root and reject symlink escapes. imported module
  has no execution side effect.
- [ ] accept `--root`, `--kind`, `--owner`, `--id`, `--offset`, `--limit` exactly
  once each; reject unknown/missing/duplicate values. default root is the
  repository containing the script, not the current working directory. emit
  JSON to stdout, errors to stderr and nonzero exit. do not write any file.
- [ ] add a real-checkout integration assertion: 22 broad, 22 operational,
  26 extensions, with 44 distinct entrypoints. check exact IDs
  `api-rate-limit-recovery` and `physics-constrained-numerical-validation`.
  these snapshot counts must be deliberately updated with future content, not
  treated as perpetual runtime constants.
- [ ] test missing metadata, malformed JSONL, unreadable/missing entrypoint,
  symlink escape, and emitted relative paths. snapshot fixture contents before
  and after invocation to demonstrate no mutation.
- [ ] run both new test files and commit the verified CLI and package script.

## task 4: documentation and integration gate

**Files:** update `docs/capability-directory.md`, `README.md`; no global profiles.

- [ ] document real commands, including:

```powershell
npm run capabilities -- --kind broad
npm run capabilities -- --owner eternities-daedalus
npm run capabilities -- --id physics-constrained-numerical-validation
```

- [ ] run each documented command and inspect the named result. list every
  page and reconcile 70 typed records with the source inventory. document that
  this slice fixes access, not automatic semantic matching or activation.
- [ ] review the diff for accidental host/path requirements and unsupported
  quality claims; verify old `intent` and `route` behavior has not changed.
- [ ] reconcile origin/main, run the new tests and existing intent/runtime,
  routing-index and operational-promotion checks. at final integration run the
  full suite once; store actual exit status, totals, failures/skips and duration.
  if interrupted, do not label the release passing or start duplicate runs.
- [ ] merge/push after verified review under dom's standing authority. tell the
  Godagents task which executable bytes did or did not change before it refreshes
  a host pin. no silent regeneration of historical roots.

## acceptance and handoff

slice 1 is complete when every current skill/extension is reachable through a
bounded metadata page and exact ID, with no warehouse dependency, body loading,
permission change, provider call or filesystem mutation. R1 and listing R2/R5
are covered by tasks 1-4. semantic relevance, content refinement, comparative
qualification, whole-pack installation and v1 release remain subsequent gates.
