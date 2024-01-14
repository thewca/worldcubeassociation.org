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

// src/retryer.ts
var retryer_exports = {};
__export(retryer_exports, {
  CancelledError: () => CancelledError,
  canFetch: () => canFetch,
  createRetryer: () => createRetryer,
  isCancelledError: () => isCancelledError
});
module.exports = __toCommonJS(retryer_exports);
var import_focusManager = require("./focusManager.cjs");
var import_onlineManager = require("./onlineManager.cjs");
var import_utils = require("./utils.cjs");
function defaultRetryDelay(failureCount) {
  return Math.min(1e3 * 2 ** failureCount, 3e4);
}
function canFetch(networkMode) {
  return (networkMode ?? "online") === "online" ? import_onlineManager.onlineManager.isOnline() : true;
}
var CancelledError = class {
  constructor(options) {
    this.revert = options == null ? void 0 : options.revert;
    this.silent = options == null ? void 0 : options.silent;
  }
};
function isCancelledError(value) {
  return value instanceof CancelledError;
}
function createRetryer(config) {
  let isRetryCancelled = false;
  let failureCount = 0;
  let isResolved = false;
  let continueFn;
  let promiseResolve;
  let promiseReject;
  const promise = new Promise((outerResolve, outerReject) => {
    promiseResolve = outerResolve;
    promiseReject = outerReject;
  });
  const cancel = (cancelOptions) => {
    var _a;
    if (!isResolved) {
      reject(new CancelledError(cancelOptions));
      (_a = config.abort) == null ? void 0 : _a.call(config);
    }
  };
  const cancelRetry = () => {
    isRetryCancelled = true;
  };
  const continueRetry = () => {
    isRetryCancelled = false;
  };
  const shouldPause = () => !import_focusManager.focusManager.isFocused() || config.networkMode !== "always" && !import_onlineManager.onlineManager.isOnline();
  const resolve = (value) => {
    var _a;
    if (!isResolved) {
      isResolved = true;
      (_a = config.onSuccess) == null ? void 0 : _a.call(config, value);
      continueFn == null ? void 0 : continueFn();
      promiseResolve(value);
    }
  };
  const reject = (value) => {
    var _a;
    if (!isResolved) {
      isResolved = true;
      (_a = config.onError) == null ? void 0 : _a.call(config, value);
      continueFn == null ? void 0 : continueFn();
      promiseReject(value);
    }
  };
  const pause = () => {
    return new Promise((continueResolve) => {
      var _a;
      continueFn = (value) => {
        const canContinue = isResolved || !shouldPause();
        if (canContinue) {
          continueResolve(value);
        }
        return canContinue;
      };
      (_a = config.onPause) == null ? void 0 : _a.call(config);
    }).then(() => {
      var _a;
      continueFn = void 0;
      if (!isResolved) {
        (_a = config.onContinue) == null ? void 0 : _a.call(config);
      }
    });
  };
  const run = () => {
    if (isResolved) {
      return;
    }
    let promiseOrValue;
    try {
      promiseOrValue = config.fn();
    } catch (error) {
      promiseOrValue = Promise.reject(error);
    }
    Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
      var _a;
      if (isResolved) {
        return;
      }
      const retry = config.retry ?? (import_utils.isServer ? 0 : 3);
      const retryDelay = config.retryDelay ?? defaultRetryDelay;
      const delay = typeof retryDelay === "function" ? retryDelay(failureCount, error) : retryDelay;
      const shouldRetry = retry === true || typeof retry === "number" && failureCount < retry || typeof retry === "function" && retry(failureCount, error);
      if (isRetryCancelled || !shouldRetry) {
        reject(error);
        return;
      }
      failureCount++;
      (_a = config.onFail) == null ? void 0 : _a.call(config, failureCount, error);
      (0, import_utils.sleep)(delay).then(() => {
        if (shouldPause()) {
          return pause();
        }
        return;
      }).then(() => {
        if (isRetryCancelled) {
          reject(error);
        } else {
          run();
        }
      });
    });
  };
  if (canFetch(config.networkMode)) {
    run();
  } else {
    pause().then(run);
  }
  return {
    promise,
    cancel,
    continue: () => {
      const didContinue = continueFn == null ? void 0 : continueFn();
      return didContinue ? promise : Promise.resolve();
    },
    cancelRetry,
    continueRetry
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CancelledError,
  canFetch,
  createRetryer,
  isCancelledError
});
//# sourceMappingURL=retryer.cjs.map