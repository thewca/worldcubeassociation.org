"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const AdminResultsIcon = createIcon({
  displayName: "AdminResultsIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M6.75,45c-1.24,0-2.3-.44-3.18-1.32-.88-.88-1.32-1.94-1.32-3.18V15.13c-.67-.41-1.22-.95-1.63-1.6-.41-.66-.62-1.42-.62-2.28v-6.75c0-1.24.44-2.3,1.32-3.18.88-.88,1.94-1.32,3.18-1.32h36c1.24,0,2.3.44,3.18,1.32.88.88,1.32,1.94,1.32,3.18v6.75c0,.86-.21,1.62-.62,2.28-.41.66-.96,1.19-1.63,1.6v25.37c0,1.24-.44,2.3-1.32,3.18-.88.88-1.94,1.32-3.18,1.32H6.75ZM6.75,15.75v24.75h31.5V15.75H6.75ZM4.5,11.25h36v-6.75H4.5v6.75ZM15.75,27h13.5v-4.5h-13.5v4.5Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default AdminResultsIcon;
