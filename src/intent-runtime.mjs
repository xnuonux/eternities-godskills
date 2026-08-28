import { compileIntent } from "./intent-compiler.mjs";
import { buildRoutingIndex, shortlistRoutingCards } from "./routing-index.mjs";
import { routeCapabilities } from "./router.mjs";

export function compileAndRoute({ request, cards }) {
  const compilerReceipt = compileIntent({ request, cards });
  const index = buildRoutingIndex(cards);
  const shortlist = shortlistRoutingCards(index, compilerReceipt.envelope, { limit: 32 });
  const routeReceipt = routeCapabilities({
    envelope: compilerReceipt.envelope,
    cards: shortlist,
  });
  return { compilerReceipt, routeReceipt };
}
