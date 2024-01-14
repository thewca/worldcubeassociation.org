// src/infiniteQueryObserver.ts
import { QueryObserver } from "./queryObserver.js";
import {
  hasNextPage,
  hasPreviousPage,
  infiniteQueryBehavior
} from "./infiniteQueryBehavior.js";
var InfiniteQueryObserver = class extends QueryObserver {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(client, options) {
    super(client, options);
  }
  bindMethods() {
    super.bindMethods();
    this.fetchNextPage = this.fetchNextPage.bind(this);
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
  }
  setOptions(options, notifyOptions) {
    super.setOptions(
      {
        ...options,
        behavior: infiniteQueryBehavior()
      },
      notifyOptions
    );
  }
  getOptimisticResult(options) {
    options.behavior = infiniteQueryBehavior();
    return super.getOptimisticResult(options);
  }
  fetchNextPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "forward" }
      }
    });
  }
  fetchPreviousPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "backward" }
      }
    });
  }
  createResult(query, options) {
    const { state } = query;
    const result = super.createResult(query, options);
    const { isFetching, isRefetching } = result;
    const isFetchingNextPage = isFetching && state.fetchMeta?.fetchMore?.direction === "forward";
    const isFetchingPreviousPage = isFetching && state.fetchMeta?.fetchMore?.direction === "backward";
    return {
      ...result,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data),
      hasPreviousPage: hasPreviousPage(options, state.data),
      isFetchingNextPage,
      isFetchingPreviousPage,
      isRefetching: isRefetching && !isFetchingNextPage && !isFetchingPreviousPage
    };
  }
};
export {
  InfiniteQueryObserver
};
//# sourceMappingURL=infiniteQueryObserver.js.map