"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const ResultsExportIcon = createIcon({
  displayName: "ResultsExportIcon",
  viewBox: "0 0 45 44.73",
  path: (
    <>
      <path
        d="M45,28.58l-8.64,8.64-3.15-3.04,3.43-3.43h-19.54v-4.35h19.62l-3.42-3.42,3.05-3.05,8.65,8.65Z"
        fill="currentColor"
      />
      <path
        d="M32.31,19.88v-8.25l-.19-.19L20.79.18l-.19-.18H0v44.73h32.31v-7.46h-4.35v3.11H4.35V4.35h11.18v12.43h12.43v3.11h4.35ZM19.25,13.07V4.35l8.74,8.72h-8.74Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default ResultsExportIcon;
