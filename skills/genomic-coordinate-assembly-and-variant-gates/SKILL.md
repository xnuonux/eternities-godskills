---
name: genomic-coordinate-assembly-and-variant-gates
description: "Use when genomic coordinates or variants must be reconciled to an explicit reference assembly and representation. Do not use for clinical interpretation or mixed-build analysis."
---

# Genomic coordinate assembly and variant gates

Prevent coordinate and allele drift by binding every transformation and comparison to declared assemblies, contigs, orientation, normalization, and provenance.

## use when

- Reconcile genomic coordinates and variants across declared assemblies.
- Gate a variant workflow on reference build normalization and provenance.

## do not use when

- Combine coordinates whose reference build is unknown.
- Provide clinical or personalized genomic conclusions.

## inputs

- variant and coordinate records with provenance
- reference assembly contig and orientation metadata
- normalization and liftover criteria

## preconditions

- every record has or can earn an explicit reference build
- reference assets and coordinate conventions are exact

## workflow

1. validate assembly contig coordinate system and allele orientation
2. normalize equivalent variant representations
3. perform bounded assembly transformation with chain provenance
4. reject ambiguous failed or nonunique mappings

## outputs

- assembly-bound normalized variant set
- mapping rejection and provenance ledger

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, dataset-bound-read
allowed effects: read, write
forbidden effects: clinical-interpretation, external-write, mixed-assembly-merge

## failure behavior

- stop on unknown reference build or coordinate convention
- quarantine nonunique or reference-inconsistent mappings

## exclusions

- does not infer clinical significance
- does not silently coerce assemblies or allele orientation

## termination

Stop when every retained record has one validated assembly coordinate representation and every rejected mapping has a reason.
