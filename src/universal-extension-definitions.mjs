const DETAILS = {
  "research-proposal-planning-and-review": ["Build a criterion-bound research proposal packet without claiming submission readiness or funding success.", ["research", "proposal", "grant", "budget", "aims"], ["active solicitation", "supported research evidence"], ["proposal packet", "gap and revision ledger"], ["eternities-athena", "eternities-oracle"]],
  "bounded-typed-graphql-contract-and-execution": ["Implement a bounded typed GraphQL contract with resolver, authorization, error, and query-cost proof.", ["graphql", "typed", "resolver", "contract", "query"], ["schema and resolver scope", "authorization and cost rules"], ["typed GraphQL implementation", "contract and execution tests"], ["eternities-aegis", "eternities-architect"]],
  "configuration-schema-environment-and-migration-validation": ["Validate configuration shape, environment precedence, compatibility, and migration before runtime use.", ["configuration", "schema", "environment", "migration", "validation"], ["configuration sources", "compatibility and rollback rules"], ["validated configuration contract", "migration and failure evidence"], ["eternities-aegis", "eternities-architect"]],
  "consent-gated-decision-linked-telemetry": ["Design telemetry whose collection is consent-gated and traceable to an explicit decision question.", ["consent", "telemetry", "decision", "privacy", "measurement"], ["decision question", "consent and retention policy"], ["telemetry plan", "consent and decision linkage ledger"], ["eternities-aegis", "eternities-prometheus"]],
  "cross-boundary-semantic-contract-propagation-audit": ["Audit one semantic contract across schemas, APIs, storage, interfaces, tests, and migration boundaries.", ["semantic", "contract", "propagation", "boundary", "audit"], ["canonical contract", "consumer and producer inventory"], ["propagation map", "drift and remediation ledger"], ["eternities-aegis", "eternities-daedalus"]],
  "evidence-bound-data-modeling-schema-change-and-inspection": ["Reconcile data modeling and schema change against observed workloads, invariants, compatibility, and inspection evidence.", ["data", "model", "schema", "inspection", "compatibility"], ["schema and workload evidence", "invariants and migration constraints"], ["data model decision", "schema change and inspection proof"], ["eternities-aegis", "eternities-architect"]],
  "evidence-first-data-path-performance-reduction": ["Reduce a measured data-path bottleneck through causal traces, bounded changes, and repeated comparison.", ["data", "path", "performance", "trace", "latency"], ["repeatable baseline", "functional and resource budgets"], ["bounded optimization", "before-after trace evidence"], ["eternities-atlas", "eternities-aegis"]],
  "reasoned-persistent-code-dependency-graph": ["Construct a source-labeled persistent dependency graph that preserves reasons, uncertainty, and freshness.", ["dependency", "graph", "code", "reason", "persistent"], ["authorized repository scope", "dependency extraction rules"], ["reasoned dependency graph", "freshness and uncertainty ledger"], ["eternities-daedalus", "eternities-aegis"]],
  "immersive-comfort-and-spatial-interaction": ["Design spatial interaction with locomotion, reach, readability, comfort, and human-playtest gates.", ["immersive", "comfort", "spatial", "interaction", "locomotion"], ["target hardware and interaction model", "comfort and accessibility criteria"], ["spatial interaction design", "comfort and playtest evidence"], ["eternities-muse", "eternities-aegis"]],
  "realtime-3d-performance-and-spatial-systems": ["Engineer real-time 3D spatial systems under frame, memory, visibility, and determinism budgets.", ["realtime", "3d", "spatial", "frame", "performance"], ["runtime scene and hardware budget", "profiling and correctness fixtures"], ["bounded spatial system", "frame and memory evidence"], ["eternities-daedalus", "eternities-muse"]],
  "red-green-refactor-behavior-proof": ["Apply a strict red-green-refactor loop whose failing test names the behavior and whose final evidence guards regression.", ["red", "green", "refactor", "test", "behavior"], ["settled behavior contract", "practical automated test surface"], ["tested behavior change", "red and green evidence"], ["eternities-aegis", "eternities-forge"]],
  "evidence-led-product-discovery-and-prioritization": ["Prioritize product work from source-labeled user evidence, uncertainty, value, effort, and reversible tests.", ["product", "discovery", "prioritization", "evidence", "roadmap"], ["user and product evidence", "constraints and decision horizon"], ["priority ledger", "discovery tests and decision rationale"], ["eternities-oracle", "eternities-atlas"]],
  "precommitted-product-experimentation-gate": ["Precommit a product experiment's hypothesis, population, metrics, guardrails, stopping rule, and decision before observation.", ["experiment", "precommit", "metric", "guardrail", "hypothesis"], ["falsifiable hypothesis", "population metric and risk policy"], ["experiment contract", "analysis and decision template"], ["eternities-prometheus", "eternities-aegis"]],
  "subscription-retention-and-payment-recovery": ["Design consent-preserving retention and payment-recovery interventions without account mutation or manipulative claims.", ["subscription", "retention", "payment", "recovery", "churn"], ["aggregate lifecycle evidence", "policy and consent boundaries"], ["retention and recovery plan", "measurement and authorization gates"], ["eternities-aegis", "eternities-prometheus"]],
  "incremental-dependency-and-framework-upgrades": ["Upgrade dependencies or frameworks in reversible increments with compatibility, deprecation, and regression proof.", ["dependency", "framework", "upgrade", "incremental", "compatibility"], ["current dependency graph", "release notes and compatibility evidence"], ["incremental upgrade changes", "regression and rollback evidence"], ["eternities-aegis", "eternities-herald"]],
  "monorepo-release-graph-cache-correctness": ["Verify monorepo release ordering and cache keys against the actual dependency and artifact graph.", ["monorepo", "release", "graph", "cache", "artifact"], ["workspace dependency graph", "build and release contracts"], ["release graph and cache policy", "ordering and invalidation proof"], ["eternities-daedalus", "eternities-aegis"]],
  "node-package-release-reproducibility": ["Prove a Node package tarball's contents, metadata, dependency surface, build, and install behavior before publication.", ["node", "package", "release", "tarball", "reproducible"], ["package source and manifest", "clean build and install fixture"], ["reproducible package artifact", "content and install evidence"], ["eternities-daedalus", "eternities-aegis"]],
  "offline-pwa-release-readiness": ["Verify a progressive web application under offline, update, cache, install, and recovery scenarios before release.", ["offline", "pwa", "cache", "service", "worker"], ["application routes and asset policy", "offline and update acceptance matrix"], ["PWA readiness changes", "offline update and recovery evidence"], ["eternities-aegis", "eternities-herald"]],
  "share-preview-metadata-validation": ["Validate share-preview metadata and assets across declared parsers without publishing or scraping accounts.", ["share", "preview", "metadata", "opengraph", "card"], ["canonical page metadata", "declared parser and asset requirements"], ["validated preview metadata", "parser and image evidence"], ["eternities-muse", "eternities-aegis"]],
  "audit-remediation-root-cause-and-regression-review": ["Convert an audit finding into root cause, bounded remediation, regression proof, and residual-risk decision.", ["audit", "remediation", "root", "cause", "regression"], ["exact finding and evidence", "authority and acceptance criteria"], ["remediation decision", "regression and residual-risk receipt"], ["eternities-daedalus", "eternities-oracle"]],
  "behavioral-test-maintainability-review": ["Review tests for behavioral value, isolation, mutation sensitivity, and maintenance cost rather than line coverage theater.", ["test", "maintainability", "behavior", "mutation", "review"], ["test suite and behavior contract", "failure and maintenance evidence"], ["test quality findings", "bounded remediation plan"], ["eternities-aegis", "eternities-forge"]],
  "question-driven-telemetry-self-verification": ["Instrument only the evidence needed for a declared question and verify telemetry semantics before using the result.", ["telemetry", "question", "verification", "instrumentation", "evidence"], ["decision question", "event semantics and privacy boundary"], ["bounded instrumentation", "semantic and self-verification evidence"], ["eternities-atlas", "eternities-aegis"]],
  "rendered-spatial-measurement-and-adjudication": ["Measure rendered geometry and adjudicate visual acceptance against exact spatial evidence rather than source assumptions.", ["rendered", "spatial", "measurement", "geometry", "visual"], ["rendered artifact and viewport matrix", "acceptance measurements"], ["spatial measurement ledger", "visual adjudication receipt"], ["eternities-daedalus", "eternities-aegis"]],
  "accessible-async-interface-state-machine": ["Model accessible asynchronous interface states, focus, announcements, cancellation, retry, and stale-response behavior.", ["accessible", "async", "interface", "state", "focus"], ["interaction and accessibility contract", "async lifecycle and failure cases"], ["interface state machine", "accessibility and race-condition evidence"], ["eternities-daedalus", "eternities-aegis"]],
  "fp-ts-react-state-validation-and-effects": ["Apply typed functional validation and effect boundaries to React state without obscuring lifecycle or accessibility behavior.", ["fp", "react", "state", "validation", "effects"], ["component state and lifecycle contract", "typed validation and effect model"], ["typed React state implementation", "runtime and accessibility evidence"], ["eternities-muse", "eternities-aegis"]],
  "evidence-derived-engineering-documentation": ["Derive engineering documentation from exact code, configuration, commands, and verification evidence with freshness limits.", ["engineering", "documentation", "evidence", "code", "configuration"], ["authorized repository evidence", "audience and freshness requirements"], ["evidence-derived documentation", "source and freshness ledger"], ["eternities-daedalus", "eternities-oracle"]],
};

