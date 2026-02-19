"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const DelegateReportIcon = createIcon({
  displayName: "DelegateReportIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M10,35h17.5v-5H10v5ZM10,25h25v-5H10v5ZM10,15h25v-5H10v5ZM5,45c-1.38,0-2.55-.49-3.53-1.47-.98-.98-1.47-2.16-1.47-3.53V5c0-1.38.49-2.55,1.47-3.53.98-.98,2.16-1.47,3.53-1.47h35c1.38,0,2.55.49,3.53,1.47.98.98,1.47,2.16,1.47,3.53v35c0,1.38-.49,2.55-1.47,3.53-.98.98-2.16,1.47-3.53,1.47H5ZM5,40h35V5H5v35Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default DelegateReportIcon;
