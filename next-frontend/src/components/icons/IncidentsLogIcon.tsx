"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const IncidentsLogIcon = createIcon({
  displayName: "IncidentsLogIcon",
  viewBox: "0 0 45 39",
  path: (
    <>
      <path
        d="M0,39L22.5,0l22.5,39H0ZM7.06,34.89h30.89l-15.44-26.68-15.44,26.68ZM22.5,32.84c.58,0,1.07-.2,1.46-.59.39-.39.59-.88.59-1.46s-.2-1.07-.59-1.46c-.39-.39-.88-.59-1.46-.59s-1.07.2-1.46.59c-.39.39-.59.88-.59,1.46s.2,1.07.59,1.46c.39.39.88.59,1.46.59ZM20.45,26.68h4.09v-10.26h-4.09v10.26Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default IncidentsLogIcon;
