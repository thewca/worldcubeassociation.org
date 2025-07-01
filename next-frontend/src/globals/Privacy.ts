import type { GlobalConfig, Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

const privacyItem: Block = {
  slug: "privacyItem",
  labels: {
    singular: "Item",
    plural: "Items",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
  ],
};

export const Privacy: GlobalConfig = {
  slug: "privacy-page",
  label: "Privacy Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [privacyItem],
    },
  ],
};
