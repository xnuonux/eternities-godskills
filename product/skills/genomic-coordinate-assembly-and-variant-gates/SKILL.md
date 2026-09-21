---
name: genomic-coordinate-assembly-and-variant-gates
description: Use when genomic records must be reconciled to declared assemblies, contig conventions, strand orientation, normalized alleles, and traceable transformation evidence.
---

# Genomic coordinate assembly and variant gates

Use this entrypoint to prevent coordinate and allele drift in a genomic data workflow. It supports assembly-bound data engineering and quality gates; it does not interpret clinical significance or merge records whose reference context is unknown.

## Bind the reference context

For every record, capture the reference assembly, contig naming scheme, coordinate base and interval convention, strand or allele orientation, source provenance, and reference sequence revision. Treat “hg19-like,” an inferred contig, or a missing build as an unresolved value, not a harmless default.

Define the canonical representation before comparing records. State how insertions, deletions, multi-allelic calls, symbolic alleles, left alignment, trimming, and normalization are handled. Keep the original record alongside the normalized form and record the rule or reference asset that produced the change.

## Transform with gates

1. Validate contig existence, coordinate bounds, reference allele agreement, and orientation before normalization.
2. Normalize equivalent representations using the declared reference sequence. Detect a representation that is equivalent only under a different build or strand.
3. Perform a bounded liftover or assembly transformation with a named chain or mapping revision. Record source coordinate, destination coordinate, mapping status, and transformation digest.
4. Reject or quarantine nonunique, partial, out-of-bounds, reference-inconsistent, and ambiguous mappings. Never choose one mapping because it is convenient.
5. Reconcile duplicates and conflicts after normalization, not before. Preserve whether two records were identical, equivalent, contradictory, or unassessed.
6. Run independent checks on a sample or all records as the workload allows: round-trip mappings, known reference variants, coordinate boundary cases, and allele-complement cases.

The output should contain a retained assembly-bound set plus rejection and quarantine ledgers. For high-consequence use, keep the reference assets and transformation versions immutable for the run and require domain review of the final dataset.

## Finish and limits

Finish when each retained record has one validated coordinate representation, every transformation has provenance, and every rejection has a reason. State the fraction or records left unassessed and whether the workflow supports only technical normalization or any further interpretation. Technical concordance is not evidence of pathogenicity, diagnosis, or personalized advice.

## Common failure modes

- Inferring a build from chromosome names or a familiar coordinate range.
- Mixing zero-based intervals with one-based variant positions.
- Reverse-complementing alleles without recording strand context.
- Treating a multi-map liftover as a unique answer.
- Dropping original records so a normalization error cannot be audited.
