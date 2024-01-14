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

// src/mutationCache.ts
var mutationCache_exports = {};
__export(mutationCache_exports, {
  MutationCache: () => MutationCache
});
module.exports = __toCommonJS(mutationCache_exports);
var import_notifyManager = require("./notifyManager.cjs");
var import_mutation = require("./mutation.cjs");
var import_utils = require("./utils.cjs");
var import_subscribable = require("./subscribable.cjs");
var MutationCache = class extends import_subscribable.Subscribable {
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
    const mutation = new import_mutation.Mutation({
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
    import_notifyManager.notifyManager.batch(() => {
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
      (mutation) => (0, import_utils.matchMutation)(defaultedFilters, mutation)
    );
  }
  findAll(filters = {}) {
    return this.#mutations.filter(
      (mutation) => (0, import_utils.matchMutation)(filters, mutation)
    );
  }
  notify(event) {
    import_notifyManager.notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    });
  }
  resumePausedMutations() {
    this.#resuming = (this.#resuming ?? Promise.resolve()).then(() => {
      const pausedMutations = this.#mutations.filter((x) => x.state.isPaused);
      return import_notifyManager.notifyManager.batch(
        () => pausedMutations.reduce(
          (promise, mutation) => promise.then(() => mutation.continue().catch(import_utils.noop)),
          Promise.resolve()
        )
      );
    }).then(() => {
      this.#resuming = void 0;
    });
    return this.#resuming;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MutationCache
});
//# sourceMappingURL=mutationCache.cjs.map