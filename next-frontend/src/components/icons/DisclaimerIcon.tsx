"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const DisclaimerIcon = createIcon({
  displayName: "DisclaimerIcon",
  viewBox: "0 0 10 45",
  path: (
    <>
      <path
        d="M5,45c-1.38,0-2.55-.49-3.53-1.47-.98-.98-1.47-2.16-1.47-3.53s.49-2.55,1.47-3.53c.98-.98,2.16-1.47,3.53-1.47s2.55.49,3.53,1.47c.98.98,1.47,2.16,1.47,3.53s-.49,2.55-1.47,3.53c-.98.98-2.16,1.47-3.53,1.47ZM0,30V0h10v30H0Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default DisclaimerIcon;
