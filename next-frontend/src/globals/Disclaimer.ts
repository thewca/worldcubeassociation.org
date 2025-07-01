import type { GlobalConfig, Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

const disclaimerItem: Block = {
  slug: "disclaimerItem",
  labels: {
    singular: "Item",
    plural: "Items",
  },
  fields: [
    {
      name: "title",
      type: "text",
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
  ],
};

export const Disclaimer: GlobalConfig = {
  slug: "disclaimer-page",
  label: "Disclaimer Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [disclaimerItem],
    },
  ],
};
