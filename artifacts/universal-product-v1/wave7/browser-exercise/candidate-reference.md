# Browser game lifecycle

Use for a browser-hosted game or interactive 3D scene whose rendering, input,
asset loading or teardown must survive real navigation and interruptions. This
is an engine-neutral lifecycle method, not a required scene architecture. Check
the selected engine and browser documentation before choosing version-sensitive
APIs, formats or interaction permissions.

## Bind the visible surface to its state

Keep simulation, presentation, input and asset ownership distinguishable. Give
each rendering surface one responsible scheduling owner; repeated setup must not
silently add loops or listeners. Decide what runs while loading, paused, hidden,
unfocused or unavailable. Preserve the game's authority model: pausing local
presentation must not pretend an authoritative multiplayer world stopped.

Use a declared time-step policy with bounded catch-up. On resume, rebase the
clock instead of applying the whole background interval as one simulation step.
Clear or reconcile held-input state on focus loss so a missed release cannot
leave movement stuck. Check touch, keyboard, pointer and alternative controls
against the same gameplay intent, not against different accidental state paths.

Treat CSS layout size, backing-buffer resolution, device scaling and camera
projection as related but distinct values. Resize from the actual container,
handle zero-sized/hidden surfaces, and apply a deliberate resolution budget.
Map pointer coordinates through the correct canvas rectangle and coordinate
space; test offsets and scaling, not just a full-window canvas at origin.

## Make asynchronous work belong to a scene lifetime

Use a lifetime identity or equivalent ownership check for delayed asset loads,
callbacks and queued work. A result from a departed scene must not attach to the
new scene, start an obsolete loop or overwrite current loading/error state.
Cancellation requests do not remove the need to handle late settlement.

Distinguish exclusively owned resources from borrowed or shared ones. Teardown
invalidates the lifetime before releasing it, stops its scheduled work, removes
its listeners and detaches its objects. Release owned resources once; return or
decrement shared ownership through its manager rather than blindly disposing
every reachable material or texture. A late result still needs its correct
ownership disposition even when it can no longer be displayed.

Make repeated stop/unmount harmless. Surface current loading failures without
silently retrying forever; obsolete failures must not poison the new scene.
Choose a visible fallback for missing assets, unavailable rendering or lost
context, with restoration behavior appropriate to the actual engine.

## Prove the lifecycle, then the experience

Exercise mount/unmount/remount, duplicate start, interrupted load, late success
and rejection, focus loss, long resume, container resize, hidden zero size and
failed assets. Check that loop/listener/resource counts return to the expected
baseline and that reused shared assets remain usable. Compare memory and frame
behavior over repeated cycles, not just one attractive screenshot.

Then inspect the actual rendered scene: nonblank output, camera extremes,
interaction, equivalent cues and target-device cost. Test shipped relative asset
paths at the intended hosting base. A synthetic lifecycle fixture does not prove
GPU cleanup, browser compatibility, visual appeal, accessibility or performance
on a device it never exercised. Report those evidence layers separately.
