# provider-neutral adapter discovery v1 certification

## disposition

status: verified local declarative build

this certificate records the exact-match discovery milestone built from pushed
Godskills `main` at
`de63a7f76aca2fad9942960363978c98dc1ac89f`. it is an opt-in resolver over the
certified adapter sdk matrix, not a live host integration or automatic routing
change.

## certified coordinates

- discovery id: `eternities-godskill-adapter-discovery-v1`
- receipt: `receipts/godskill-adapter-discovery-v1.json`
- receipt digest: `319c7779bdb098c8d4ff823cf894e07e444efa214fe821ad0b93d32a46ace099`
- result digest: `1e15633c29fb8b667d6eedaa03be40cc28c445e8eef742b7ad48eee2ff76ae9a`
- result status: `selected`
- matrix status: `equivalent`
- selected adapter: `codex-fixture-adapter`
- host profile digest: `1f2f1f46df347cec1e26e8123b36199e67d6924010bb51ffe419bddbc2c0da8c`
- descriptor digest: `38ec04844a09aef09c27fedc8408a5c822405fcb3d8e7c089335a41dbfbf0cbd`
- entry digest: `cdca1f00eb14c1a6baf4c49df036a7102be001b2570a3f5dce52b6fb5a833b82`
- projection digest: `f78834e3443ee4658c61d656b0fec96b198c0dbc68712716769bc7f9da37873b`
- normalized decision digest: `6a2797c36b4b3b0d5edb9023b6dcf6add3070e7c98d1af11f7c233eaea2b648b`

the result is bound to the adapter sdk receipt
`778d8e082a45ad0a2f825cc969030a19a21c2bdc85a8c276761dbb4609a77acb` and its
matrix digest
`72a6c0805c06a7ed13a806190a2dd3c5cf54667596237bd2c82300f6c3869af3`.

## bound bytes

| path | bytes | sha-256 |
| --- | ---: | --- |
| `src/godskill-adapter-discovery.mjs` | 12,107 | `ab52aec81d11b766389e33a0aaaa6d4a349a05255e8cef570e4242995cd0a310` |
| `src/godskill-adapter-sdk.mjs` | 26,466 | `274acb5c3f6ae4cf9ae5008cfd39a38ab08c3e531b03792acbebce17df77b7b2` |
| `scripts/build-godskill-adapter-discovery-v1.mjs` | 5,261 | `7fa40e1f01f1b9826e91b4e1f48c94bef6837256541892edd28a59361bad3251` |
| `tests/godskill-adapter-discovery.test.mjs` | 7,211 | `cb72cd79eae00c01c486de9966ad438a7081f89de029e6b8079e56c099476387` |
| `schemas/godskill-adapter-discovery-v1.schema.json` | 2,411 | `54bed60469b0af96beaad3734bd60929474bbcf9e4f6ccce263c8ecdcea7ac42` |
| `runtime/godskill-adapter-discovery-v1.md` | 2,701 | `e5bcb9509e6b669b7cca9439f6cf7891de96ace9e9b3a089e998f3ad32100627` |
| `artifacts/godskill-adapter-discovery-v1/reference.json` | 903 | `369056cf5c2b12e4103ec06cd485558a0ab630c15b1c97b314861a2203cb624d` |
| `receipts/godskill-adapter-discovery-v1.json` | 2,718 | `4dff09971b2471b88488a3ccc3a2239425e74d571c222f47479856714c6662ca` |

## acceptance matrix

| condition | result |
| --- | --- |
| exact certified host-profile selection | pass |
| host-family-only selection is refused | pass by exact-profile contract |
| host profile drift is unsupported | pass |
| exact unsupported matrix entry carries no adapter identity | pass |
| matrix, profile, adapter, entry, projection, and result digests bind | pass |
| raw-content, executable-value, tampered, and unknown input rejection | pass |
| focused discovery suite | 6 passed, 0 failed |
| full repository suite | 843 tests, 842 passed, 0 failed, 1 documented environment skip |
| deterministic builder run one | pass |
| deterministic builder run two | pass, identical result and receipt digests |
| syntax, JSON, and diff checks | pass |

the first full-suite attempt found the same isolated-worktree dependency gap
seen in the preceding sdk milestone, with `node_modules/acorn/dist/acorn.mjs`
absent. after restoring the declared dependency without lifecycle scripts, the
fresh full suite passed with exit code zero.

## boundaries and proof limits

discovery is a read-only identity result. it does not grant effects, select a
model, activate a skill, change routing, invoke a host or provider, load package
source, execute code, schedule work, transport secrets, or perform an external
write. changed host metadata must receive a newly certified descriptor and
matrix.

this certificate proves exact local declarative discovery over the Codex
fixture entry. it does not prove live Codex, Claude Code, Godagents, MCP, or
local-model adoption; model or provider quality; routing correctness; tool or
host security; network behavior; exactly-once execution; or production
readiness.

the receipt is append-only evidence. any changed implementation, sdk root,
matrix, schema, runtime, or fixture requires a new receipt and coordinated
cross-repository rebind.
