"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const DownloadIcon = createIcon({
  displayName: "DownloadIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M22.5,33.75l-14.06-14.06,3.94-4.08,7.31,7.31V0h5.62v22.92l7.31-7.31,3.94,4.08-14.06,14.06ZM5.62,45c-1.55,0-2.87-.55-3.97-1.65-1.1-1.1-1.65-2.43-1.65-3.97v-8.44h5.62v8.44h33.75v-8.44h5.62v8.44c0,1.55-.55,2.87-1.65,3.97-1.1,1.1-2.43,1.65-3.97,1.65H5.62Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default DownloadIcon;
