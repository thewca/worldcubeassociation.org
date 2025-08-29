"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const ContactIcon = createIcon({
  displayName: "ContactIcon",
  viewBox: "0 0 45 36",
  path: (
    <>
      <path
        d="M4.5,36c-1.24,0-2.3-.44-3.18-1.32-.88-.88-1.32-1.94-1.32-3.18V4.5c0-1.24.44-2.3,1.32-3.18.88-.88,1.94-1.32,3.18-1.32h36c1.24,0,2.3.44,3.18,1.32.88.88,1.32,1.94,1.32,3.18v27c0,1.24-.44,2.3-1.32,3.18-.88.88-1.94,1.32-3.18,1.32H4.5ZM22.5,20.25L4.5,9v22.5h36V9l-18,11.25ZM22.5,15.75l18-11.25H4.5l18,11.25ZM4.5,9v-4.5,27V9Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default ContactIcon;
