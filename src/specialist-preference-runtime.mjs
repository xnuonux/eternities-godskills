import { compileIntent } from "./intent-compiler.mjs";
import { compileAndRoute as compileAndRouteHistorical } from "./intent-runtime.mjs";
import {
  buildPreferenceRoutingShortlist,
  buildRoutingIndex,
} from "./specialist-preference-routing-index.mjs";
import { routeCapabilities } from "./specialist-preference-router.mjs";
import {
  extendCompilerReceipt,
  splitPreferenceRequest,
} from "./specialist-preference-contracts.mjs";

export function compileAndRoute({ request, cards }) {
  const { baseRequest, preferredCapabilities } = splitPreferenceRequest(request);
  if (preferredCapabilities === undefined) {
    return compileAndRouteHistorical({ request: baseRequest, cards });
  }
  const baseReceipt = compileIntent({ request: baseRequest, cards });
  const compilerReceipt = extendCompilerReceipt({
    baseReceipt,
    request,
    preferredCapabilities,
  });
  const index = buildRoutingIndex(cards);
  const shortlist = buildPreferenceRoutingShortlist(
    index,
    compilerReceipt.envelope,
    { limit: 32 },
  );
  const routeReceipt = routeCapabilities({
    envelope: compilerReceipt.envelope,
    cards: shortlist.cards,
    semanticCandidateIds: shortlist.semanticCandidateIds,
  });
  return { compilerReceipt, routeReceipt };
}
