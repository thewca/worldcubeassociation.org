import type { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

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
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
