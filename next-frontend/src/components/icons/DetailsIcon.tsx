"use client";

import { createIcon } from "@chakra-ui/react";

const DetailsIcon = createIcon({
  displayName: "DetailsIcon",
  viewBox: "0 0 43 45",
  path: (
    <>
      <path
        d="M30.55,40.5h2.26v-9h-2.26v9ZM31.68,29.25c.3,0,.57-.11.79-.34s.34-.49.34-.79-.11-.56-.34-.79-.49-.34-.79-.34-.57.11-.79.34c-.23.23-.34.49-.34.79s.11.56.34.79c.23.23.49.34.79.34ZM9.05,27h8.32c.41-.86.9-1.67,1.44-2.42s1.16-1.44,1.84-2.08h-11.6v4.5ZM9.05,36h6.96c-.11-.75-.17-1.5-.17-2.25s.06-1.5.17-2.25h-6.96v4.5ZM4.53,45c-1.24,0-2.31-.44-3.2-1.32-.89-.88-1.33-1.94-1.33-3.18V4.5c0-1.24.44-2.3,1.33-3.18.89-.88,1.95-1.32,3.2-1.32h18.11l13.58,13.5v5.17c-.72-.22-1.45-.39-2.21-.51-.75-.11-1.53-.17-2.32-.17v-2.25h-11.32V4.5H4.53v36h12.84c.41.86.9,1.67,1.44,2.42.55.75,1.16,1.44,1.84,2.08H4.53ZM31.68,22.5c3.13,0,5.8,1.1,8.01,3.29,2.21,2.19,3.31,4.85,3.31,7.96s-1.1,5.77-3.31,7.96c-2.21,2.19-4.88,3.29-8.01,3.29s-5.8-1.1-8.01-3.29c-2.21-2.19-3.31-4.85-3.31-7.96s1.1-5.77,3.31-7.96c2.21-2.19,4.88-3.29,8.01-3.29Z"
        fill="currentColor"
      />
    </>
  ),
});

const DetailsIconPreview = () => {
  return <DetailsIcon size="lg" />;
};

export default DetailsIconPreview;
