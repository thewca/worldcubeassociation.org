"use client";

import { createIcon } from "@chakra-ui/react";

const ManageTabsIcon = createIcon({
  displayName: "ManageTabsIcon",
  viewBox: "0 0 45 29",
  path: (
    <>
      <path
        d="M0,29v-4.83h15v4.83H0ZM0,16.92v-4.83h30v4.83H0ZM0,4.83V0h45v4.83H0Z"
        fill="currentColor"
      />
    </>
  ),
});

const ManageTabsIconPreview = () => {
  return <ManageTabsIcon size="lg" />;
};

export default ManageTabsIconPreview;