export function buildUniversalExtensionDefinitions(wave) {
  const targets = wave.targets.filter((target) => target.kind === "godskill-extension");
  if (targets.length !== 26 || Object.keys(DETAILS).length !== 26) throw new Error("exactly 26 extension definitions and targets are required");
  return {
    schemaVersion: 1,
    definitionSetId: "universal-godskill-extensions-v1",
    sourceWaveDigest: wave.waveDigest,
    extensions: targets.map((target) => {
      const [intent, triggerKeywords, requiredEvidence, outputs, terminalEscalationOwnerIds] = DETAILS[target.clusterId] ?? [];
      if (!intent) throw new Error(`missing extension definition: ${target.clusterId}`);
      return {
        schemaVersion: 1,
        id: target.clusterId,
        categoricalOwnerId: target.categoricalOwnerId,
        delegateId: target.implementationOwnerId,
        intent,
        triggerKeywords,
        negativeKeywords: ["unauthorized", "external", "unresolved"],
        requiredEvidence,
        outputs,
        allowedEffects: ["read", "write"],
        requiredEffects: ["read", "write"],
        requiredAuthority: ["local-read", "repository-write"],
        forbiddenEffects: ["credential-use", "external-write", "production-mutation"],
        terminalEscalationOwnerIds,
        terminationCondition: `Stop when ${outputs[0].toLowerCase()} and ${outputs[1].toLowerCase()} satisfy the declared evidence and authority gates.`,
        capabilityDoesNotGrantAuthority: true,
        sourceBinding: {
          targetId: target.targetId,
          clusterDigest: target.clusterDigest,
          overlapDigest: target.overlapDigest,
          reviewDigests: target.reviewDigests,
          comparisonDigests: target.comparisonDigests,
        },
      };
    }).sort((left, right) => left.id.localeCompare(right.id)),
  };
}
