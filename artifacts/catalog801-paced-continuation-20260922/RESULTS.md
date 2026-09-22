# Spacing correction and bounded continuation result

The live helper code rejects `paced` when current time is before its `next_start`, and returns before inserting a ledger reservation or contacting the provider. Admission sets `next_start` to start time plus two seconds. This corrects the earlier uncertainty: that observed paced result was a local two-second spacing gate, not a Jev-server rate-limit response.

Five properly spaced requests succeeded for 40 selected public metadata inputs: 25 provisional domains and 15 abstentions. The sixth request reached the provider and returned `unavailable: distribution-sum`; the helper rejected an invalid probability distribution. Dispatch stopped immediately with no retry or model/key substitution. The remaining 26 planned requests were not sent. Original successful, failed and locally paced receipts were not replayed or overwritten.

Strict repository normalization verified all six returned records against exact request/snapshot bindings. Successful calls account for 803 micro-USD. The invalid sixth retains a conservative 20,000 micro-USD reservation, for 20,803 micro-USD accounted in this continuation. This is ledger accounting, not a provider invoice or permission to spend more. A classification abstention is not a successful domain assignment. Eight unavailable inputs remain explicitly unresolved.

No installed methods, protected activation bytes, source bodies or original frozen queue were changed. The source intake and product release remain separate. New labels are preserved in validated-labels.json and are not yet merged into the legacy domain-query queue.

The alternate direct TypeSafe route exists in Jev-Researcher, but its expected credential variables are absent from this task process and Windows user environment. The coordinating task `Eternities autonomous research` was asked for secure client/loader locations and constraints only, without credentials or inference on our behalf. No alternate endpoint was authenticated or used in this continuation. A shared local spacing limit is not a reason to rotate API keys.
