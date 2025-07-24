"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const SpectatorsIcon = createIcon({
  displayName: "SpectatorsIcon",
  viewBox: "0 0 45 26",
  path: (
    <>
      <path
        d="M13.24,11.7V3.9c0-2.15-1.78-3.9-3.97-3.9h-2.65c-2.19,0-3.97,1.75-3.97,3.9v7.8h10.59Z"
        fill="currentColor"
      />
      <path
        d="M27.79,11.7V3.9c0-2.15-1.78-3.9-3.97-3.9h-2.65c-2.19,0-3.97,1.75-3.97,3.9v7.8h10.59Z"
        fill="currentColor"
      />
      <path
        d="M42.35,11.7V3.9c0-2.15-1.78-3.9-3.97-3.9h-2.65c-2.19,0-3.97,1.75-3.97,3.9v7.8h10.59Z"
        fill="currentColor"
      />
      <path
        d="M45,19.5v-2.6c0-1.44-1.19-2.6-2.65-2.6H2.65c-1.46,0-2.65,1.16-2.65,2.6v2.6h6.62v3.9h-2.65v2.6h7.94v-2.6h-2.65v-3.9h11.91v3.9h-2.65v2.6h7.94v-2.6h-2.65v-3.9h11.91v3.9h-2.65v2.6h7.94v-2.6h-2.65v-3.9h6.62Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default SpectatorsIcon;
