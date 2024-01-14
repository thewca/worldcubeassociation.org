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
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});

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
var _mutations, _mutationId, _resuming;
var MutationCache = class extends import_subscribable.Subscribable {
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
    const mutation = new import_mutation.Mutation({
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
    import_notifyManager.notifyManager.batch(() => {
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
      (mutation) => (0, import_utils.matchMutation)(defaultedFilters, mutation)
    );
  }
  findAll(filters = {}) {
    return __privateGet(this, _mutations).filter(
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
    __privateSet(this, _resuming, (__privateGet(this, _resuming) ?? Promise.resolve()).then(() => {
      const pausedMutations = __privateGet(this, _mutations).filter((x) => x.state.isPaused);
      return import_notifyManager.notifyManager.batch(
        () => pausedMutations.reduce(
          (promise, mutation) => promise.then(() => mutation.continue().catch(import_utils.noop)),
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MutationCache
});
//# sourceMappingURL=mutationCache.cjs.map