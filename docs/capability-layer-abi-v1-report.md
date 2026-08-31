# capability layer ABI v1 cost report

status: `experimental-canary`

build receipt: `1c19271951abb00e93529656a35e8fb52dccc2f3cf0b6208bcee6821361ab788`

values are `bytes / estimated tokens`.

| capability | native | guardrail | method | review before artifact | review after artifact |
|---|---:|---:|---:|---:|---:|
| eternities-aegis | 0 / 0 | 1603 / 401 | 17345 / 4337 | 0 / 0 | 1533 / 384 |
| eternities-forge | 0 / 0 | 1093 / 274 | 15082 / 3771 | 0 / 0 | 1080 / 270 |
| eternities-muse | 0 / 0 | 1552 / 388 | 18550 / 4638 | 0 / 0 | 1434 / 359 |

token counts use `Math.ceil(bytes / 4)` and are not tokenizer output.
smaller context is not evidence of higher model quality. these bundles
remain local, additive, and experimental. no default activation, external
authority, Godagents runtime, or Lunari integration changes are made.
