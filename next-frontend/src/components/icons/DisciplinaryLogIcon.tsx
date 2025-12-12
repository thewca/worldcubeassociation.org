"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const DisciplinaryLogIcon = createIcon({
  displayName: "DisciplinaryLogIcon",
  viewBox: "0 0 44 45",
  path: (
    <>
      <path
        d="M44,0l-24.64,11.25H5.5c-3.08,0-5.5,2.48-5.5,5.62v6.75c0,3.15,2.42,5.62,5.5,5.62h1.1v9c0,3.83,2.86,6.75,6.6,6.75s6.6-2.92,6.6-6.75v-8.77l24.2,11.25V0ZM5.5,24.75c-.66,0-1.1-.45-1.1-1.12v-6.75c0-.67.44-1.12,1.1-1.12h12.1v9H5.5ZM15.4,38.25c0,1.35-.88,2.25-2.2,2.25s-2.2-.9-2.2-2.25v-9h4.4v9ZM39.6,33.75l-17.6-8.1v-10.57l17.6-8.1v26.78Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default DisciplinaryLogIcon;
