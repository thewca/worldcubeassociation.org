"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const RegistrationIcon = createIcon({
  displayName: "RegistrationIcon",
  viewBox: "0 0 45 37",
  path: (
    <>
      <path
        d="M15.75,32.38h24.75v-6.19H15.75v6.19ZM4.5,10.81h6.75v-6.19h-6.75v6.19ZM4.5,21.62h6.75v-6.19h-6.75v6.19ZM4.5,32.38h6.75v-6.19h-6.75v6.19ZM15.75,21.62h24.75v-6.19H15.75v6.19ZM15.75,10.81h24.75v-6.19H15.75v6.19ZM4.5,37c-1.24,0-2.3-.45-3.18-1.36-.88-.91-1.32-1.99-1.32-3.27V4.62c0-1.27.44-2.36,1.32-3.27.88-.91,1.94-1.36,3.18-1.36h36c1.24,0,2.3.45,3.18,1.36.88.91,1.32,1.99,1.32,3.27v27.75c0,1.27-.44,2.36-1.32,3.27-.88.91-1.94,1.36-3.18,1.36H4.5Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default RegistrationIcon;
