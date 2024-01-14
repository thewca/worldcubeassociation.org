import {
  __privateAdd,
  __privateGet,
  __privateSet,
  __privateWrapper
} from "./chunk-2HYBKCYP.js";

// src/mutationCache.ts
import { notifyManager } from "./notifyManager.js";
import { Mutation } from "./mutation.js";
import { matchMutation, noop } from "./utils.js";
import { Subscribable } from "./subscribable.js";
var _mutations, _mutationId, _resuming;
var MutationCache = class extends Subscribable {
  constructor(config = {}) {
    super();
    this.config = config;
    __privateAdd(this, _mutations, void 0);
    __privateAdd(this, _mutationId, void 0);
    __privateAdd(this, _resuming, void 0);
    __privateSet(this, _mutations, []);
    __privateSet(this, _mutationId, 0);
  }
  build(client, options, state) {
    const mutation = new Mutation({
      mutationCache: this,
      mutationId: ++__privateWrapper(this, _mutationId)._,
      options: client.defaultMutationOptions(options),
      state
    });
    this.add(mutation);
    return mutation;
  }
  add(mutation) {
    __privateGet(this, _mutations).push(mutation);
    this.notify({ type: "added", mutation });
  }
  remove(mutation) {
    __privateSet(this, _mutations, __privateGet(this, _mutations).filter((x) => x !== mutation));
    this.notify({ type: "removed", mutation });
  }
  clear() {
    notifyManager.batch(() => {
      __privateGet(this, _mutations).forEach((mutation) => {
        this.remove(mutation);
      });
    });
  }
  getAll() {
    return __privateGet(this, _mutations);
  }
  find(filters) {
    const defaultedFilters = { exact: true, ...filters };
    return __privateGet(this, _mutations).find(
      (mutation) => matchMutation(defaultedFilters, mutation)
    );
  }
  findAll(filters = {}) {
    return __privateGet(this, _mutations).filter(
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
    __privateSet(this, _resuming, (__privateGet(this, _resuming) ?? Promise.resolve()).then(() => {
      const pausedMutations = __privateGet(this, _mutations).filter((x) => x.state.isPaused);
      return notifyManager.batch(
        () => pausedMutations.reduce(
          (promise, mutation) => promise.then(() => mutation.continue().catch(noop)),
          Promise.resolve()
        )
      );
    }).then(() => {
      __privateSet(this, _resuming, void 0);
    }));
    return __privateGet(this, _resuming);
  }
};
_mutations = new WeakMap();
_mutationId = new WeakMap();
_resuming = new WeakMap();
export {
  MutationCache
};
//# sourceMappingURL=mutationCache.js.map