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
      localized: true,
      admin: {
        description:
          "Text shown at the top of the Privacy page, above the numbered paragraphs.",
      },
    },
    markdownConvertedField("preamble"),
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [ParagraphBlock],
      admin: {
        description:
          "The paragraphs making up the Privacy page, top to bottom.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
