// src/mutationCache.ts
import { notifyManager } from "./notifyManager.js";
import { Mutation } from "./mutation.js";
import { matchMutation, noop } from "./utils.js";
import { Subscribable } from "./subscribable.js";
var MutationCache = class extends Subscribable {
  constructor(config = {}) {
    super();
    this.config = config;
    this.#mutations = [];
    this.#mutationId = 0;
  }
  #mutations;
  #mutationId;
  #resuming;
  build(client, options, state) {
    const mutation = new Mutation({
      mutationCache: this,
      mutationId: ++this.#mutationId,
      options: client.defaultMutationOptions(options),
      state
    });
    this.add(mutation);
    return mutation;
  }
  add(mutation) {
    this.#mutations.push(mutation);
    this.notify({ type: "added", mutation });
  }
  remove(mutation) {
    this.#mutations = this.#mutations.filter((x) => x !== mutation);
    this.notify({ type: "removed", mutation });
  }
  clear() {
    notifyManager.batch(() => {
      this.#mutations.forEach((mutation) => {
        this.remove(mutation);
      });
    });
  }
  getAll() {
    return this.#mutations;
  }
  find(filters) {
    const defaultedFilters = { exact: true, ...filters };
    return this.#mutations.find(
      (mutation) => matchMutation(defaultedFilters, mutation)
    );
  }
  findAll(filters = {}) {
    return this.#mutations.filter(
      (mutation) => matchMutation(filters, mutation)
    );
  }
  notify(event) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    });
  }
  resumePausedMutations() {
    this.#resuming = (this.#resuming ?? Promise.resolve()).then(() => {
      const pausedMutations = this.#mutations.filter((x) => x.state.isPaused);
      return notifyManager.batch(
        () => pausedMutations.reduce(
          (promise, mutation) => promise.then(() => mutation.continue().catch(noop)),
          Promise.resolve()
        )
      );
    }).then(() => {
      this.#resuming = void 0;
    });
    return this.#resuming;
  }
};
export {
  MutationCache
};
//# sourceMappingURL=mutationCache.js.map