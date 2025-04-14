"use client";

import { createIcon } from "@chakra-ui/react";

const UsersPersonsIcon = createIcon({
  displayName: "UsersPersonsIcon",
  viewBox: "0 0 45 32",
  path: (
    <>
      <path
        d="M0,32v-5.6c0-1.13.3-2.17.89-3.12.6-.95,1.39-1.67,2.38-2.17,2.11-1.03,4.26-1.81,6.44-2.33,2.18-.52,4.4-.77,6.65-.77s4.47.26,6.65.77c2.18.52,4.33,1.29,6.44,2.33.99.5,1.78,1.23,2.38,2.17.6.95.89,1.99.89,3.12v5.6H0ZM36.82,32v-6c0-1.47-.42-2.88-1.25-4.23-.84-1.35-2.02-2.51-3.55-3.48,1.74.2,3.38.54,4.91,1.03,1.53.48,2.97,1.07,4.3,1.77,1.23.67,2.16,1.41,2.81,2.23s.97,1.71.97,2.67v6h-8.18ZM16.36,16c-2.25,0-4.18-.78-5.78-2.35-1.6-1.57-2.4-3.45-2.4-5.65s.8-4.08,2.4-5.65c1.6-1.57,3.53-2.35,5.78-2.35s4.18.78,5.78,2.35c1.6,1.57,2.4,3.45,2.4,5.65s-.8,4.08-2.4,5.65c-1.6,1.57-3.53,2.35-5.78,2.35ZM36.82,8c0,2.2-.8,4.08-2.4,5.65-1.6,1.57-3.53,2.35-5.78,2.35-.38,0-.85-.04-1.43-.12-.58-.08-1.06-.18-1.43-.27.92-1.07,1.63-2.25,2.12-3.55.49-1.3.74-2.65.74-4.05s-.25-2.75-.74-4.05c-.49-1.3-1.2-2.48-2.12-3.55.48-.17.95-.28,1.43-.33.48-.05.95-.08,1.43-.08,2.25,0,4.18.78,5.78,2.35,1.6,1.57,2.4,3.45,2.4,5.65ZM4.09,28h24.55v-1.6c0-.37-.09-.7-.28-1-.19-.3-.43-.53-.74-.7-1.84-.9-3.7-1.58-5.57-2.03-1.88-.45-3.77-.67-5.68-.67s-3.8.23-5.68.67c-1.88.45-3.73,1.12-5.57,2.03-.31.17-.55.4-.74.7-.19.3-.28.63-.28,1v1.6ZM16.36,12c1.12,0,2.09-.39,2.89-1.18.8-.78,1.2-1.72,1.2-2.82s-.4-2.04-1.2-2.82c-.8-.78-1.76-1.18-2.89-1.18s-2.09.39-2.89,1.18c-.8.78-1.2,1.72-1.2,2.82s.4,2.04,1.2,2.82c.8.78,1.76,1.18,2.89,1.18Z"
        fill="currentColor"
      />
    </>
  ),
});

const UsersPersonsIconPreview = () => {
  return <UsersPersonsIcon size="lg" />;
};

export default UsersPersonsIconPreview;
