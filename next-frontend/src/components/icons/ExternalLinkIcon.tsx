"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const ExternalLinkIcon = createIcon({
  displayName: "ExternalLinkIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M17.5,7.5v5H5v27.5h27.5v-12.5h5v15c0,.66-.26,1.3-.73,1.77-.47.47-1.1.73-1.77.73H2.5c-.66,0-1.3-.26-1.77-.73-.47-.47-.73-1.1-.73-1.77V10c0-.66.26-1.3.73-1.77.47-.47,1.1-.73,1.77-.73h15ZM45,0v20h-5v-11.47l-19.48,19.48-3.53-3.53L36.46,5h-11.46V0h20Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default ExternalLinkIcon;
