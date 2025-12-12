"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const _SkewbIcon = createIcon({
  displayName: "_SkewbIcon",
  viewBox: "0 0 500 500",
  path: (
    <>
      <path
        d="m215.48131-138.07208h276.13837v276.13837h-276.13837z"
        strokeWidth=".955982"
        transform="matrix(.70710678 .70710678 -.70710678 .70710678 0 0)"
        fill="currentColor"
      />
      <path d="m43 43.5h187.5l-187.5 187.5z" fill="currentColor" />
      <path d="m43 456.5v-187.5l187.5 187.5z" fill="currentColor" />
      <path d="m457 456.5h-187.5l187.5-187.5z" fill="currentColor" />
      <path d="m457 43.5v187.5l-187.5-187.5z" fill="currentColor" />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default _SkewbIcon;
