"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const LocationIcon = createIcon({
  displayName: "LocationIcon",
  viewBox: "0 0 36 45",
  path: (
    <>
      <path
        d="M18,22.5c1.24,0,2.3-.44,3.18-1.32.88-.88,1.32-1.94,1.32-3.18s-.44-2.3-1.32-3.18c-.88-.88-1.94-1.32-3.18-1.32s-2.3.44-3.18,1.32c-.88.88-1.32,1.94-1.32,3.18s.44,2.3,1.32,3.18c.88.88,1.94,1.32,3.18,1.32ZM18,39.04c4.58-4.2,7.97-8.02,10.18-11.45,2.21-3.43,3.32-6.48,3.32-9.14,0-4.09-1.3-7.43-3.91-10.04-2.61-2.61-5.8-3.91-9.59-3.91s-6.98,1.3-9.59,3.91c-2.61,2.61-3.91,5.95-3.91,10.04,0,2.66,1.11,5.71,3.32,9.14,2.21,3.43,5.61,7.25,10.18,11.45ZM18,45c-6.04-5.14-10.55-9.91-13.53-14.32C1.49,26.28,0,22.2,0,18.45c0-5.63,1.81-10.11,5.43-13.44C9.05,1.67,13.24,0,18,0s8.95,1.67,12.57,5.01c3.62,3.34,5.43,7.82,5.43,13.44,0,3.75-1.49,7.83-4.47,12.23-2.98,4.41-7.49,9.18-13.53,14.32Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default LocationIcon;
