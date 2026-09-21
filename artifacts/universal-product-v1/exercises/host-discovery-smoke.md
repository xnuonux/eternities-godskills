# Fresh worker host-discovery smoke check

Date: 2026-09-21. Worker: Herschel,
`01a0c391-8cce-7ec2-aad2-31b8274db3e5`, explicitly GPT-5.6-Luna max,
with no conversation fork. This checked the installed 54-skill release
`a0025ae28606dc06571585ce4137bf97aa328fb25ac5265d0af0792230811eb4`
before the three wave-2 additions were installed.

The worker was asked first to inspect its host-supplied initial skill catalog,
without scanning the filesystem, for four named examples. It then checked only
their expected files, and reported these separate observations:

| Skill | Exposed in initial catalog | Expected SKILL.md exists |
| --- | --- | --- |
| eternities-agora | yes | yes |
| api-rate-limit-recovery | yes | yes |
| financial-statement-reconciliation | yes | yes |
| robotics-test-ladder | yes | yes |

All four host-provided paths were the expected user-level agents skill directory.
No files, providers, Keel state or model settings were changed. The worker was
closed after reporting.

This is an observed fresh-worker report of native discovery for four entries,
not a UI audit of every running desktop task, an inspection of Codex's loader
implementation, or evidence of improved task performance. Existing tasks may
retain an earlier catalog snapshot. The exact installed bytes and unrelated-file
preservation are verified separately by the installer and local audit.
