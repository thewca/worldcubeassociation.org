"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const YoutubeIcon = createIcon({
  displayName: "YoutubeIcon",
  viewBox: "0 0 45 31",
  path: (
    <>
      <path
        d="M44.07,4.85c-.52-1.9-2.04-3.39-3.97-3.9-3.52-.95-17.61-.95-17.61-.95,0,0-14.09,0-17.61.91-1.89.51-3.45,2.04-3.97,3.94-.93,3.46-.93,10.65-.93,10.65,0,0,0,7.22.93,10.65.52,1.9,2.04,3.39,3.97,3.9,3.56.95,17.61.95,17.61.95,0,0,14.09,0,17.61-.91,1.93-.51,3.45-2.01,3.97-3.9.93-3.46.93-10.65.93-10.65,0,0,.04-7.22-.93-10.69ZM18.01,22.14v-13.28l11.71,6.64-11.71,6.64Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default YoutubeIcon;
