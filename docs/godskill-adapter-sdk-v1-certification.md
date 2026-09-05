# provider-neutral adapter sdk v1 certification

## disposition

status: verified local declarative build

this certificate records the provider-neutral adapter sdk milestone built from
Godskills `main` at `c0c8b69196d7006450f88b079f3bbc0b92ca1ac6`. the work was
developed in the isolated branch
`feat/provider-neutral-adapter-sdk-v1` and does not alter the default package
export surface or the certified Godagents root contract.

## certified coordinates

- sdk id: `eternities-godskill-adapter-sdk-v1`
- protocol: `eternities-godskill-protocol-v1`, version `1`
- receipt: `receipts/godskill-adapter-sdk-v1.json`
- receipt digest: `778d8e082a45ad0a2f825cc969030a19a21c2bdc85a8c276761dbb4609a77acb`
- matrix digest: `72a6c0805c06a7ed13a806190a2dd3c5cf54667596237bd2c82300f6c3869af3`
- normalized decision digest: `6a2797c36b4b3b0d5edb9023b6dcf6add3070e7c98d1af11f7c233eaea2b648b`
- matrix status: `equivalent`
- adapter entries: `5`
- host families: `claude-code`, `codex`, `godagents`, `local-model`, `mcp`

## bound bytes

- implementation `src/godskill-adapter-sdk.mjs`: 26,466 bytes,
  sha-256 `274acb5c3f6ae4cf9ae5008cfd39a38ab08c3e531b03792acbebce17df77b7b2`
- conformance dependency `src/godskill-adapter-conformance.mjs`: 19,216 bytes,
  sha-256 `5065f267132e28a28679da1d144132631b2be0d6429c8e4ddc5a85f85bce5954`
- schema `schemas/godskill-adapter-sdk-v1.schema.json`: 7,986 bytes,
  sha-256 `76ba0a5a35a0842ddc8382c2505fe555a619793ec069385e35553b08f546ce5b`
- runtime `runtime/godskill-adapter-sdk-v1.md`: 3,646 bytes,
  sha-256 `bb41caf1b04b529d51520d27f2ad6ff1c06463d49199b89549bd4fb9f3e7bc81`
- fixture `artifacts/godskill-adapter-sdk-v1/reference.json`: 17,438 bytes,
  sha-256 `d5469e0ed530eb5667cc79eef9d10b7de0648ce7c590157ee98e34d4c1533fae`
  and matrix digest `72a6c0805c06a7ed13a806190a2dd3c5cf54667596237bd2c82300f6c3869af3`
- builder `scripts/build-godskill-adapter-sdk-v1.mjs`: 7,642 bytes,
  sha-256 `2e737039a3562a48b3e92d4aa2d70930d8137f733982f2f2fc7c21b780bba44e`
- focused tests `tests/godskill-adapter-sdk.test.mjs`: 12,137 bytes,
  sha-256 `99f9edac423be2f290cac753cae54ef8482bfa8bc608121801b7e3f88817cd82`
- receipt file `receipts/godskill-adapter-sdk-v1.json`: 2,737 bytes,
  sha-256 `ef67ef652838d661541e2bd7b28c54a2b44405d14c52219f86916b0314574386`

the matrix remains bound to the certified protocol receipt digest
`7675fcb3e49c450c50968dcdafd3e98f4788058bd4cf3599bbf73e9e00166da8` and the
certified package digest
`8510b02237963364d4246bd55676ff8674ad83d4d56f68381d6c3bc252e812dd`.

## acceptance matrix

| condition | result |
| --- | --- |
| descriptor construction is deterministic and deeply immutable | pass |
| adapter capability ceilings contain the host profile | pass |
| mission projection preserves objective and effect identity | pass |
| unsupported package, protocol, and secret preconditions are explicit | pass |
| equivalent five-family matrix produces one semantic decision | pass |
| mixed and wholly unsupported matrices refuse a shared decision | pass |
| duplicate, noncanonical, unknown, raw, executable, and forged input fails closed | pass |
| focused SDK suite | 9 passed, 0 failed |
| full repository suite | 837 tests, 836 passed, 0 failed, 1 documented environment skip |
| deterministic builder run one | pass |
| deterministic builder run two | pass, identical matrix and receipt digests |

the full suite was rerun after restoring the isolated worktree's declared npm
dependency. the first attempt failed only because the worktree had no
`node_modules/acorn/dist/acorn.mjs`; no source test failure was reported. the
dependency was installed without lifecycle scripts, and the clean rerun passed
with exit code zero.

## boundaries and proof limits

the sdk is inert data processing. it does not call a provider, select a model,
load a skill body, execute package source, change routing, grant authority,
transport secrets, enable a host, invoke a tool, schedule work, or perform an
external write. the descriptor's supported effects are a translation ceiling,
and the conformance core still intersects mission effects with the actual host
profile.

this evidence proves local deterministic descriptor, projection, and matrix
behavior only. it does not prove live Codex, Claude Code, Godagents, MCP, or
local-model adoption; model or provider equivalence; tool isolation; network
behavior; exactly-once execution; host security; or production readiness.

the receipt is append-only evidence. changed fixture, schema, runtime,
implementation, protocol, or package bytes must produce a new receipt and a
new explicitly coordinated release bind.
