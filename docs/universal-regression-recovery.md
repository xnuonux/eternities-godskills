# Historical regression recovery

The pre-existing Athena and attested-continuity failures were caused by comparing
current warehouse working files with historical acquisition digests. Both
warehouse repositories were clean but newer than the pinned source commit.

Read-only investigation recovered the exact original bytes from each recorded
Git commit, using the CRLF checkout encoding originally measured:

- Athena source: `48a3b32aa9273343dacae7532546a2fee375b148bb467305905b0ca169c1d3b0`, 9,338 bytes.
- Planning-with-files source: `d57fd5bd607a15b3669b7d53b54b201994eb7dbe68f80ffc33ea0d7e53122f84`, 32,607 bytes.

`readPinnedSourceBytes` first accepts current bytes only when their hash matches.
Otherwise it reads the exact local Git object and accepts raw or original CRLF
encoding only if it reproduces the recorded digest. It performs no fetch, reset,
checkout, source execution, or ledger rewrite. A new real-Git regression proves
that newer working bytes are left untouched and an unrecoverable digest fails.
The historical receipts rebuild unchanged; this is preservation, not promotion
of a new source revision.

The old Codex policy test grepped one workstation's global instruction prose.
That was a host-specific condition, not a portable skill-quality test. Its text
is preserved at `docs/legacy-codex-routing-policy.test.mjs.txt`. The replacement
executes the new discovery boundary and verifies that a match yields a locator
without granting authority or activating a method. Host instruction integration
is tested separately at installation; no global policy is silently rewritten by
the package or by the test suite.

The isolated development worktree also needed the already-installed Acorn
package used by legacy tests. It was copied locally without network access or
install hooks. The portable product uses only Node built-ins and has no Acorn
dependency.
