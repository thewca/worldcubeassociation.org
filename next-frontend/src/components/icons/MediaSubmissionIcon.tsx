"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const MediaSubmissionIcon = createIcon({
  displayName: "MediaSubmissionIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M5,45c-1.38,0-2.55-.49-3.53-1.47-.98-.98-1.47-2.16-1.47-3.53V5c0-1.38.49-2.55,1.47-3.53.98-.98,2.16-1.47,3.53-1.47h20v5H5v35h35v-20h5v20c0,1.38-.49,2.55-1.47,3.53-.98.98-2.16,1.47-3.53,1.47H5ZM7.5,35h30l-9.38-12.5-7.5,10-5.62-7.5-7.5,10ZM35,15v-5h-5v-5h5V0h5v5h5v5h-5v5h-5Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default MediaSubmissionIcon;
