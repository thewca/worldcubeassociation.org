import type { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";

export const Disclaimer: GlobalConfig = {
  slug: "disclaimer-page",
  label: "Disclaimer Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [ParagraphBlock],
    },
  ],
};
