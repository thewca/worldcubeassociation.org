"use client";

// src/QueryErrorResetBoundary.tsx
import * as React from "react";
function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}
var QueryErrorResetBoundaryContext = React.createContext(createValue());
var useQueryErrorResetBoundary = () => React.useContext(QueryErrorResetBoundaryContext);
var QueryErrorResetBoundary = ({
  children
}) => {
  const [value] = React.useState(() => createValue());
  return /* @__PURE__ */ React.createElement(QueryErrorResetBoundaryContext.Provider, { value }, typeof children === "function" ? children(value) : children);
};
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary
};
//# sourceMappingURL=QueryErrorResetBoundary.js.map