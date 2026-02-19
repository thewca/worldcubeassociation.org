"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const TwitchIcon = createIcon({
  displayName: "TwitchIcon",
  viewBox: "0 0 43 44.87",
  path: (
    <>
      <path
        d="M0,7.81v31.21h10.75v5.85h5.87l5.86-5.86h8.8l11.73-11.7V0H2.93L0,7.81ZM6.84,3.9h32.25v21.46l-6.84,6.83h-10.75l-5.86,5.85v-5.85H6.84V3.9Z"
        fill="currentColor"
      />
      <path d="M17.59,11.71h3.91v11.7h-3.91v-11.7Z" fill="currentColor" />
      <path d="M28.34,11.71h3.91v11.7h-3.91v-11.7Z" fill="currentColor" />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default TwitchIcon;
