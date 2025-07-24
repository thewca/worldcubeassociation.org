"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const VenueIcon = createIcon({
  displayName: "VenueIcon",
  viewBox: "0 0 45 41",
  path: (
    <>
      <path
        d="M45,41V0h-22.5v9.11H0v31.89h45ZM40.5,36.44h-4.5v-4.56h4.5v4.56ZM40.5,27.33h-4.5v-4.56h4.5v4.56ZM40.5,18.22h-4.5v-4.56h4.5v4.56ZM40.5,9.11h-4.5v-4.56h4.5v4.56ZM31.5,36.44h-4.5v-4.56h4.5v4.56ZM31.5,27.33h-4.5v-4.56h4.5v4.56ZM31.5,18.22h-4.5v-4.56h4.5v4.56ZM31.5,9.11h-4.5v-4.56h4.5v4.56ZM22.5,36.44H4.5V13.67h18v4.56h-4.5v4.56h4.5v4.56h-4.5v4.56h4.5v4.56ZM13.5,22.78v-4.56h-4.5v4.56h4.5ZM13.5,31.89v-4.56h-4.5v4.56h4.5Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default VenueIcon;
