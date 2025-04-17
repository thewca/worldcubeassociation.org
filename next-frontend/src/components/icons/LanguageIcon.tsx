"use client";

import { createIcon } from "@chakra-ui/react";

const LanguageIcon = createIcon({
  displayName: "LanguageIcon",
  viewBox: "0 0 45 45",
  path: (
    <>
      <path
        d="M22.5,45c-3.08,0-5.98-.59-8.72-1.77-2.74-1.18-5.13-2.79-7.17-4.84-2.04-2.04-3.66-4.43-4.84-7.17-1.18-2.74-1.77-5.64-1.77-8.72s.59-6.03,1.77-8.75c1.18-2.72,2.79-5.1,4.84-7.14,2.04-2.04,4.43-3.66,7.17-4.84,2.74-1.18,5.64-1.77,8.72-1.77s6.03.59,8.75,1.77c2.72,1.18,5.1,2.79,7.14,4.84,2.04,2.04,3.66,4.43,4.84,7.14,1.18,2.72,1.77,5.63,1.77,8.75s-.59,5.98-1.77,8.72c-1.18,2.74-2.79,5.13-4.84,7.17-2.04,2.04-4.42,3.66-7.14,4.84-2.72,1.18-5.63,1.77-8.75,1.77ZM22.5,40.39c.98-1.35,1.82-2.76,2.53-4.22.71-1.46,1.29-3.02,1.74-4.67h-8.55c.45,1.65,1.03,3.21,1.74,4.67.71,1.46,1.56,2.87,2.53,4.22ZM16.65,39.49c-.67-1.24-1.27-2.52-1.77-3.85-.51-1.33-.93-2.71-1.27-4.13h-6.64c1.09,1.88,2.45,3.51,4.08,4.89,1.63,1.39,3.5,2.42,5.6,3.09ZM28.35,39.49c2.1-.67,3.97-1.71,5.6-3.09,1.63-1.39,2.99-3.02,4.08-4.89h-6.64c-.34,1.42-.76,2.8-1.27,4.13-.51,1.33-1.1,2.62-1.77,3.85ZM5.06,27h7.65c-.11-.75-.2-1.49-.25-2.22-.06-.73-.08-1.49-.08-2.28s.03-1.55.08-2.28c.06-.73.14-1.47.25-2.22h-7.65c-.19.75-.33,1.49-.42,2.22-.09.73-.14,1.49-.14,2.28s.05,1.55.14,2.28c.09.73.23,1.47.42,2.22ZM17.21,27h10.58c.11-.75.2-1.49.25-2.22.06-.73.08-1.49.08-2.28s-.03-1.55-.08-2.28c-.06-.73-.14-1.47-.25-2.22h-10.58c-.11.75-.2,1.49-.25,2.22-.06.73-.08,1.49-.08,2.28s.03,1.55.08,2.28c.06.73.14,1.47.25,2.22ZM32.29,27h7.65c.19-.75.33-1.49.42-2.22.09-.73.14-1.49.14-2.28s-.05-1.55-.14-2.28c-.09-.73-.23-1.47-.42-2.22h-7.65c.11.75.2,1.49.25,2.22.06.73.08,1.49.08,2.28s-.03,1.55-.08,2.28c-.06.73-.14,1.47-.25,2.22ZM31.39,13.5h6.64c-1.09-1.88-2.45-3.51-4.08-4.89-1.63-1.39-3.5-2.42-5.6-3.09.67,1.24,1.27,2.52,1.77,3.85.51,1.33.93,2.71,1.27,4.13ZM18.23,13.5h8.55c-.45-1.65-1.03-3.21-1.74-4.67-.71-1.46-1.56-2.87-2.53-4.22-.98,1.35-1.82,2.76-2.53,4.22-.71,1.46-1.29,3.02-1.74,4.67ZM6.97,13.5h6.64c.34-1.43.76-2.8,1.27-4.13.51-1.33,1.1-2.62,1.77-3.85-2.1.68-3.97,1.71-5.6,3.09-1.63,1.39-2.99,3.02-4.08,4.89Z"
        fill="currentColor"
      />
    </>
  ),
});

const LanguageIconPreview = () => {
  return <LanguageIcon size="lg" />;
};

export default LanguageIconPreview;
