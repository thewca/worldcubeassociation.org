"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hydration.ts
var hydration_exports = {};
__export(hydration_exports, {
  defaultShouldDehydrateMutation: () => defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery: () => defaultShouldDehydrateQuery,
  dehydrate: () => dehydrate,
  hydrate: () => hydrate
});
module.exports = __toCommonJS(hydration_exports);
function dehydrateMutation(mutation) {
  return {
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
    ...mutation.meta && { meta: mutation.meta }
  };
}
function dehydrateQuery(query) {
  return {
    state: query.state,
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    ...query.meta && { meta: query.meta }
  };
}
function defaultShouldDehydrateMutation(mutation) {
  return mutation.state.isPaused;
}
function defaultShouldDehydrateQuery(query) {
  return query.state.status === "success";
}
function dehydrate(client, options = {}) {
  const filterMutation = options.shouldDehydrateMutation ?? defaultShouldDehydrateMutation;
  const mutations = client.getMutationCache().getAll().flatMap(
    (mutation) => filterMutation(mutation) ? [dehydrateMutation(mutation)] : []
  );
  const filterQuery = options.shouldDehydrateQuery ?? defaultShouldDehydrateQuery;
  const queries = client.getQueryCache().getAll().flatMap((query) => filterQuery(query) ? [dehydrateQuery(query)] : []);
  return { mutations, queries };
}
function hydrate(client, dehydratedState, options) {
  if (typeof dehydratedState !== "object" || dehydratedState === null) {
    return;
  }
  const mutationCache = client.getMutationCache();
  const queryCache = client.getQueryCache();
  const mutations = dehydratedState.mutations || [];
  const queries = dehydratedState.queries || [];
  mutations.forEach((dehydratedMutation) => {
    var _a;
    mutationCache.build(
      client,
      {
        ...(_a = options == null ? void 0 : options.defaultOptions) == null ? void 0 : _a.mutations,
        mutationKey: dehydratedMutation.mutationKey,
        meta: dehydratedMutation.meta
      },
      dehydratedMutation.state
    );
  });
  queries.forEach(({ queryKey, state, queryHash, meta }) => {
    var _a;
    const query = queryCache.get(queryHash);
    if (query) {
      if (query.state.dataUpdatedAt < state.dataUpdatedAt) {
        const { fetchStatus: _ignored, ...dehydratedQueryState } = state;
        query.setState(dehydratedQueryState);
      }
      return;
    }
    queryCache.build(
      client,
      {
        ...(_a = options == null ? void 0 : options.defaultOptions) == null ? void 0 : _a.queries,
        queryKey,
        queryHash,
        meta
      },
      // Reset fetch status to idle to avoid
      // query being stuck in fetching state upon hydration
      {
        ...state,
        fetchStatus: "idle"
      }
    );
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  hydrate
});
//# sourceMappingURL=hydration.cjs.map