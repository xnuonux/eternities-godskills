# Recovery and first continuation checkpoint

The original index 27 attempt failed with a settled `distribution-sum` result. Its explicitly owner-authorized diagnostic retry returned five proposals and three abstentions, all eight distributions summing to 1. Further instrumentation captured real malformed totals of 0.99, not just binary floating-point drift. No distributions were renormalized and no acceptance threshold was relaxed.

The first recovery runner dispatched indices 28 through 180, preserving all original IDs/snapshots and giving each settled malformed distribution at most one traceable retry. Of 153 dispatched original requests, 150 ended with valid responses and three remained quarantined after two malformed results. The worker made 172 provider calls including retries. Index 181 was refused locally by the then-current context-call cap, with zero inference; its refusal is preserved and excluded from classification.

The integrated view, including index 27 and its successful retry, now contains 170 continuation original receipts plus 20 retry receipts. Together with preexisting evidence, the 8,841 bodies are 833 provisionally classified, 557 abstained, 48 unavailable, 27 explicit unknown, one excluded and 7,375 not yet dispatched. This is 1,249 previously undispatched bodies processed, not 1,249 new skills or verified capabilities. Classification remains incomplete.

Dom subsequently removed local Jev spending and call-count quotas explicitly. Refreshed services report all three quota values null. The uncapped worker resumes at index 181 into `unlimited-receipts`; its live `unlimited-status.json` and eventual receipts are NOT part of the numerical checkpoint above. The ongoing run must not be reported complete from this checkpoint.

Verification at this checkpoint: 1,064 full repository tests, 1,062 passes, zero failures, two existing conditional skips. Eight Python recovery tests pass. Independent MiMo review and parent closure are preserved separately; fixes after that review are parent-verified, not a second independent approval. The helper's independently scoped quota implementation passes 27 tests including real offline MCP roundtrips; a fresh real status call reports unlimited quotas with no inference and no pending uncertainty.

No product method installation changed. The 63-method installed release and protected activation files remain untouched. Every source label is advisory; no quality certification or execution authority follows from it.
