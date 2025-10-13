"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const WcaDocsIcon = createIcon({
  displayName: "WcaDocsIcon",
  viewBox: "0 0 36 45",
  path: (
    <>
      <path
        d="M9,36h18v-4.5H9v4.5ZM9,27h18v-4.5H9v4.5ZM4.5,45c-1.24,0-2.3-.44-3.18-1.32-.88-.88-1.32-1.94-1.32-3.18V4.5c0-1.24.44-2.3,1.32-3.18.88-.88,1.94-1.32,3.18-1.32h18l13.5,13.5v27c0,1.24-.44,2.3-1.32,3.18-.88.88-1.94,1.32-3.18,1.32H4.5ZM20.25,15.75V4.5H4.5v36h27V15.75h-11.25Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default WcaDocsIcon;
