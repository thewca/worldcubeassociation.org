"use client";

import { createIcon } from "@chakra-ui/react";

const WcaLiveIcon = createIcon({
  displayName: "WcaLiveIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <circle cx="22.5" cy="22.5" r="22.5" fill="currentColor" />
    </>
  ),
});

const WcaLiveIconPreview = () => {
  return <WcaLiveIcon size="lg" />;
};

export default WcaLiveIconPreview;
