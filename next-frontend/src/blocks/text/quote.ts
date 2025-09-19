import { Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const QuoteBlock: Block = {
  slug: "quote",
  labels: {
    singular: "Quote",
    plural: "Quotes",
  },
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
    {
      name: "quotedPerson",
      type: "text",
      required: true,
      label: "Who is quoted",
    },
  ],
};
