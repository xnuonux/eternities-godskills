# Simulation-artifact handoff: a portable text contract

Use this written method to plan a handoff. It contains no runtime packager, validator, snapshot adapter, or access-control implementation.

## Purpose and claim boundary

Use this procedure to prepare and receive a declared set of simulation files with portable run context, access limits, measurement units, and byte-identity evidence. Atlas owns this generic inventory, reconciliation, provenance, and handoff method. Physics-constrained numerical validation owns scientific and numerical validity. Experiment-artifact-lineage applies only when one of these files later becomes an ML training, feature-cache, or checkpoint dependency.

This procedure does not execute or validate a simulation. It does not certify FAIR conformance, legal rights, provenance truth, scientific or numerical validity, complete discovery of every output, or the ability to rerun a computation. Recording software and environment identities improves traceability; it does not establish rerun equivalence.

This is a portable text contract. It requires no repository checkout, machine-specific path, Node/Python runtime, or particular tracking service. A local implementation must supply the platform-specific snapshot, path, evidence-authentication, and access-control guarantees described below. If the target platform cannot provide a required guarantee, stop at HOLD; do not replace it with a weaker pathname or metadata check.

## 1. Bind the run context and expected contents

Before inventory, record:

- a stable run ID and explicit parent run ID, using null only for a true root run;
- producer identity and completion evidence, including a stable record ID and content digest or a verifiable platform reference;
- engine name and exact build identity;
- simulation code identity: immutable repository commit or source-tree digest, plus whether the tree was clean; if modified, bind the complete patch/tree digest;
- effective run configuration and dependency identities, including hashes of declared input decks, scripts, plugins, and configuration files that materially affect the run;
- observed execution environment: operating system and architecture, container/image digest or equivalent environment identity, runtime and relevant library versions, and accelerator/driver identity where they can affect behavior; and
- the complete expected file set and required roles from the producer's run/output record, not from whatever a directory listing happens to find.

Use immutable revision IDs and digests rather than branch names, tags that can move, local working-directory paths, or an unqualified label such as latest. Distinguish the actual observed environment from a lockfile or environment specification. If a required identity cannot be recovered, record status unknown and the reason; never invent a value. A packet with unknown run context is not a complete handoff. It may remain a local provisional inventory, but it cannot be described as a reproducible or rerunnable run.

References to records outside the package must be portable identifiers, not workstation paths. Bind each important external record to a content digest when available. The receiver must be able to resolve and assess evidence required for the requested handoff; an opaque or inaccessible reference is unresolved evidence.

## 2. Declare access and transfer limits

Record access policy separately from snapshot integrity. For the files and their metadata, include:

- sensitivity/classification;
- authorized recipient identities or roles;
- permitted purpose;
- retention period or deletion condition and its owner;
- onward-transfer rule;
- storage and transfer constraints; and
- the policy/authorization evidence reference and its content digest, where available.

These are declared handling constraints, not a legal opinion or proof of rights. A writer lock does not grant read access or transfer permission. If the recipient, purpose, retention, or transfer rule is unknown or cannot be authorized, do not transfer the package; return HOLD. Do not treat public visibility, a source-code license, or a hash as permission to redistribute simulation data.

Do not place secrets, credentials, or sensitive raw examples in the manifest. Apply the recorded access policy to the manifest and receipts too, since file names, identities, and hashes can themselves be sensitive.

## 3. Select and evidence a stable byte source

The producer must be complete and stopped before selecting bytes. Bind the completion record to the run ID and resolve it through a trusted scheduler, execution service, or accountable operator record. A producer field that merely says complete is an assertion, not independent completion evidence.

Choose and record exactly one protected source:

| Source kind | Required evidence |
| --- | --- |
| Immutable snapshot | Stable snapshot/object identity from the storage platform, plus evidence that the selected object cannot be changed during inventory, sealing, or transfer. Bind all reads to this same snapshot identity. |
| Writer-locked controlled copy | Evidence that the producer completed and the source remained stable during copying; identify the resulting copy; then exclude writers from that copy from the end of copying through both hash passes, manifest/receipt sealing, and handoff. |

A read-only bit, file size, stable name, two stat calls, two equal digests, or a producer-supplied Boolean does not establish either source kind. Two hash passes are byte observations. They are not a snapshot, a writer lock, or proof that no write occurred between or after the observations. If actual stability and writer exclusion cannot be demonstrated, return HOLD and issue no sealed handoff.

The package and manifest must remain protected against unauthorized mutation through transfer. Bind the final manifest digest to an authenticated signature or an independently trusted, access-controlled handoff channel. A bare digest stored beside a mutable manifest is not authentication.

