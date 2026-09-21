Implemented a small engine-neutral scene lifetime controller around the supplied
adapter. Each start creates one fenced lifetime with one asset lease and one
pending frame; frame deltas are clamped, and stop invalidates late callbacks,
cancels scheduled work, detaches attached assets, and releases only owned leases.
Obsolete asset settlements are safely disposed or ignored by ownership, while
current load failures reach the adapter once.

Remaining checks belong to a real browser/host: requestAnimationFrame behavior
across navigation and backgrounding, actual DOM/canvas/GPU/context-loss cleanup,
visual output, accessibility and input behavior, resize/visibility/focus paths,
device performance, and hosted asset paths. This sample provides synthetic
lifecycle behavior only; it is not evidence for those browser or device layers.
