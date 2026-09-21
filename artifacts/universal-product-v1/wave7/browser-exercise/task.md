# Implement a small scene lifetime controller

Use the supplied Arcadia entrypoint and browser-lifecycle reference to implement
`createSceneController(adapter)` as a named export in candidate.mjs. This is an
engine-neutral controller for a fictional browser scene, not a renderer. No DOM,
GPU, packages, web or provider calls. Write candidate-notes.md with at most150
words explaining scope and remaining real-browser checks. You own only those
two files; do not read check.mjs, protocol.md or other exercises/skills.

The adapter supplies:

- requestFrame(callback): returns a handle; callback receives milliseconds.
- cancelFrame(handle).
- loadAsset(): returns a promise of `{id, ownership}`, where ownership is
  `owned` or `borrowed`. Each load result is a distinct resource lease.
- attachAsset(asset), detachAsset(asset), disposeAsset(asset).
- render(deltaSeconds), onError(error).

All adapter functions except loadAsset are synchronous and nonthrowing for this
exercise. The factory has no effects until start(). The returned controller has
start() and stop(). Start is idempotent while active: one load and one pending
frame at most. Rendering can run while loading. First frame after each start has
delta0; subsequent deltas are seconds clamped to [0,0.1], including long gaps
and a backward timestamp. Request one successor frame after each active callback.

Stop invalidates the current lifetime, cancels its pending frame, detaches an
attached asset and disposes it exactly once only if owned. Stop is idempotent and
restart is supported. A late callback may still be delivered after cancellation:
it must not render or schedule more work. Late assets from an obsolete lifetime
must never attach to the current one; dispose stale owned leases once, but never
dispose borrowed leases. Current load failures reach onError once. Obsolete
failures are handled without showing an error in the new scene or creating an
unhandled rejection. No automatic retry is requested.

An implementation that passes this contract still has no measured GPU, actual
browser, visual, accessibility or device-performance evidence. Keep it small;
do not implement networking, persistence or new rendering abstractions.