## 4. Define files and measurements portably

For each expected file, declare one role, a portable relative path, media/type identity when useful, expected measurement fields, and any schema/data-dictionary identity. Store paths as NFC-normalized forward-slash paths below the selected snapshot root. Reject absolute, drive-qualified, UNC, backslash, empty, dot, parent-traversal, nonportable, and case-colliding paths. Reject symlinks and reparse points at the root and every path component.

The implementation must open files relative to an already-authorized stable root using the platform's race-resistant no-follow mechanism. It must not check a pathname and later reopen that pathname as a separate operation. The receiver repeats path-policy and byte checks against the authenticated manifest before opening content. If descriptor/root-relative no-follow access or a platform-equivalent guarantee is unavailable, return HOLD.

Units attach to measurements, not to the file as a whole. For every measured field, record a unique field path, physical quantity, and explicit unit. Include coordinate frame or reference basis when interpretation depends on it. If a file contains no physical measurement, use an empty measurement list plus an explicit reason. A linked schema may supplement the mapping, but bind it by immutable identity and digest; do not rely on an unversioned external schema.

Illustrative file entry for a multi-field trajectory:

    {
      "path": "outputs/trajectory.nc",
      "role": "trajectory",
      "mediaType": "application/x-netcdf",
      "schema": {
        "id": "schema:trajectory-v3",
        "sha256": "<64 lowercase hex characters>"
      },
      "measurements": [
        {"field": "time", "quantity": "time", "unit": "ps"},
        {"field": "coordinates", "quantity": "position", "unit": "angstrom", "frame": "cartesian"},
        {"field": "velocities", "quantity": "velocity", "unit": "angstrom/ps"},
        {"field": "forces", "quantity": "force", "unit": "eV/angstrom"},
        {"field": "energy", "quantity": "energy", "unit": "eV"}
      ],
      "bytes": 123456,
      "sha256": "<64 lowercase hex characters>"
    }

The values above are examples only. Each field must match the actual file schema. Do not infer units from a solver name, extension, or common convention. For a control-only file, use measurements: [] and a nonblank unitApplicability reason such as control-text; do not assign a fabricated physical unit.

Every declared path must exist and be readable. Required roles must be present. Preserve missing, unreadable, malformed, undeclared, or changed items as explicit hold reasons; do not substitute zero-byte placeholders or silently add discovered files. A manifest describes the producer-declared set and does not prove the declaration omitted nothing.

## Portable manifest field contract

Use a versioned manifest whose stable IDs and evidence references can be resolved away from the producing workstation. The example below shows the required field families and per-measurement unit mapping. Placeholder values are not evidence and must never be copied as if they were observations.

    {
      "schema": "atlas.simulation-handoff.manifest.v2",
      "state": "complete",
      "run": {
        "id": "run-001",
        "parentRunId": null,
        "producerCompletion": {
          "recordId": "scheduler-run:run-001",
          "recordSha256": "<64 lowercase hex characters>"
        }
      },
      "code": {
        "revision": {"kind": "immutable-source-revision", "value": "<VCS commit or source-tree digest>"},
        "workingTree": "clean",
        "patchSha256": null
      },
      "engine": {
        "name": "engine-name",
        "version": "exact-release",
        "buildId": "immutable-build-id",
        "binarySha256": "<64 lowercase hex characters>"
      },
      "effectiveConfiguration": {
        "sha256": "<64 lowercase hex characters>",
        "encodingOrSchema": "canonical-config-v1"
      },
      "environment": {
        "observed": true,
        "operatingSystem": "name-and-version",
        "architecture": "architecture-id",
        "imageOrEnvironmentDigest": "sha256:<64 lowercase hex characters>",
        "runtimeAndLibraries": [
          {"name": "runtime-or-library", "version": "exact-version"}
        ],
        "accelerators": [
          {"name": "device-or-none", "driverVersion": "exact-version-or-not-applicable"}
        ]
      },
      "access": {
        "classification": "restricted",
        "authorizedRecipients": ["role:authorized-reviewer"],
        "permittedPurpose": "simulation-result-review",
        "retention": "delete-after:YYYY-MM-DD",
        "retentionOwner": "role:accountable-custodian",
        "onwardTransfer": "prohibited",
        "storageAndTransferConstraints": ["approved-channel-reference"],
        "policyEvidence": {
          "recordId": "access-policy:study-001",
          "recordSha256": "<64 lowercase hex characters>"
        }
      },
      "source": {
        "kind": "immutable-snapshot",
        "identity": "storage-snapshot:opaque-id",
        "protectionEvidence": {
          "recordId": "storage-protection-record:opaque-id",
          "recordSha256": "<64 lowercase hex characters>"
        }
      },
      "requiredRoles": ["input", "trajectory"],
      "files": [
        {
          "path": "outputs/trajectory.nc",
          "role": "trajectory",
          "schema": {
            "id": "schema:trajectory-v3",
            "sha256": "<64 lowercase hex characters>"
          },
          "measurements": [
            {"field": "time", "quantity": "time", "unit": "ps"},
            {"field": "coordinates", "quantity": "position", "unit": "angstrom", "frame": "cartesian"},
            {"field": "velocities", "quantity": "velocity", "unit": "angstrom/ps"},
            {"field": "forces", "quantity": "force", "unit": "eV/angstrom"},
            {"field": "energy", "quantity": "energy", "unit": "eV"}
          ],
          "bytes": 123456,
          "sha256": "<64 lowercase hex characters>",
          "observations": [
            {"pass": 1, "bytes": 123456, "sha256": "<same digest>"},
            {"pass": 2, "bytes": 123456, "sha256": "<same digest>"}
          ]
        }
      ],
      "methodVersion": "atlas-simulation-handoff-v2"
    }

