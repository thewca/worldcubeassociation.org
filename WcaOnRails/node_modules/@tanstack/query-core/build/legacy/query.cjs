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
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/query.ts
var query_exports = {};
__export(query_exports, {
  Query: () => Query
});
module.exports = __toCommonJS(query_exports);
var import_utils = require("./utils.cjs");
var import_notifyManager = require("./notifyManager.cjs");
var import_retryer = require("./retryer.cjs");
var import_removable = require("./removable.cjs");
var _initialState, _revertState, _cache, _promise, _retryer, _observers, _defaultOptions, _abortSignalConsumed, _setOptions, setOptions_fn, _dispatch, dispatch_fn;
var Query = class extends import_removable.Removable {
  constructor(config) {
    super();
    __privateAdd(this, _setOptions);
    __privateAdd(this, _dispatch);
    __privateAdd(this, _initialState, void 0);
    __privateAdd(this, _revertState, void 0);
    __privateAdd(this, _cache, void 0);
    __privateAdd(this, _promise, void 0);
    __privateAdd(this, _retryer, void 0);
    __privateAdd(this, _observers, void 0);
    __privateAdd(this, _defaultOptions, void 0);
    __privateAdd(this, _abortSignalConsumed, void 0);
    __privateSet(this, _abortSignalConsumed, false);
    __privateSet(this, _defaultOptions, config.defaultOptions);
    __privateMethod(this, _setOptions, setOptions_fn).call(this, config.options);
    __privateSet(this, _observers, []);
    __privateSet(this, _cache, config.cache);
    this.queryKey = config.queryKey;
    this.queryHash = config.queryHash;
    __privateSet(this, _initialState, config.state || getDefaultState(this.options));
    this.state = __privateGet(this, _initialState);
    this.scheduleGc();
  }
  get meta() {
    return this.options.meta;
  }
  optionalRemove() {
    if (!__privateGet(this, _observers).length && this.state.fetchStatus === "idle") {
      __privateGet(this, _cache).remove(this);
    }
  }
  setData(newData, options) {
    const data = (0, import_utils.replaceData)(this.state.data, newData, this.options);
    __privateMethod(this, _dispatch, dispatch_fn).call(this, {
      data,
      type: "success",
      dataUpdatedAt: options == null ? void 0 : options.updatedAt,
      manual: options == null ? void 0 : options.manual
    });
    return data;
  }
  setState(state, setStateOptions) {
    __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "setState", state, setStateOptions });
  }
  cancel(options) {
    var _a;
    const promise = __privateGet(this, _promise);
    (_a = __privateGet(this, _retryer)) == null ? void 0 : _a.cancel(options);
    return promise ? promise.then(import_utils.noop).catch(import_utils.noop) : Promise.resolve();
  }
  destroy() {
    super.destroy();
    this.cancel({ silent: true });
  }
  reset() {
    this.destroy();
    this.setState(__privateGet(this, _initialState));
  }
  isActive() {
    return __privateGet(this, _observers).some(
      (observer) => observer.options.enabled !== false
    );
  }
  isDisabled() {
    return this.getObserversCount() > 0 && !this.isActive();
  }
  isStale() {
    return this.state.isInvalidated || !this.state.dataUpdatedAt || __privateGet(this, _observers).some((observer) => observer.getCurrentResult().isStale);
  }
  isStaleByTime(staleTime = 0) {
    return this.state.isInvalidated || !this.state.dataUpdatedAt || !(0, import_utils.timeUntilStale)(this.state.dataUpdatedAt, staleTime);
  }
  onFocus() {
    var _a;
    const observer = __privateGet(this, _observers).find((x) => x.shouldFetchOnWindowFocus());
    observer == null ? void 0 : observer.refetch({ cancelRefetch: false });
    (_a = __privateGet(this, _retryer)) == null ? void 0 : _a.continue();
  }
  onOnline() {
    var _a;
    const observer = __privateGet(this, _observers).find((x) => x.shouldFetchOnReconnect());
    observer == null ? void 0 : observer.refetch({ cancelRefetch: false });
    (_a = __privateGet(this, _retryer)) == null ? void 0 : _a.continue();
  }
  addObserver(observer) {
    if (!__privateGet(this, _observers).includes(observer)) {
      __privateGet(this, _observers).push(observer);
      this.clearGcTimeout();
      __privateGet(this, _cache).notify({ type: "observerAdded", query: this, observer });
    }
  }
  removeObserver(observer) {
    if (__privateGet(this, _observers).includes(observer)) {
      __privateSet(this, _observers, __privateGet(this, _observers).filter((x) => x !== observer));
      if (!__privateGet(this, _observers).length) {
        if (__privateGet(this, _retryer)) {
          if (__privateGet(this, _abortSignalConsumed)) {
            __privateGet(this, _retryer).cancel({ revert: true });
          } else {
            __privateGet(this, _retryer).cancelRetry();
          }
        }
        this.scheduleGc();
      }
      __privateGet(this, _cache).notify({ type: "observerRemoved", query: this, observer });
    }
  }
  getObserversCount() {
    return __privateGet(this, _observers).length;
  }
  invalidate() {
    if (!this.state.isInvalidated) {
      __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "invalidate" });
    }
  }
  fetch(options, fetchOptions) {
    var _a, _b, _c, _d;
    if (this.state.fetchStatus !== "idle") {
      if (this.state.dataUpdatedAt && (fetchOptions == null ? void 0 : fetchOptions.cancelRefetch)) {
        this.cancel({ silent: true });
      } else if (__privateGet(this, _promise)) {
        (_a = __privateGet(this, _retryer)) == null ? void 0 : _a.continueRetry();
        return __privateGet(this, _promise);
      }
    }
    if (options) {
      __privateMethod(this, _setOptions, setOptions_fn).call(this, options);
    }
    if (!this.options.queryFn) {
      const observer = __privateGet(this, _observers).find((x) => x.options.queryFn);
      if (observer) {
        __privateMethod(this, _setOptions, setOptions_fn).call(this, observer.options);
      }
    }
    if (process.env.NODE_ENV !== "production") {
      if (!Array.isArray(this.options.queryKey)) {
        console.error(
          `As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']`
        );
      }
    }
    const abortController = new AbortController();
    const queryFnContext = {
      queryKey: this.queryKey,
      meta: this.meta
    };
    const addSignalProperty = (object) => {
      Object.defineProperty(object, "signal", {
        enumerable: true,
        get: () => {
          __privateSet(this, _abortSignalConsumed, true);
          return abortController.signal;
        }
      });
    };
    addSignalProperty(queryFnContext);
    const fetchFn = () => {
      if (!this.options.queryFn) {
        return Promise.reject(
          new Error(`Missing queryFn: '${this.options.queryHash}'`)
        );
      }
      __privateSet(this, _abortSignalConsumed, false);
      if (this.options.persister) {
        return this.options.persister(
          this.options.queryFn,
          queryFnContext,
          this
        );
      }
      return this.options.queryFn(
        queryFnContext
      );
    };
    const context = {
      fetchOptions,
      options: this.options,
      queryKey: this.queryKey,
      state: this.state,
      fetchFn
    };
    addSignalProperty(context);
    (_b = this.options.behavior) == null ? void 0 : _b.onFetch(
      context,
      this
    );
    __privateSet(this, _revertState, this.state);
    if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== ((_c = context.fetchOptions) == null ? void 0 : _c.meta)) {
      __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "fetch", meta: (_d = context.fetchOptions) == null ? void 0 : _d.meta });
    }
    const onError = (error) => {
      var _a2, _b2, _c2, _d2;
      if (!((0, import_retryer.isCancelledError)(error) && error.silent)) {
        __privateMethod(this, _dispatch, dispatch_fn).call(this, {
          type: "error",
          error
        });
      }
      if (!(0, import_retryer.isCancelledError)(error)) {
        (_b2 = (_a2 = __privateGet(this, _cache).config).onError) == null ? void 0 : _b2.call(
          _a2,
          error,
          this
        );
        (_d2 = (_c2 = __privateGet(this, _cache).config).onSettled) == null ? void 0 : _d2.call(
          _c2,
          this.state.data,
          error,
          this
        );
      }
      if (!this.isFetchingOptimistic) {
        this.scheduleGc();
      }
      this.isFetchingOptimistic = false;
    };
    __privateSet(this, _retryer, (0, import_retryer.createRetryer)({
      fn: context.fetchFn,
      abort: abortController.abort.bind(abortController),
      onSuccess: (data) => {
        var _a2, _b2, _c2, _d2;
        if (typeof data === "undefined") {
          if (process.env.NODE_ENV !== "production") {
            console.error(
              `Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`
            );
          }
          onError(new Error(`${this.queryHash} data is undefined`));
          return;
        }
        this.setData(data);
        (_b2 = (_a2 = __privateGet(this, _cache).config).onSuccess) == null ? void 0 : _b2.call(_a2, data, this);
        (_d2 = (_c2 = __privateGet(this, _cache).config).onSettled) == null ? void 0 : _d2.call(
          _c2,
          data,
          this.state.error,
          this
        );
        if (!this.isFetchingOptimistic) {
          this.scheduleGc();
        }
        this.isFetchingOptimistic = false;
      },
      onError,
      onFail: (failureCount, error) => {
        __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "failed", failureCount, error });
      },
      onPause: () => {
        __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "pause" });
      },
      onContinue: () => {
        __privateMethod(this, _dispatch, dispatch_fn).call(this, { type: "continue" });
      },
      retry: context.options.retry,
      retryDelay: context.options.retryDelay,
      networkMode: context.options.networkMode
    }));
    __privateSet(this, _promise, __privateGet(this, _retryer).promise);
    return __privateGet(this, _promise);
  }
};
_initialState = new WeakMap();
_revertState = new WeakMap();
_cache = new WeakMap();
_promise = new WeakMap();
_retryer = new WeakMap();
_observers = new WeakMap();
_defaultOptions = new WeakMap();
_abortSignalConsumed = new WeakMap();
_setOptions = new WeakSet();
setOptions_fn = function(options) {
  this.options = { ...__privateGet(this, _defaultOptions), ...options };
  this.updateGcTime(this.options.gcTime);
};
_dispatch = new WeakSet();
dispatch_fn = function(action) {
  const reducer = (state) => {
    switch (action.type) {
      case "failed":
        return {
          ...state,
          fetchFailureCount: action.failureCount,
          fetchFailureReason: action.error
        };
      case "pause":
        return {
          ...state,
          fetchStatus: "paused"
        };
      case "continue":
        return {
          ...state,
          fetchStatus: "fetching"
        };
      case "fetch":
        return {
          ...state,
          fetchFailureCount: 0,
          fetchFailureReason: null,
          fetchMeta: action.meta ?? null,
          fetchStatus: (0, import_retryer.canFetch)(this.options.networkMode) ? "fetching" : "paused",
          ...!state.dataUpdatedAt && {
            error: null,
            status: "pending"
          }
        };
      case "success":
        return {
          ...state,
          data: action.data,
          dataUpdateCount: state.dataUpdateCount + 1,
          dataUpdatedAt: action.dataUpdatedAt ?? Date.now(),
          error: null,
          isInvalidated: false,
          status: "success",
          ...!action.manual && {
            fetchStatus: "idle",
            fetchFailureCount: 0,
            fetchFailureReason: null
          }
        };
      case "error":
        const error = action.error;
        if ((0, import_retryer.isCancelledError)(error) && error.revert && __privateGet(this, _revertState)) {
          return { ...__privateGet(this, _revertState), fetchStatus: "idle" };
        }
        return {
          ...state,
          error,
          errorUpdateCount: state.errorUpdateCount + 1,
          errorUpdatedAt: Date.now(),
          fetchFailureCount: state.fetchFailureCount + 1,
          fetchFailureReason: error,
          fetchStatus: "idle",
          status: "error"
        };
      case "invalidate":
        return {
          ...state,
          isInvalidated: true
        };
      case "setState":
        return {
          ...state,
          ...action.state
        };
    }
  };
  this.state = reducer(this.state);
  import_notifyManager.notifyManager.batch(() => {
    __privateGet(this, _observers).forEach((observer) => {
      observer.onQueryUpdate();
    });
    __privateGet(this, _cache).notify({ query: this, type: "updated", action });
  });
};
function getDefaultState(options) {
  const data = typeof options.initialData === "function" ? options.initialData() : options.initialData;
  const hasData = typeof data !== "undefined";
  const initialDataUpdatedAt = hasData ? typeof options.initialDataUpdatedAt === "function" ? options.initialDataUpdatedAt() : options.initialDataUpdatedAt : 0;
  return {
    data,
    dataUpdateCount: 0,
    dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: false,
    status: hasData ? "success" : "pending",
    fetchStatus: "idle"
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Query
});
//# sourceMappingURL=query.cjs.map