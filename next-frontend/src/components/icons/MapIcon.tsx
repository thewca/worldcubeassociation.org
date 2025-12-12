"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const MapIcon = createIcon({
  displayName: "MapIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M30,45l-15-5.25-11.62,4.5c-.83.33-1.6.24-2.31-.28-.71-.52-1.06-1.22-1.06-2.09V6.88c0-.54.16-1.02.47-1.44s.74-.73,1.28-.94L15,0l15,5.25L41.62.75c.83-.33,1.6-.24,2.31.28.71.52,1.06,1.22,1.06,2.09v35c0,.54-.16,1.02-.47,1.44-.31.42-.74.73-1.28.94l-13.25,4.5ZM27.5,38.88V9.62l-10-3.5v29.25l10,3.5ZM32.5,38.88l7.5-2.5V6.75l-7.5,2.88v29.25ZM5,38.25l7.5-2.88V6.12l-7.5,2.5v29.62Z"
        fill="currentColor"
      />
    </>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default MapIcon;
