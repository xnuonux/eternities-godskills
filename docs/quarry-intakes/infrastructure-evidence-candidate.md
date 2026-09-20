# Infrastructure evidence candidate

Status: experimental, cold, not installed or routed. Owner candidate: Daedalus;
release evidence handoff: Herald. This does not modify either active skill.

## Neutral contract

Outcome: expose missing evidence when reviewing an infrastructure test packet.
Success: distinguish complete declared packets from missing negative tests,
unbound evidence, unresolved effects, or incomplete cleanup. Inputs are JSON
records for one exact subject digest, a tool version, effects and test results.
Output is a completeness disposition with stable issue codes. Effects: none.
The helper performs no file reads, subprocesses, network calls or infrastructure
actions. It authenticates neither the caller nor the supplied evidence.

Use for reviewing an existing test report, including paraphrases such as
"what is missing before this infrastructure test can be considered documented?"
Do not use as an apply authorization, deployment executor, Terraform parser,
credential checker, or proof that a provider was mocked correctly. Conflicting
or unknown effect declarations stay incomplete. A plan is not assumed to be
offline merely because it is called a plan.

## First-party workflow

1. Identify exact subject bytes, environment and tool/provider versions.
2. Independently inspect commands, modules and provider configuration. Split
   isolated mocked checks from resource-creating or external-reading checks.
3. Collect a positive case and an expected-invalid-input case. Preserve actual
   outcomes and evidence digests; an expected failure is not an unexpected
   infrastructure failure. This helper consumes results, not Terraform syntax.
4. For completed effectful tests, retain the prior scope-bound authority record,
   cost owner and cleanup evidence. Verify these against the real authority
   system separately. Missing cleanup remains an open obligation.
5. Call `assessInfrastructureEvidence` from `src/infrastructure-evidence.mjs`.
   Inspect its issues. Even `evidence-complete` is only completeness of supplied
   declarations, never attestation, promotion or permission to run anything.
6. Keep environmental/provider testing and evidence authentication separate.

## Provenance

Pattern reference: `hashicorp/agent-skills`, commit
`c2d65dfe492f74d360d35b859b88932222470bd8`,
`plugins/terraform/skills/terraform-test/SKILL.md`, blob
`2feebcc9f3c5b9e61a05119087f4fc328b9edf9f`, SHA-256
`bba613c50727af9a8e47e690b0e16a4093f0239afec495016e016b5152c9a598`.
Root license evidence: MPL-2.0; no legal-clearance claim. Only the general
separation of test effects and cleanup obligations influenced this independently
written candidate. No upstream prose, implementation, scripts or version-specific
Terraform syntax is incorporated. Linked upstream references remain unreviewed.

## Evaluation boundary

`node --test tests/infrastructure-evidence.test.mjs` exercises actual first-party
packet validation, including missing proof and conflicting effects. A fail-closed
stub was tested first (five failed cases); implementation then made all eight
cases pass. These tests do not run Terraform, prove a real cleanup, or evaluate
agent skill use. No superiority or promotion claim is made. Promotion still
requires baseline/candidate agent evaluations, independent review, token-budget
and policy gates. Broader infrastructure language support is not implied.
