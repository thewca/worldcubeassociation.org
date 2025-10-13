"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const RegulationsIcon = createIcon({
  displayName: "RegulationsIcon",
  viewBox: "0 0 45 37",
  path: (
    <>
      <path
        d="M27.9,37l-3.15-3.22,5.85-5.98-5.85-5.98,3.15-3.22,5.85,5.98,5.85-5.98,3.15,3.22-5.85,5.98,5.85,5.98-3.15,3.22-5.85-5.98-5.85,5.98ZM32.34,16.28l-7.99-8.17,3.15-3.22,4.78,4.89L41.85,0l3.15,3.28-12.66,13ZM0,30.09v-4.6h20.25v4.6H0ZM0,11.68v-4.6h20.25v4.6H0Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default RegulationsIcon;
