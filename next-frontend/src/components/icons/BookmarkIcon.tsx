"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const BookmarkIcon = createIcon({
  displayName: "BookmarkIcon",
  viewBox: "0 0 35 45",
  path: (
    <>
      <path
        d="M0,45V5c0-1.38.49-2.55,1.47-3.53.98-.98,2.16-1.47,3.53-1.47h25c1.38,0,2.55.49,3.53,1.47.98.98,1.47,2.16,1.47,3.53v40l-17.5-7.5L0,45ZM5,37.38l12.5-5.38,12.5,5.38V5H5v32.38Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default BookmarkIcon;
