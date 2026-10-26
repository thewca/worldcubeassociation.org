import type { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { marketingTeamAccess } from "@/payload.access";

export const Disclaimer: GlobalConfig = {
  slug: "disclaimer-page",
  access: {
    update: marketingTeamAccess,
  },
  label: "Disclaimer Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [ParagraphBlock],
      admin: {
        description:
          "The paragraphs making up the Disclaimer page, top to bottom.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
