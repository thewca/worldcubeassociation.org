// src/hydration.ts
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
    mutationCache.build(
      client,
      {
        ...options?.defaultOptions?.mutations,
        mutationKey: dehydratedMutation.mutationKey,
        meta: dehydratedMutation.meta
      },
      dehydratedMutation.state
    );
  });
  queries.forEach(({ queryKey, state, queryHash, meta }) => {
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
        ...options?.defaultOptions?.queries,
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
export {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  hydrate
};
//# sourceMappingURL=hydration.js.map