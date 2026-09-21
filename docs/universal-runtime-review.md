# Universal product runtime review

Bounded review of the portable runtime boundary on 2026-09-21. Scope was the
installer, rollback, manifest generation/validation, and offline discovery in
`product/lib/product.mjs` and `product/bin/godskills.mjs`. Product skill
content and in-progress metadata were not reviewed. P1 means release-blocking
correctness or data loss; P2 means a material portability or discovery-boundary
defect.

The parent changes for rejecting an unrelated existing runtime, checking staged
skills against the approved release subset, and fencing staged/final runtime
release IDs are present. Their red-green tests pass and are not repeated as
findings below.

## Findings

### UR-001 — P1 — Rollback overwrites a pre-existing `rolled-back-runtime`

`rollbackInstall` checks that `backupDir/rolled-back-skills` is absent at
`product/lib/product.mjs:213`, but it does not check
`backupDir/rolled-back-runtime` before the unconditional rename at lines
215-216. On Windows, that rename replaces an existing file.

Reproduction using the existing one-skill temporary fixture pattern in
`tests/universal-product.test.mjs:9-25`:

1. Build and install a valid fixture with all three destinations on the same
   volume.
2. After installation, write `backup/rolled-back-runtime` with the sentinel
   `USER-SENTINEL`.
3. Call `rollbackInstall(receiptPath)`.

Observed result:

```json
{
  "rollbackSucceeded": true,
  "conflictWasFileBefore": true,
  "conflictIsDirectoryAfter": true,
  "sentinelReadable": false,
  "runtimeMoved": true
}
```

The rollback reports success while replacing user data at its recovery
destination. This contradicts the product promise that rollback leaves
material files recoverable (`product/README.md:62-63`). Rollback must fail
closed before moving any skill when its runtime displacement destination is
already present.

### UR-002 — P1 — Cross-volume rename failure can leave a partial installation

The commit path uses `rename` from the backup staging volume into the skill and
runtime destinations at `product/lib/product.mjs:186-192`. The interface
requires three absolute paths but does not require them to share a volume
(`product/README.md:41-47`). Node raises `EXDEV` for a cross-volume rename.

Reproduction A: put the pack, `skillsDir`, and `backupDir` on `C:`, leave a new
`runtimeDir` on `D:`, and install a valid one-skill fixture. Staging succeeds;
the skill rename on `C:` commits, then the staged runtime rename from `C:` to
`D:` fails.

Observed result:

```json
{
  "installed": false,
  "error": "... EXDEV: cross-device link not permitted ...",
  "skillCommitted": true,
  "runtimeCommitted": false,
  "receiptStatus": "interrupted"
}
```

Reproduction B: put `backupDir` on `D:` and `skillsDir` on `C:`; the first
staged-skill rename fails with `EXDEV`, so a valid set of explicit absolute
paths is rejected. The interrupted journal is not accepted by automatic
rollback (`product/lib/product.mjs:199-202`), leaving manual recovery as the
only path after the partial case. The installer must either reject different
volumes before staging/commit or use a cross-volume commit strategy that cannot
leave skills and runtime at different release states.

### UR-003 — P1 — `verifyProduct` accepts an incomplete catalog and invalid skill metadata

`verifyProduct` checks release bytes and only a small entrypoint projection of
the catalog at `product/lib/product.mjs:100-111`. It does not require
`catalog.skills` to be an array, enforce unique/complete catalog coverage, or
revalidate each skill's `skill.json`, resources, maturity, and relationship
graph. The installer then trusts that projection at lines 162 and 176.

Reproduction A:

1. Build a valid one-skill fixture.
2. Replace `catalog.skills` with `[]`, set `release.skillCount` to `0`, and
   recompute the catalog file digest and `releaseId` (the README correctly
   states that the hash is consistency, not publisher authenticity).
3. Run `verifyProduct`, then `installProduct`.

Observed result:

```json
{
  "verified": true,
  "reportedSkillCount": 0,
  "installedSkillDirectory": false,
  "packSkillDirectory": true
}
```

The pack contains a real skill, but verification and installation succeed as a
zero-skill no-op. Reproduction B is to replace the fixture's `skill.json` with
an invalid ID/category/task type/maturity/relationship set, update only that
file's release digest and the release identity, and run `verifyProduct`; it
returns `{ "ok": true, "skillCount": 1 }`. This also means the new existing-
runtime preflight can accept a self-consistent but semantically invalid pack.
The verifier needs a canonical catalog/skill-schema and one-to-one coverage
check before a pack can be treated as installable.

### UR-004 — P2 — The release inventory drops a legal root file named `__proto__`

`inventory` stores file digests in a normal object at
`product/lib/product.mjs:37-40`. `safeRel` permits `__proto__` at line 15, but
assigning the root-level key `result['__proto__']` changes the object prototype
instead of creating an own property. Consequently the generated release at
lines 94-96 does not bind that file.

Reproduction:

1. Build a valid fixture after writing `pack/__proto__` with `approved`.
2. Change that file to `tampered` after the build.
3. Run `verifyProduct` and then `installProduct`.

Observed result: verification and installation retain the original release ID,
and `runtime/__proto__` contains `tampered`. The parent source-release fence
does not catch this replacement because the file was omitted from the release
map. The inventory must use a null-prototype map (or reject this path) so every
enumerated file is represented and hashed.

### UR-005 — P2 — `antiTriggers` are returned but never applied to discovery

