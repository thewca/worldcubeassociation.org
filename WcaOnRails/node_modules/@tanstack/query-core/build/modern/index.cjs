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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  CancelledError: () => import_retryer.CancelledError,
  InfiniteQueryObserver: () => import_infiniteQueryObserver.InfiniteQueryObserver,
  MutationCache: () => import_mutationCache.MutationCache,
  MutationObserver: () => import_mutationObserver.MutationObserver,
  QueriesObserver: () => import_queriesObserver.QueriesObserver,
  Query: () => import_query.Query,
  QueryCache: () => import_queryCache.QueryCache,
  QueryClient: () => import_queryClient.QueryClient,
  QueryObserver: () => import_queryObserver.QueryObserver,
  defaultShouldDehydrateMutation: () => import_hydration.defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery: () => import_hydration.defaultShouldDehydrateQuery,
  dehydrate: () => import_hydration.dehydrate,
  focusManager: () => import_focusManager.focusManager,
  hashKey: () => import_utils.hashKey,
  hydrate: () => import_hydration.hydrate,
  isCancelledError: () => import_retryer2.isCancelledError,
  isServer: () => import_utils.isServer,
  keepPreviousData: () => import_utils.keepPreviousData,
  matchQuery: () => import_utils.matchQuery,
  notifyManager: () => import_notifyManager.notifyManager,
  onlineManager: () => import_onlineManager.onlineManager,
  replaceEqualDeep: () => import_utils.replaceEqualDeep
});
module.exports = __toCommonJS(src_exports);
var import_retryer = require("./retryer.cjs");
var import_queryCache = require("./queryCache.cjs");
var import_queryClient = require("./queryClient.cjs");
var import_queryObserver = require("./queryObserver.cjs");
var import_queriesObserver = require("./queriesObserver.cjs");
var import_infiniteQueryObserver = require("./infiniteQueryObserver.cjs");
var import_mutationCache = require("./mutationCache.cjs");
var import_mutationObserver = require("./mutationObserver.cjs");
var import_notifyManager = require("./notifyManager.cjs");
var import_focusManager = require("./focusManager.cjs");
var import_onlineManager = require("./onlineManager.cjs");
var import_utils = require("./utils.cjs");
var import_retryer2 = require("./retryer.cjs");
var import_hydration = require("./hydration.cjs");
__reExport(src_exports, require("./types.cjs"), module.exports);
var import_query = require("./query.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CancelledError,
  InfiniteQueryObserver,
  MutationCache,
  MutationObserver,
  QueriesObserver,
  Query,
  QueryCache,
  QueryClient,
  QueryObserver,
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  focusManager,
  hashKey,
  hydrate,
  isCancelledError,
  isServer,
  keepPreviousData,
  matchQuery,
  notifyManager,
  onlineManager,
  replaceEqualDeep,
  ...require("./types.cjs")
});
//# sourceMappingURL=index.cjs.map