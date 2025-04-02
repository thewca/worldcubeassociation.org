"use client";

import { createIcon } from "@chakra-ui/react";

const MenuIcon = createIcon({
  displayName: "MenuIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <rect width="12.04" height="12.04" rx="2" ry="2" fill="currentColor" />
      <rect
        y="16.48"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        y="32.96"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        x="16.48"
        y="16.48"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        x="16.48"
        y="32.96"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        x="32.96"
        y="16.48"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        x="32.96"
        y="32.96"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        x="16.48"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        x="32.96"
        width="12.04"
        height="12.04"
        rx="2"
        ry="2"
        fill="currentColor"
      />
    </>
  ),
});

const MenuIconPreview = () => {
  return <MenuIcon size="lg" />;
};

export default MenuIconPreview;
