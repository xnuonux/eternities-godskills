# Use several skills without loading the library

These are examples of composition, not mandatory stages. Select a method only
when it resolves a current uncertainty. A task that needs one specialist should
not pay for an entire orchestration stack.

## From idea to a working product

User: "Build a booking tool for my repair shop. Customers should pick available
times, staff should avoid double bookings, and I need to know whether it helps."

1. **Prometheus**: identify the customer job, the smallest useful workflow, the
   business assumption, and an acceptance test. Do not invent market evidence.
2. **Architect**: settle the few consequential decisions: who owns availability,
   how concurrent bookings are serialized, which data is retained, and how a
   failed payment or notification recovers. Skip a grand architecture document.
3. **Daedalus** plus **Muse** as needed: build a thin end-to-end slice; implement
   booking behavior, useful errors, keyboard access, mobile states, and a clear
   visual identity. Test the double-booking race, not only the happy screenshot.
4. **Herald** when release is requested: check reproducibility, migration,
   observability, rollback, and the actual environment. Carry out deployment only
   within the user's authorized account and scope.
5. Return the functioning artifact, verification results, outstanding risks, and
   the agreed measure of usefulness. A published page is not proof of demand.

Forge can coordinate a long version of this task; it is unnecessary for a short
implementation. Each handoff carries only the decision, relevant files, and
acceptance conditions, not the full preceding conversation.

## From an incident to a verified repair

User: "Payments timed out, then some customers were charged twice. Fix it."

**Phoenix** reconstructs the commit/timeout timeline and tests a specific
hypothesis. **API rate-limit recovery** handles only the retry boundary: uncertain
commit status, stable idempotency keys, cancellation, deadlines and concurrency.
**Invariant guard** helps construct a small independent oracle for "at most one
charge per intent." Aegis joins if the trace reveals leaked credentials or an
authority boundary; it is not loaded simply because payments are mentioned.

The output is a repair with regressions and an explicit account of external
actions. Test transactions, real refunds, and customer messages have different
effects; permission for code repair does not imply all three.

## From research to a clear public explanation

User: "Compare these studies and write a readable article about what they show."

**Oracle** finds and cites the primary material. **Athena** evaluates confounding,
uncertainty, effect sizes and disagreements. **Logos** turns the supported result
into a compelling narrative without converting inference into fact. The article
keeps limitations close to consequential claims. A specialist statistical skill
is loaded only if the task requires reanalysis, not merely because numbers occur.

## From a visual idea to a playable scene

User: "Make a mysterious floating garden that I can orbit and explore."

**Muse** develops one visual direction with readable composition, depth, motion
and budget. **Arcadia** handles camera behavior, interaction, spatial performance
and playability. The agent first builds something viewable, then tests orbit,
near/far clipping, resize, reduced motion and a slower device tier. Visual review
can reject a technically correct result that lacks the intended experience.

No recipe guarantees that skill use beats a raw model. Preserve spontaneous
solutions and use the methods to solve observed gaps, not to replace creativity
with process.