The plan names `antiTriggers` as part of the portable metadata and requires
negative-task discovery tests (`docs/universal-product-v1-plan.md:8,
24`). The current search document fields at `product/lib/product.mjs:135`
include triggers, ID, summary, category, and task types, but not anti-triggers;
line 145 merely copies `item.antiTriggers` into the result.

Reproduction with a synthetic catalog containing one item with
`triggers: ["production deployment"]` and
`antiTriggers: ["production deployment without approval"]`:

```json
{
  "query": "production deployment without approval",
  "returnedIds": ["deploy-check"],
  "returnedAntiTriggers": [["production deployment without approval"]],
  "reasons": [["Matched: deploy, deployment, production"]]
}
```

The discovery boundary therefore returns a skill for the exact situation its
metadata marks as inapplicable. `authority: none` and `activation: none` limit
the effect, but the result is still a false positive at the selection boundary.
Negative-task matching needs an explicit exclusion or penalty contract and an
executable negative case.

### UR-006 — P2 — Portable path validation accepts Windows device-name skill IDs

`idPattern` at `product/lib/product.mjs:6` accepts `con`, `prn`, `aux`, `nul`,
`com1`-`com9`, and `lpt1`-`lpt9`; `safeRel` at line 15 also lacks Windows
device-name and trailing-name normalization rules. A synthetic skill directory
`product/skills/con/` with valid `SKILL.md` and `skill.json` is accepted by
both `buildProduct` and `verifyProduct` on this Windows host.

That is not a portable ordinary Windows path for non-verbatim consumers: the
component is a device name, not a normal directory name. Node's own current
verbatim-path behavior does not make the accepted pack portable to every agent
loader or file tool. The release validator needs a platform-independent
filename policy, or it must explicitly reject these reserved components.

### UR-007 — P1 — `buildProduct` follows pre-existing hardlinks while writing manifests

`buildProduct` checks only the product root and ancestors with `noLinks` at
`product/lib/product.mjs:43-44`; `filesAt` treats regular files as safe at
lines 25-30. It then writes `catalog.json`, `INDEX.md`, and `release.json`
in place at lines 86, 93, and 96. A hardlink is a regular file, so the output
write can modify an unrelated file outside the product.

Reproduction:

1. Build a valid temporary one-skill fixture.
2. Create an outside file containing `USER-SENTINEL`.
3. Hardlink that file to `pack/catalog.json`.
4. Run `buildProduct(pack)`.

Observed result: the build succeeds and the outside file now contains the
generated catalog JSON instead of `USER-SENTINEL`. This is direct data loss in
the manifest-generation path, independent of the installer symlink checks.
Manifest output paths must be created atomically after rejecting unsafe existing
objects, or the builder must detect/reject hardlinked destinations.

## Bounded verification record

The explicit positive-name subset of `tests/universal-product.test.mjs` ran
with Node 24: 11 tests passed, including the parent runtime-preflight and
staged-skill-release tests. The real-product test was excluded because product
skill metadata is known to be in progress; no upstream source pack was read or
executed, no global installation was attempted, and all additional probes used
temporary synthetic fixtures. This is a bounded review with findings, not a
clean review or certification of the product.

## Resolution status — 2026-09-21

The seven initial findings remain intact above as historical review findings.
Against the newest `product/lib/product.mjs` and
`tests/universal-product.test.mjs`, each is now **verified fixed**. The exact
seven-finding regression subset passed 7/7; the cross-volume case was run with
`GODSKILLS_TEST_SECOND_VOLUME=D:\`, so the C:/D: scenario was exercised rather
than skipped. No broader audit was performed.

| Finding | Disposition | Current evidence |
|---|---|---|
| UR-001 | verified (fixed) | Rollback now preflights both `rolled-back-skills` and `rolled-back-runtime` at `product/lib/product.mjs:235-239`; the occupied-runtime test at `tests/universal-product.test.mjs:152-160` confirms the sentinel and skills remain untouched. |
| UR-002 | verified (fixed) | `volume()` walks to the nearest existing ancestor and installation requires one destination device before staging at `product/lib/product.mjs:172-184`; the C:/D: regression at `tests/universal-product.test.mjs:198-204` passed and confirmed no skill move. |
| UR-003 | verified (fixed) | `inspectCatalog()` validates skill metadata and `verifyProduct()` requires exact canonical catalog coverage at `product/lib/product.mjs:43-86` and `111-123`; the self-consistent-hash regression at `tests/universal-product.test.mjs:168-176` rejects both cases. |
| UR-004 | verified (fixed) | `inventory()` now uses `Object.create(null)` at `product/lib/product.mjs:37-40`; the root `__proto__` integrity regression at `tests/universal-product.test.mjs:177-180` rejects the changed bytes. |
| UR-005 | verified (fixed) | Search normalizes query and anti-trigger phrases and suppresses exact declared phrase matches at `product/lib/product.mjs:145-159`; the negative discovery regression at `tests/universal-product.test.mjs:181-185` passes while the non-negative query remains discoverable. |
| UR-006 | verified (fixed) | `safeRel()` rejects reserved components and platform-unsafe names at `product/lib/product.mjs:15`; the reserved-path regression at `tests/universal-product.test.mjs:186-189` rejects `CON.txt`. |
| UR-007 | verified (fixed) | `buildProduct()` preflights existing manifest outputs for symlink and link-count hazards before any write at `product/lib/product.mjs:89-107`; the hardlink regression at `tests/universal-product.test.mjs:190-196` preserves the outside sentinel. |

This short recheck found no unresolved instance of UR-001 through UR-007. It
does not expand the review into publication, installation, content quality, or
certification.
