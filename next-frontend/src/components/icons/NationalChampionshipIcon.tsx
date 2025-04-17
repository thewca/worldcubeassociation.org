"use client";

import { createIcon } from "@chakra-ui/react";

const NationalChampionshipIcon = createIcon({
  displayName: "NationalChampionshipIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M10,45v-5h10v-7.75c-2.04-.46-3.86-1.32-5.47-2.59-1.6-1.27-2.78-2.86-3.53-4.78-3.12-.38-5.74-1.74-7.84-4.09C1.05,18.43,0,15.67,0,12.5v-2.5c0-1.38.49-2.55,1.47-3.53.98-.98,2.16-1.47,3.53-1.47h5V0h25v5h5c1.38,0,2.55.49,3.53,1.47.98.98,1.47,2.16,1.47,3.53v2.5c0,3.17-1.05,5.93-3.16,8.28-2.1,2.35-4.72,3.72-7.84,4.09-.75,1.92-1.93,3.51-3.53,4.78-1.6,1.27-3.43,2.14-5.47,2.59v7.75h10v5H10ZM10,19.5v-9.5h-5v2.5c0,1.58.46,3.01,1.38,4.28.92,1.27,2.12,2.18,3.62,2.72ZM22.5,27.5c2.08,0,3.85-.73,5.31-2.19s2.19-3.23,2.19-5.31V5h-15v15c0,2.08.73,3.85,2.19,5.31s3.23,2.19,5.31,2.19ZM35,19.5c1.5-.54,2.71-1.45,3.62-2.72.92-1.27,1.38-2.7,1.38-4.28v-2.5h-5v9.5Z"
        fill="currentColor"
      />
      <path
        d="M22.96,10.1l1.24,3.81h4l-3.24,2.35,1.24,3.81-3.24-2.35-3.24,2.35,1.24-3.81-3.24-2.35h4l1.24-3.81Z"
        fill="currentColor"
      />
    </>
  ),
});

const NationalChampionshipIconPreview = () => {
  return <NationalChampionshipIcon size="lg" />;
};

export default NationalChampionshipIconPreview;
