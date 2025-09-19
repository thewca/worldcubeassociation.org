import type { GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { paragraphBlock } from "@/blocks/text/paragraph";

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
      blocks: [paragraphBlock],
    },
  ],
};
