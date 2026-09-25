# Eternities Godskills

A portable library of practical methods for AI agents: engineering, research,
design, science, games, writing, operations, marketing, audio, and more.

## Start here

1. Read [the directory](INDEX.md) or search the compact `catalog.json` metadata.
2. Pick the smallest useful skill from the user's task, not from a slash command.
3. Read its `skills/<id>/SKILL.md`. Open only the references needed for that task.
4. Apply the method within the user's request and the host's permissions. Related
   skills are suggestions, not mandatory dependency chains.

Markdown is the product's baseline interface. It requires no API, vector database,
network connection, installation script, special computer layout, or AI provider.
Copy this entire folder anywhere, including a blank workspace. A coding agent can
read it immediately. The skills are equally usable outside Codex and Godagents.

Without Node, give the agent this folder and ask it to use `INDEX.md`. To expose
skills through a host's native loader, copy the desired directories from `skills/`
to that host's documented skill location, retaining their references. Preserve
any existing versions first. The automated installer below is an optional safer
way to make and verify those backups.

## Optional offline tools

With Node.js 24 or newer, no dependency installation is needed:

```text
node bin/godskills.mjs validate
node bin/godskills.mjs search "test audio DSP discontinuities" --limit 3
node bin/godskills.mjs search "release readiness" --task verify
```

Search combines weighted terms, a small explicit synonym vocabulary, and stable
ties. It searches specialists as well as broad capabilities, returns matched
terms and related IDs, and never executes anything. It is deterministic lexical
retrieval, not a claim of semantic understanding or vector-search superiority.
The agent still judges applicability against the actual task. A low-quality
match is not an instruction to force a skill into the work.

An exact normalized phrase from a skill's declared anti-triggers suppresses that
match. This is a limited negative-match rule, not general semantic negation or an
authorization decision; the host still checks applicability and permission.
Negated discovery words may still shortlist a broad skill such as Atlas, even
when a supplied file makes connected-source discovery unnecessary. Read its
entrypoint before choosing a subroute: a catalog hit is not permission to
discover, load, or use connected data. Keep the skill's local-analysis route
available when the user's supplied file actually needs analysis.

No result means use ordinary agent competence, refine the query, or browse a
category. Do not invent an installed capability or load the entire library.

## Install into an agent's skill directory

Supply three separate absolute paths on the same filesystem volume. The source
pack may be on another volume. Replace the example placeholders with the
host's actual directories. The runtime directory holds a standalone copy of the
pack; the skill directory exposes entrypoints to the agent's normal loader.

```text
node bin/godskills.mjs install --skills-dir <absolute-skills-directory> --runtime-dir <absolute-pack-directory> --backup-dir <new-absolute-backup-directory>
```

The installer verifies bytes before changing anything. It replaces only IDs
present in this pack, preserves unrelated directories, and moves previous
versions into the named backup. It writes a durable installation journal and
verifies the installed files. It does not edit global agent instructions, enable
tasks, install dependencies, call providers, or alter model settings. An existing
backup directory is refused. Do not run concurrent installers against one target.
An existing runtime directory must already be an intact Godskills pack; the
installer will not replace an unrelated folder or a modified runtime snapshot.

To undo a completed installation:

```text
node bin/godskills.mjs rollback --receipt <absolute-backup-directory>/install-receipt.json
```

Rollback refuses if installed skills or backups changed after installation. No
material files are deleted: replaced and rolled-back versions remain recoverable.
An interrupted journal requires inspection; it is not silently treated as a
completed transaction. Skill catalogs cached by an agent may require a new task
or application reload. File installation alone does not prove UI discovery.

## What the evidence means

- **Instruction-reviewed:** methods have been rewritten and reviewed for the
  documented scope. This is the default maturity of this release.
- **Package-tested:** executable tests check catalog behavior, portable paths,
  byte identity, installation and rollback. These test software, not expertise.
- **Agent exercise:** an actual agent uses a fixed skill snapshot on a recorded
  task. Results apply to that task and configuration only.
- **Performance-qualified:** requires independent matched comparisons with
  predeclared quality and resource criteria. This release does not claim that
  status for every skill, or claim to outperform a raw model universally.

Historical routing fixtures, self-declared expected results, corpus size, and
popularity do not demonstrate better agent performance. The thousands of source
skills are research inputs, not thousands of silently activated instructions.
See [corpus scope](CORPUS-SCOPE.md) for the distinction between acquired, grouped,
reviewed, distilled, and unresolved material.

## Host integration contract

The catalog uses machine-independent IDs and ordered `skills/<id>/SKILL.md`
entrypoints with SHA-256 hashes. `release.json` binds the shipped file set;
identity excludes checkout paths and timestamps. A hash proves consistency with
the manifest, not publisher authenticity. Distribute through a trusted channel or
pin a separately obtained release ID when authenticity matters.

Discovery, eligibility, selection, and activation are separate operations. This
library returns metadata only: `authority: none`, `activation: none`. A host may
apply its own risk and resource policies, but must not infer permission from a
match score. Legacy Godagents protocols and frozen receipts are not silently
replaced by this versioned catalog.

`skill.json` retains provenance relationships. Independent rewriting does not
automatically remove upstream obligations. Do not redistribute upstream source
packs as if they were first-party work. Retain applicable notices for any actual
third-party material you add.

Provenance strings identify authoring history; they are not files the receiving
agent must locate or read. Only the selected entrypoint and its declared bundled
resources are needed to use a method. A new computer does not need the source
repositories, private development history, or a matching author workstation.
