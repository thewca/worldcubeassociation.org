import { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { regulationsCommitteeAccess } from "@/payload.access";

export const AboutRegulations: GlobalConfig = {
  slug: "about-regulations-page",
  access: {
    update: regulationsCommitteeAccess,
  },
  label: "About Regulations Page",
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
