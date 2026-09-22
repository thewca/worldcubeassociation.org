import { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

export const AboutRegulations: GlobalConfig = {
  slug: "about-regulations-page",
  label: "About Regulations Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [ParagraphBlock],
      admin: {
        description:
          "The paragraphs making up the About Regulations page, top to bottom.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
