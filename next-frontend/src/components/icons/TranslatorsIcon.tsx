"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const TranslatorsIcon = createIcon({
  displayName: "TranslatorsIcon",
  viewBox: "0 0 45 41",
  path: (
    <>
      <path
        d="M22.19,41l9.26-24.6h4.28l9.26,24.6h-4.28l-2.19-6.25h-9.88l-2.19,6.25h-4.28ZM6.11,34.85l-2.85-2.87,10.28-10.35c-1.19-1.2-2.27-2.56-3.23-4.1-.97-1.54-1.86-3.28-2.67-5.23h4.28c.68,1.33,1.36,2.49,2.04,3.48.68.99,1.49,1.98,2.44,2.97,1.12-1.13,2.28-2.71,3.49-4.74,1.2-2.03,2.11-3.97,2.72-5.82H0v-4.1h14.25V0h4.07v4.1h14.25v4.1h-5.91c-.71,2.46-1.78,4.99-3.21,7.59-1.43,2.6-2.83,4.58-4.23,5.94l4.89,5.02-1.53,4.2-6.21-6.41-10.28,10.3ZM29.93,31.16h7.33l-3.67-10.45-3.67,10.45Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default TranslatorsIcon;
