import type { GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

export const Privacy: GlobalConfig = {
  slug: "privacy-page",
  label: "Privacy Page",
  fields: [
    {
      name: "preamble",
      type: "richText",
      required: true,
    },
    markdownConvertedField("preamble"),
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
