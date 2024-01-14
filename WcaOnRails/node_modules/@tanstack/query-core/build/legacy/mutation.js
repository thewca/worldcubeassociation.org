import {
  __privateAdd,
  __privateGet,
  __privateMethod,
  __privateSet
} from "./chunk-2HYBKCYP.js";

// src/mutation.ts
import { notifyManager } from "./notifyManager.js";
import { Removable } from "./removable.js";
import { canFetch, createRetryer } from "./retryer.js";
var _observers, _defaultOptions, _mutationCache, _retryer, _dispatch, dispatch_fn;
var Mutation = class extends Removable {
  constructor(config) {
    super();
    __privateAdd(this, _dispatch);
    __privateAdd(this, _observers, void 0);
    __privateAdd(this, _defaultOptions, void 0);
    __privateAdd(this, _mutationCache, void 0);
    __privateAdd(this, _retryer, void 0);
    this.mutationId = config.mutationId;
    __privateSet(this, _defaultOptions, config.defaultOptions);
    __privateSet(this, _mutationCache, config.mutationCache);
    __privateSet(this, _observers, []);
    this.state = config.state || getDefaultState();
    this.setOptions(config.options);
    this.scheduleGc();
  }
  setOptions(options) {
    this.options = { ...__privateGet(this, _defaultOptions), ...options };
    this.updateGcTime(this.options.gcTime);
  }
  get meta() {
    return this.options.meta;
  }
  addObserver(observer) {
    if (!__privateGet(this, _observers).includes(observer)) {
      __privateGet(this, _observers).push(observer);
      this.clearGcTimeout();
      __privateGet(this, _mutationCache).notify({
        type: "observerAdded",
        mutation: this,
        observer
      });
    }
  }
  removeObserver(observer) {
    __privateSet(this, _observers, __privateGet(this, _observers).filter((x) => x !== observer));
    this.scheduleGc();
    __privateGet(this, _mutationCache).notify({
      type: "observerRemoved",
      mutation: this,
      observer
    });
  }
  optionalRemove() {
    if (!__privateGet(this, _observers).length) {
      if (this.state.status === "pending") {
        this.scheduleGc();
      } else {
        __privateGet(this, _mutationCache).remove(this);
      }
    }
  }
  continue() {
    var _a;
    return ((_a = __privateGet(this, _retryer)) == null ? void 0 : _a.continue()) ?? // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
    this.execute(this.state.variables);
  }
  async execute(variables) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
    const executeMutation = () => {
      __privateSet(this, _retryer, createRetryer({
        fn: () => {
          if (!this.options.mutationFn) {
            return Promise.reject(new Error("No mutationFn found"));
          }
          return this.options.mutationFn(variables);
        },
        onFail: (failureCount, error) => {
          __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "failed", failureCount, error });
        },
        onPause: () => {
          __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "pause" });
        },
        onContinue: () => {
          __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "continue" });
        },
        retry: this.options.retry ?? 0,
        retryDelay: this.options.retryDelay,
        networkMode: this.options.networkMode
      }));
      return __privateGet(this, _retryer).promise;
    };
    const restored = this.state.status === "pending";
    try {
      if (!restored) {
        __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "pending", variables });
        await ((_b = (_a = __privateGet(this, _mutationCache).config).onMutate) == null ? void 0 : _b.call(
          _a,
          variables,
          this
        ));
        const context = await ((_d = (_c = this.options).onMutate) == null ? void 0 : _d.call(_c, variables));
        if (context !== this.state.context) {
          __privateMethod(this, _dispatch, dispatch_fn).call(this, {
            type: "pending",
            context,
            variables
          });
        }
      }
      const data = await executeMutation();
      await ((_f = (_e = __privateGet(this, _mutationCache).config).onSuccess) == null ? void 0 : _f.call(
        _e,
        data,
        variables,
        this.state.context,
        this
      ));
      await ((_h = (_g = this.options).onSuccess) == null ? void 0 : _h.call(_g, data, variables, this.state.context));
      await ((_j = (_i = __privateGet(this, _mutationCache).config).onSettled) == null ? void 0 : _j.call(
        _i,
        data,
        null,
        this.state.variables,
        this.state.context,
        this
      ));
      await ((_l = (_k = this.options).onSettled) == null ? void 0 : _l.call(_k, data, null, variables, this.state.context));
      __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "success", data });
      return data;
    } catch (error) {
      try {
        await ((_n = (_m = __privateGet(this, _mutationCache).config).onError) == null ? void 0 : _n.call(
          _m,
          error,
          variables,
          this.state.context,
          this
        ));
        await ((_p = (_o = this.options).onError) == null ? void 0 : _p.call(
          _o,
          error,
          variables,
          this.state.context
        ));
        await ((_r = (_q = __privateGet(this, _mutationCache).config).onSettled) == null ? void 0 : _r.call(
          _q,
          void 0,
          error,
          this.state.variables,
          this.state.context,
          this
        ));
        await ((_t = (_s = this.options).onSettled) == null ? void 0 : _t.call(
          _s,
          void 0,
          error,
          variables,
          this.state.context
        ));
        throw error;
      } finally {
        __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "error", error });
      }
    }
  }
};
_observers = new WeakMap();
_defaultOptions = new WeakMap();
_mutationCache = new WeakMap();
_retryer = new WeakMap();
_dispatch = new WeakSet();
dispatch_fn = function(action) {
  const reducer = (state) => {
    switch (action.type) {
      case "failed":
        return {
          ...state,
          failureCount: action.failureCount,
          failureReason: action.error
        };
      case "pause":
        return {
          ...state,
          isPaused: true
        };
      case "continue":
        return {
          ...state,
          isPaused: false
        };
      case "pending":
        return {
          ...state,
          context: action.context,
          data: void 0,
          failureCount: 0,
          failureReason: null,
          error: null,
          isPaused: !canFetch(this.options.networkMode),
          status: "pending",
          variables: action.variables,
          submittedAt: Date.now()
        };
      case "success":
        return {
          ...state,
          data: action.data,
          failureCount: 0,
          failureReason: null,
          error: null,
          status: "success",
          isPaused: false
        };
      case "error":
        return {
          ...state,
          data: void 0,
          error: action.error,
          failureCount: state.failureCount + 1,
          failureReason: action.error,
          isPaused: false,
          status: "error"
        };
    }
  };
  this.state = reducer(this.state);
  notifyManager.batch(() => {
    __privateGet(this, _observers).forEach((observer) => {
      observer.onMutationUpdate(action);
    });
    __privateGet(this, _mutationCache).notify({
      mutation: this,
      type: "updated",
      action
    });
  });
};
function getDefaultState() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    status: "idle",
    variables: void 0,
    submittedAt: 0
  };
}
export {
  Mutation,
  getDefaultState
};
//# sourceMappingURL=mutation.js.map