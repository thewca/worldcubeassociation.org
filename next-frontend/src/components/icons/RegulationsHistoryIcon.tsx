"use client";

import { createIcon } from "@chakra-ui/react";

const RegulationsHistoryIcon = createIcon({
  displayName: "RegulationsHistoryIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M22.5,45c-5.75,0-10.76-1.91-15.03-5.72C3.2,35.47.75,30.71.12,25h5.12c.58,4.33,2.51,7.92,5.78,10.75,3.27,2.83,7.09,4.25,11.47,4.25,4.88,0,9.01-1.7,12.41-5.09,3.4-3.4,5.09-7.53,5.09-12.41s-1.7-9.01-5.09-12.41c-3.4-3.4-7.53-5.09-12.41-5.09-2.88,0-5.56.67-8.06,2s-4.6,3.17-6.31,5.5h6.88v5H0V2.5h5v5.88c2.12-2.67,4.72-4.73,7.78-6.19,3.06-1.46,6.3-2.19,9.72-2.19,3.12,0,6.05.59,8.78,1.78,2.73,1.19,5.1,2.79,7.12,4.81,2.02,2.02,3.62,4.4,4.81,7.13,1.19,2.73,1.78,5.66,1.78,8.78s-.59,6.05-1.78,8.78c-1.19,2.73-2.79,5.1-4.81,7.12-2.02,2.02-4.4,3.62-7.12,4.81-2.73,1.19-5.66,1.78-8.78,1.78ZM29.5,33l-9.5-9.5v-13.5h5v11.5l8,8-3.5,3.5Z"
        fill="currentColor"
      />
    </>
  ),
});

const RegulationsHistoryIconPreview = () => {
  return <RegulationsHistoryIcon size="lg" />;
};

export default RegulationsHistoryIconPreview;
