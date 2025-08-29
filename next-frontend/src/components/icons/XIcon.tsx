"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const XIcon = createIcon({
  displayName: "XIcon",
  viewBox: "0 0 45 43",
  path: (
    <>
      <path
        d="M26.78,18.21L43.53,0h-3.97l-14.55,15.81L13.4,0H0l17.57,23.91L0,43h3.97l15.36-16.7,12.27,16.7h13.4l-18.22-24.79h0ZM21.34,24.12l-1.78-2.38L5.4,2.79h6.1l11.43,15.29,1.78,2.38,14.86,19.87h-6.1l-12.12-16.21h0Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default XIcon;
