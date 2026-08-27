---
name: eternities-hermes
description: Govern agent-neutral automation and MCP integration work across six bounded routes with explicit evidence, authority, and effect controls. Do not use for credentials, untrusted execution, external writes, remote mutation, unauthorized network access, unsafe MCP tools, or unresolved effects.
---

# eternities hermes

Hermes turns an authorized automation objective into one inspectable local plan, result, refusal, or handoff. Read first, preserve lineage, separate proposed from performed effects, and stop when a boundary is unresolved.

## routes

- **batch-file-workflow**: inspect or draft a bounded Windows `.bat`/`.cmd` workflow, including variables, loops, control flow, and error handling. Do not execute it unless execution authority and target scope are explicit.
- **browser-automation**: plan a context-aware Playwright or agent-browser interaction using discovered element references, with a close-out step. This is the generic interaction route, not the browser-use CDP integration.
- **browser-use-integration**: coordinate direct browser-use CDP control, local or remote browser lifecycle, screenshots, recordings, or site/app inspection. Stop before leaving remote browsers running.
- **java-mcp-server-generation**: design a Java MCP server project boundary and generated-file manifest around the official SDK, reactive streams, and optional Spring Boot. Generation is a local write, not execution or publication.
- **omni-cli-tool-integration**: inspect or prepare an OmniRoute CLI-tool API integration, separating read endpoints, configuration, invocation, authentication, and mutation. Bearer tokens and session cookies are credentials.
- **remote-test-coordination**: prepare a remote-executor integration-test matrix using named fixtures, skips, environment prerequisites, and evidence capture. It does not provision, mutate, or claim remote state.

## operating contract

1. Require an explicit objective, target scope, expected result, authority, and acceptance evidence; preserve source ids and review digests.
2. Classify every step as read, local write, execution, network, remote mutation, or external write before proposing it.
3. Fail closed on missing credentials authority, untrusted commands or code, unsafe MCP tools, unauthorized network access, remote mutation, external writes, or effects that cannot be resolved.
4. Treat examples, defaults, fixtures, provider names, and endpoint shapes as evidence of possibility, never as verified live facts.
5. For browser routes, distinguish element-reference interaction from CDP/browser-lifecycle integration; do not silently merge them.
6. Return one route-owned artifact with status, evidence, assumptions, unknowns, proposed effects, performed local effects, and a human-owned next decision.
7. Do not invoke Hermes recursively. Delegate provider administration, security review, credential handling, code execution, and remote mutation to an authorized specialist.

## termination

Produce a local artifact, refusal, or typed handoff. No network call, credential use, command execution, MCP invocation, browser session, remote test, publication, or external write is performed by this skill by default.
