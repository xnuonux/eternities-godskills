---
name: native-mobile-interaction-testing
description: Use when React Native interactions, accessibility queries, asynchronous rendering, or provider-backed component behavior need version-aware tests and real execution evidence.
---

# Native mobile interaction testing

Use this entrypoint to test React Native behavior through the interface a user can exercise, while making the test-library and React version explicit. It covers authorized implementation and test execution. A component test can establish interaction logic and accessibility contracts; it cannot by itself establish device, operating-system, navigation, native-module, performance, or store behavior.

## Identify the test surface

Before editing a test, inspect the installed React version, the React Native Testing Library major version, the test runner, configured fake timers, and the wrapper providers required by the component. Select the matching API reference for that major version. In a React 19 environment, account for Suspense and other asynchronous rendering rather than forcing synchronous assertions. Keep one small test focused on one user-observable contract, and preserve the existing harness conventions when they are sound.

Prefer queries that express the accessible contract: role and accessible name first, then label text, placeholder, visible text, display value, and finally a stable test identifier when no better user-facing handle exists. Give controls accessible roles, labels, and state where the product requires them. Avoid selecting implementation details such as private component instances, internal state, or incidental native view nesting.

## Match async semantics to the installed major

For the v13-style surface, use synchronous `render` for synchronous trees and the documented async rendering path when React 19 or Suspense requires it. Await user-facing async interactions and use `findBy*` or a bounded `waitFor` for state that arrives later. For the v14-style surface, await `render`, `fireEvent`, `rerender`, `unmount`, `renderHook`, and `act` as required by the installed API; do not invent a removed `renderAsync` or `fireEventAsync` helper. Read the local API reference before translating examples between majors because similar names can have different return and scheduling behavior.

Use user-event utilities for realistic press, type, clear, and focus flows when available. Keep `waitFor` callbacks free of side effects and make them assert one stable condition; trigger the action before waiting. Use explicit timeouts for network, animation, polling, or navigation boundaries and expose a deterministic test seam rather than sleeping for an arbitrary duration. When a component depends on a query client, theme, navigation container, or feature flag, create the smallest declared provider wrapper and make its data deterministic.

## Verify more than the happy path

Cover disabled and loading controls, validation errors, empty and partial data, repeated taps, focus or keyboard transitions, cancellation, retry, and unmount while work is pending. Assert visible state and accessibility state, not only callback invocation. If native permissions, sensors, storage, or modules are mocked, name the seam and the behavior it does not cover. Run the relevant tests in the authorized repository, retain command, version, selected case, output, and changed-file evidence, and separate a passing unit/component result from an emulator or physical-device result.

## Common failure modes

- Copying v13 examples into a v14 suite or vice versa.
- Calling `waitFor` with a side effect that can fire repeatedly.
- Using a fixed sleep where a state transition or event can be awaited.
- Reaching for test IDs before adding an accessible user-facing query.
- Treating mocked native modules as proof of device behavior.
- Claiming a fixture result is an executed mobile, OS, or store test.
