# portable `.godskill` package v1 implementation plan

## goal

Add a deterministic, inert, provider-neutral `.godskill` directory package for the certified `eternities-aegis` capability layer. The package must be independently verifiable before any host may route or disclose it, and verification must not execute package source, expand authority, or perform external mutation. This milestone is a canary package protocol, not global activation and not a replacement for the existing layer compiler or activation protocol.

## constraints and acceptance gates

- build only one directory-form package for `eternities-aegis` version 4 at `artifacts/godskill-packages/eternities-aegis-v1`.
- copy only existing first-party layer, source, policy, and promotion-evidence bytes into the package.
- use canonical JSON and SHA-256 digests for every declared file and for the package body.
- reject unsafe paths, path substitution, truncation, extras, missing files, duplicate identities, noncanonical JSON, stale evidence, protocol mismatch, unsupported effects, authority expansion, executable activation, and external mutation declarations.
- package installation and verification are inert. No package file may be imported as executable code by the verifier.
- preserve existing capability-layer and activation artifacts byte-for-byte.
- add focused tests before production implementation and keep the package builder deterministic.
- do not change global routing, host adapters, model selection, or historical receipts in this milestone.

## files and interfaces

1. `schemas/godskill-package-v1.schema.json`
   - define the closed manifest, content-entry, provenance, compatibility, verification, and attestation shapes.
   - require one package identity, one protocol id, one digest-pinned policy, exact content paths, and explicit inertness flags.

2. `policies/godskill-package-v1.json`
   - define the first-party trust-root policy for the canary package.
   - bind the protocol id, schema version, allowed package kind, allowed effects, and required verification flags.

3. `runtime/godskill-package-v1.md`
   - document the provider-neutral package and verification boundary as data contracts.
   - state that a host must intersect authority after verification and that package content cannot grant authority.

4. `src/godskill-package.mjs`
   - export `GODSKILL_PACKAGE_PROTOCOL`, `GODSKILL_PACKAGE_MANIFEST`, `canonicalPackageBody`, `buildGodskillPackageManifest`, `verifyGodskillPackageDirectory`, and `readGodskillPackageManifest`.
   - implement strict relative-path validation and Windows containment checks locally rather than relying on an unexported helper.
   - verify canonical manifest bytes, package-body digest, policy trust root, attestation subject, every declared content hash and byte count, exact recursive file inventory, known provenance, capability-layer identity, and inertness.
   - return a frozen verification result containing only data such as package identity, package digest, policy digest, content count, and evidence level.

5. `tests/godskill-package.test.mjs`
   - start with a failing import/contract test before implementation.
   - cover deterministic manifest construction and verification of the Aegis canary package.
   - cover unsafe paths, containment escapes, duplicate paths and roles, extras, missing files, byte substitution, truncation, stale package/policy digests, noncanonical JSON, protocol mismatch, unsupported effects, authority grants, executable activation, external mutation, and attestation drift.
   - assert verification does not import or execute any package source.

6. `scripts/build-godskill-package-v1.mjs`
   - construct the package from the canonical source paths, copy exact bytes, write deterministic JSON, and emit the package receipt.
   - refuse to overwrite a package whose existing manifest does not match the requested canonical source set.

7. `receipts/godskill-package-v1.json`
   - bind the package path, package digest, file digest, policy digest, source layer bundle digest, promotion-evidence hash, focused test count, and full-suite status.

8. `docs/godskill-package-v1-certification.md`
   - record the source coordinates, exact package and policy digests, verification matrix, and reproducibility results.

9. `package.json`
   - add `build:godskill-package` without disturbing existing scripts.

10. `README.md`
    - add a short status section explaining discovery versus verification and the inert package boundary, without claiming global activation.

## implementation sequence

1. Confirm the isolated worktree is clean and record the base commit.
2. Add this plan and self-review it against the approved evolution arc.
3. Add the first focused test and run it red because the package module does not yet exist.
4. Add the schema, policy, and minimal package module needed for deterministic path and digest primitives; run the focused tests red/green in small increments.
5. Implement the manifest builder and exact package verifier, including inventory and provenance checks; extend mutation tests and run the focused suite.
6. Add the deterministic builder and package fixture, then build the canary package and receipt.
7. Add runtime contract, certification document, package script, and README status; verify all generated coordinates from fresh bytes.
8. Run focused tests, package rebuild reproducibility, the relevant existing layer/activation gates, and then a fresh full repository suite.
9. Review the diff inline for authority widening, source execution, path handling, receipt circularity, and accidental edits to protected historical artifacts.
10. If every gate is green, fast-forward the verified branch into Godskills `main`, push it, and rerun canonical verification. Then notify the active Godagents task that its current-head certificate must be refreshed against the new Godskills head before its next integration.

## completion evidence

Completion requires a clean candidate diff, a deterministic package rebuild with identical package and receipt digests, all focused package tests passing, all existing relevant gates passing, a fresh full-suite pass, and a pushed canonical main whose certification names the exact coordinates. A package is not considered activated merely because it is built or verified.
