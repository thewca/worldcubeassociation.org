"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const EditIcon = createIcon({
  displayName: "EditIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M5,40h3.56l24.44-24.44-3.56-3.56L5,36.44v3.56ZM0,45v-10.62L33,1.44c.5-.46,1.05-.81,1.66-1.06.6-.25,1.24-.38,1.91-.38s1.31.12,1.94.38,1.17.62,1.62,1.12l3.44,3.5c.5.46.86,1,1.09,1.62.23.62.34,1.25.34,1.88,0,.67-.11,1.3-.34,1.91-.23.6-.59,1.16-1.09,1.66L10.62,45H0ZM31.19,13.81l-1.75-1.81,3.56,3.56-1.81-1.75Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default EditIcon;
