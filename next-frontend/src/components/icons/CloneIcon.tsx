"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const CloneIcon = createIcon({
  displayName: "CloneIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M15.88,36c-1.46,0-2.7-.44-3.74-1.32-1.04-.88-1.56-1.94-1.56-3.18V4.5c0-1.24.52-2.3,1.56-3.18,1.04-.88,2.28-1.32,3.74-1.32h23.82c1.46,0,2.7.44,3.74,1.32,1.04.88,1.56,1.94,1.56,3.18v27c0,1.24-.52,2.3-1.56,3.18-1.04.88-2.28,1.32-3.74,1.32H15.88ZM15.88,31.5h23.82V4.5H15.88v27ZM5.29,45c-1.46,0-2.7-.44-3.74-1.32-1.04-.88-1.56-1.94-1.56-3.18V9h5.29v31.5h29.12v4.5H5.29Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default CloneIcon;
