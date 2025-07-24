"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const NewCompIcon = createIcon({
  displayName: "NewCompIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M19.29,25.71H0v-6.43h19.29V0h6.43v19.29h19.29v6.43h-19.29v19.29h-6.43v-19.29Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default NewCompIcon;
