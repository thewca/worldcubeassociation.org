"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const CompNotStartedIcon = createIcon({
  displayName: "CompNotStartedIcon",
  viewBox: "0 0 36 45",
  path: (
    <>
      <path
        d="M9,40.5h18v-6.75c0-2.48-.88-4.59-2.64-6.36-1.76-1.76-3.88-2.64-6.36-2.64s-4.59.88-6.36,2.64c-1.76,1.76-2.64,3.88-2.64,6.36v6.75ZM0,45v-4.5h4.5v-6.75c0-2.29.53-4.43,1.6-6.44,1.07-2.01,2.56-3.61,4.47-4.81-1.91-1.2-3.4-2.8-4.47-4.81-1.07-2.01-1.6-4.15-1.6-6.44v-6.75H0V0h36v4.5h-4.5v6.75c0,2.29-.53,4.43-1.6,6.44-1.07,2.01-2.56,3.61-4.47,4.81,1.91,1.2,3.4,2.8,4.47,4.81,1.07,2.01,1.6,4.15,1.6,6.44v6.75h4.5v4.5H0Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default CompNotStartedIcon;
