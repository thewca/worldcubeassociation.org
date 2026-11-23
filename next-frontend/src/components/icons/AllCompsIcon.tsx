"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

export const AllCompsIcon = createIcon({
  displayName: "AllCompsIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21a5 5 0 00-10 0" />
      <path d="M22 10.5a3.5 3.5 0 00-5.507-2.868" />
      <path d="M7.507 7.632A3.5 3.5 0 002 10.5" />
      <circle cx="12" cy="13" r="3" />
      <circle cx="18.5" cy="4.5" r="2.5" />
      <circle cx="5.5" cy="4.5" r="2.5" />
    </g>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default AllCompsIcon;
