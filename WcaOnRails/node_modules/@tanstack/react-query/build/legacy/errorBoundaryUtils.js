"use client";

// src/errorBoundaryUtils.ts
import * as React from "react";
import { shouldThrowError } from "./utils.js";
var ensurePreventErrorBoundaryRetry = (options, errorResetBoundary) => {
  if (options.suspense || options.throwOnError) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
var useClearResetErrorBoundary = (errorResetBoundary) => {
  React.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
var getHasError = ({
  result,
  errorResetBoundary,
  throwOnError,
  query
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && query && shouldThrowError(throwOnError, [result.error, query]);
};
export {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary
};
//# sourceMappingURL=errorBoundaryUtils.js.map