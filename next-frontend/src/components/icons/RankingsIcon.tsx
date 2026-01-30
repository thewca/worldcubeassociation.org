"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const RankingsIcon = createIcon({
  displayName: "RankingsIcon",
  viewBox: "0 0 45 40",
  path: (
    <>
      <path
        d="M4.5,35.56h9v-17.78H4.5v17.78ZM18,35.56h9V4.44h-9v31.11ZM31.5,35.56h9v-13.33h-9v13.33ZM0,40V13.33h13.5V0h18v17.78h13.5v22.22H0Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default RankingsIcon;