Keep the seal receipt separate from the manifest body so the receipt can bind the manifest digest without a self-referential hash. Authenticate the receipt with a signature or independently trusted, access-controlled handoff channel:

    {
      "manifestSha256": "<SHA-256 of the exact manifest bytes>",
      "authentication": {
        "method": "signature-or-trusted-channel",
        "evidenceRecordId": "authenticated-handoff:opaque-id",
        "evidenceSha256": "<64 lowercase hex characters>"
      }
    }

For a writer-locked controlled copy, set source.kind to writer-locked-controlled-copy and bind separate evidence for stable source copying and destination writer exclusion. Do not add a Boolean that merely asserts writersExcluded; resolve the protection evidence through the responsible platform or accountable control owner. The manifest may record an explicit unknown context value only in a provisional inventory. Such a packet is not state complete and cannot be transferred as a sealed handoff.

The example does not prescribe a particular VCS, container runtime, scheduler, unit vocabulary, storage service, signature system, or transport. It prescribes the identities and evidence that a platform adapter or operator must bind. If an environment component is irrelevant, state why; if it is relevant but unknown, keep the packet provisional rather than silently omitting it.

## 5. Observe, compare, seal, and receive

1. Bind every read to the selected snapshot/copy identity and the authorized relative path.
2. In the first raw-byte pass, record byte count and SHA-256 for every declared file.
3. Immediately before sealing, read every file again from the same protected root. Compare byte count and digest with the first observation. Any difference is HOLD; select and evidence a new stable source before retrying.
4. Seal only after the completion, stable-source, path, access, file-set, context, measurement-unit, and authentication requirements are satisfied. Record both observations per file, all evidence references/digests, the manifest digest, method version, and explicit holds.
5. Keep the selected package protected throughout transfer. The receiver authenticates the manifest/seal, resolves required access and freeze evidence, rechecks path policy and raw-byte identities, and records which files were verified and any unresolved holds before use.

Two equal digests establish only that the bytes read in those two observations matched. They do not establish that an immutable snapshot existed, that the same underlying file object was read if paths could change, that the producer really stopped, that the expected file set is complete, that the manifest is authentic, or that a receiver is authorized.

## 6. Required disposition

- **SEALED HANDOFF:** all required identities, access permission, expected files, per-measurement units, stable-source evidence, race-resistant path handling, equal raw-byte observations, authenticated manifest, and receiver checks are satisfied.
- **PROVISIONAL INVENTORY:** observations or metadata exist, but one or more handoff requirements remain unresolved. Keep it local or otherwise within existing authorization; mark every unresolved field and do not describe it as sealed.
- **HOLD:** actual producer completion, snapshot/copy stability, path confinement, access authorization, content identity, or manifest authentication cannot be established. Do not transfer or represent the package as complete.

No result of this procedure certifies FAIR conformance, legal/publication rights, scientific or numerical validity, provenance truth, absence of undeclared outputs, or rerun equivalence. Those require separate evidence and owners.

## Executable boundary

This skill does not bundle a validator or packager. A local implementation needs platform-specific writer exclusion, race-resistant path access, authenticated evidence, access enforcement, and receiver checks. Passing fixture tests or matching hashes cannot substitute for those guarantees.
