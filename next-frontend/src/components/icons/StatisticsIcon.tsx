"use client";

import { createIcon } from "@chakra-ui/react";

const StatisticsIcon = createIcon({
  displayName: "StatisticsIcon",
  viewBox: "0 0 45 29",
  path: (
    <>
      <path
        d="M3.38,29l-3.38-3.35L16.88,8.92l9,8.92L41.85,0l3.15,3.12-19.12,21.42-9-8.92L3.38,29Z"
        fill="currentColor"
      />
    </>
  ),
});

const StatisticsIconPreview = () => {
  return <StatisticsIcon size="lg" />;
};

export default StatisticsIconPreview;
