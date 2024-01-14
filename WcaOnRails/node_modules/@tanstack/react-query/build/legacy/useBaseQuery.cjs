"use strict";
"use client";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/useBaseQuery.ts
var useBaseQuery_exports = {};
__export(useBaseQuery_exports, {
  useBaseQuery: () => useBaseQuery
});
module.exports = __toCommonJS(useBaseQuery_exports);
var React = __toESM(require("react"), 1);
var import_query_core = require("@tanstack/query-core");
var import_QueryErrorResetBoundary = require("./QueryErrorResetBoundary.cjs");
var import_QueryClientProvider = require("./QueryClientProvider.cjs");
var import_isRestoring = require("./isRestoring.cjs");
var import_errorBoundaryUtils = require("./errorBoundaryUtils.cjs");
var import_suspense = require("./suspense.cjs");
function useBaseQuery(options, Observer, queryClient) {
  if (process.env.NODE_ENV !== "production") {
    if (typeof options !== "object" || Array.isArray(options)) {
      throw new Error(
        'Bad argument type. Starting with v5, only the "Object" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object'
      );
    }
  }
  const client = (0, import_QueryClientProvider.useQueryClient)(queryClient);
  const isRestoring = (0, import_isRestoring.useIsRestoring)();
  const errorResetBoundary = (0, import_QueryErrorResetBoundary.useQueryErrorResetBoundary)();
  const defaultedOptions = client.defaultQueryOptions(options);
  defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
  (0, import_suspense.ensureStaleTime)(defaultedOptions);
  (0, import_errorBoundaryUtils.ensurePreventErrorBoundaryRetry)(defaultedOptions, errorResetBoundary);
  (0, import_errorBoundaryUtils.useClearResetErrorBoundary)(errorResetBoundary);
  const [observer] = React.useState(
    () => new Observer(
      client,
      defaultedOptions
    )
  );
  const result = observer.getOptimisticResult(defaultedOptions);
  React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const unsubscribe = isRestoring ? () => void 0 : observer.subscribe(import_query_core.notifyManager.batchCalls(onStoreChange));
        observer.updateResult();
        return unsubscribe;
      },
      [observer, isRestoring]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  React.useEffect(() => {
    observer.setOptions(defaultedOptions, { listeners: false });
  }, [defaultedOptions, observer]);
  if ((0, import_suspense.shouldSuspend)(defaultedOptions, result)) {
    throw (0, import_suspense.fetchOptimistic)(defaultedOptions, observer, errorResetBoundary);
  }
  if ((0, import_errorBoundaryUtils.getHasError)({
    result,
    errorResetBoundary,
    throwOnError: defaultedOptions.throwOnError,
    query: client.getQueryCache().get(defaultedOptions.queryHash)
  })) {
    throw result.error;
  }
  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useBaseQuery
});
//# sourceMappingURL=useBaseQuery.cjs.map