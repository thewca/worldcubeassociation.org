"use client";

import React from "react";
import { createIcon } from "@chakra-ui/react";

const UsersPersonsIcon = createIcon({
  displayName: "UsersPersonsIcon",
  viewBox: "0 0 24 24",
  path: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.95 10.05a7 7 0 011.412 7.872 1 1 0 00-.058.787l.675 2.089a1 1 0 01-1.236 1.168l-2.155-.631a1 1 0 00-.745.06 7 7 0 01-7.793-1.445" />
      <path d="M2.696 12.708a1 1 0 00-.058-.785 7 7 0 113.518 3.473 1 1 0 00-.744-.061l-2.155.63a1 1 0 01-1.236-1.167z" />
    </g>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

export default UsersPersonsIcon;
